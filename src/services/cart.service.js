import { CartDTO } from '../dto/cart.dto.js';
import { cartRepository, productRepository, ticketRepository } from '../repositories/index.js';
import { purchaseEmail } from '../templates/emails.js';
import { AppError } from '../utils/customError.js';
import { mailService } from './mail.service.js';

const round = (n) => Math.round(n * 100) / 100;

const parseQuantity = (value, { defaultValue } = {}) => {
  if (value === undefined && defaultValue !== undefined) return defaultValue;
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw AppError.badRequest('La cantidad debe ser un entero mayor o igual a 1');
  }
  return quantity;
};

class CartService {
  async getById(cartId) {
    const cart = await cartRepository.getByIdPopulated(cartId);
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    return new CartDTO(cart);
  }

  async assertProductAvailable(productId) {
    const product = await productRepository.getById(productId);
    if (!product) throw AppError.notFound('Producto no encontrado');
    if (!product.status) throw AppError.badRequest('El producto no está disponible para la venta');
    return product;
  }

  async addProduct(cartId, productId, rawQuantity) {
    const quantity = parseQuantity(rawQuantity, { defaultValue: 1 });
    await this.assertProductAvailable(productId);
    const cart = await cartRepository.addProduct(cartId, productId, quantity);
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    return this.getById(cartId);
  }

  async updateQuantity(cartId, productId, rawQuantity) {
    const quantity = parseQuantity(rawQuantity);
    const cart = await cartRepository.updateProductQuantity(cartId, productId, quantity);
    if (!cart) throw AppError.notFound('Carrito o producto en carrito no encontrado');
    return this.getById(cartId);
  }

  async replaceProducts(cartId, items) {
    if (!Array.isArray(items)) {
      throw AppError.badRequest('Se espera un arreglo de productos [{ product, quantity }]');
    }
    // Consolida duplicados y valida todo en una sola consulta (sin N+1).
    const merged = new Map();
    for (const item of items) {
      const productId = String(item?.product ?? '');
      const quantity = parseQuantity(item?.quantity, { defaultValue: 1 });
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    }
    const ids = [...merged.keys()];
    const found = await productRepository.getByIds(ids);
    const foundIds = new Set(found.filter((p) => p.status).map((p) => String(p._id)));
    const invalid = ids.filter((id) => !foundIds.has(id));
    if (invalid.length) {
      throw AppError.badRequest('Algunos productos no existen o no están disponibles', { invalid });
    }
    const cart = await cartRepository.replaceProducts(
      cartId,
      ids.map((product) => ({ product, quantity: merged.get(product) })),
    );
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    return this.getById(cartId);
  }

  async removeProduct(cartId, productId) {
    const cart = await cartRepository.removeProduct(cartId, productId);
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    return this.getById(cartId);
  }

  async clear(cartId) {
    const cart = await cartRepository.clear(cartId);
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    return this.getById(cartId);
  }

  /**
   * Finaliza la compra del carrito.
   * - Verifica stock producto por producto y lo descuenta de forma atómica.
   * - Genera un Ticket solo con lo que efectivamente se pudo comprar.
   * - Los productos sin stock suficiente permanecen en el carrito (compra incompleta).
   * - Si falla la creación del ticket, se revierte el stock descontado.
   */
  async purchase(cartId, purchaser) {
    const cart = await cartRepository.getByIdPopulated(cartId);
    if (!cart) throw AppError.notFound('Carrito no encontrado');
    if (!cart.products.length) throw AppError.badRequest('El carrito está vacío');

    const purchased = [];
    const notProcessed = [];

    for (const item of cart.products) {
      const product = item.product;
      if (!product) continue; // producto eliminado del catálogo: se descarta del carrito

      const updated = await productRepository.decrementStockIfAvailable(product._id, item.quantity);
      if (updated) {
        purchased.push({
          product: product._id,
          title: product.title,
          price: product.price,
          quantity: item.quantity,
          subtotal: round(product.price * item.quantity),
        });
      } else {
        notProcessed.push({
          product: String(product._id),
          title: product.title,
          requested: item.quantity,
          available: product.status ? product.stock : 0,
        });
      }
    }

    if (!purchased.length) {
      throw AppError.conflict('No hay stock suficiente para ningún producto del carrito', {
        notProcessed,
      });
    }

    const amount = round(purchased.reduce((acc, p) => acc + p.subtotal, 0));

    let ticket;
    try {
      ticket = await ticketRepository.create({ amount, purchaser: purchaser.email, products: purchased });
    } catch (error) {
      await Promise.all(purchased.map((p) => productRepository.incrementStock(p.product, p.quantity)));
      throw error;
    }

    // El carrito conserva únicamente los productos que no pudieron comprarse.
    await cartRepository.replaceProducts(
      cartId,
      notProcessed.map((p) => ({ product: p.product, quantity: p.requested })),
    );

    const mail = purchaseEmail({ firstName: purchaser.first_name, ticket, notProcessed });
    mailService.send({ to: purchaser.email, ...mail }).catch((err) =>
      console.error('[mail] No se pudo enviar la confirmación de compra:', err.message),
    );

    return {
      status: notProcessed.length ? 'incomplete' : 'complete',
      ticket,
      notProcessed,
      notProcessedIds: notProcessed.map((p) => p.product),
    };
  }
}

export const cartService = new CartService();

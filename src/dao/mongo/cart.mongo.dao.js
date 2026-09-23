import BaseMongoDAO from './base.mongo.dao.js';
import { CartModel } from './models/cart.model.js';

export default class CartMongoDAO extends BaseMongoDAO {
  constructor() {
    super(CartModel);
  }

  async getByIdPopulated(id) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model.findById(id).populate('products.product').lean();
  }

  // Incrementa la cantidad si el producto ya existe; si no, lo agrega. Operaciones atómicas.
  async addProduct(cartId, productId, quantity = 1) {
    if (!BaseMongoDAO.isValidId(cartId) || !BaseMongoDAO.isValidId(productId)) return null;

    const incremented = await this.model.findOneAndUpdate(
      { _id: cartId, 'products.product': productId },
      { $inc: { 'products.$.quantity': quantity } },
      { new: true },
    );
    if (incremented) return incremented.toObject();

    const pushed = await this.model.findOneAndUpdate(
      { _id: cartId, 'products.product': { $ne: productId } },
      { $push: { products: { product: productId, quantity } } },
      { new: true },
    );
    if (pushed) return pushed.toObject();

    // Otra petición concurrente insertó el producto entre ambos pasos: reintentar el incremento.
    return this.model
      .findOneAndUpdate(
        { _id: cartId, 'products.product': productId },
        { $inc: { 'products.$.quantity': quantity } },
        { new: true },
      )
      .lean();
  }

  async updateProductQuantity(cartId, productId, quantity) {
    if (!BaseMongoDAO.isValidId(cartId) || !BaseMongoDAO.isValidId(productId)) return null;
    return this.model
      .findOneAndUpdate(
        { _id: cartId, 'products.product': productId },
        { $set: { 'products.$.quantity': quantity } },
        { new: true, runValidators: true },
      )
      .lean();
  }

  async removeProduct(cartId, productId) {
    if (!BaseMongoDAO.isValidId(cartId) || !BaseMongoDAO.isValidId(productId)) return null;
    return this.model
      .findByIdAndUpdate(cartId, { $pull: { products: { product: productId } } }, { new: true })
      .lean();
  }

  async replaceProducts(cartId, products) {
    if (!BaseMongoDAO.isValidId(cartId)) return null;
    return this.model
      .findByIdAndUpdate(cartId, { $set: { products } }, { new: true, runValidators: true })
      .lean();
  }

  async clear(cartId) {
    return this.replaceProducts(cartId, []);
  }
}

import { cartService } from '../services/cart.service.js';

export const getCart = async (req, res) => {
  const cart = await cartService.getById(req.params.cid);
  res.json({ status: 'success', payload: cart });
};

export const addProductToCart = async (req, res) => {
  const cart = await cartService.addProduct(req.params.cid, req.params.pid, req.body?.quantity);
  res.json({ status: 'success', message: 'Producto agregado al carrito', payload: cart });
};

export const updateProductQuantity = async (req, res) => {
  const cart = await cartService.updateQuantity(req.params.cid, req.params.pid, req.body?.quantity);
  res.json({ status: 'success', message: 'Cantidad actualizada', payload: cart });
};

export const replaceCartProducts = async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body?.products;
  const cart = await cartService.replaceProducts(req.params.cid, items);
  res.json({ status: 'success', message: 'Carrito actualizado', payload: cart });
};

export const removeProductFromCart = async (req, res) => {
  const cart = await cartService.removeProduct(req.params.cid, req.params.pid);
  res.json({ status: 'success', message: 'Producto eliminado del carrito', payload: cart });
};

export const clearCart = async (req, res) => {
  const cart = await cartService.clear(req.params.cid);
  res.json({ status: 'success', message: 'Carrito vaciado', payload: cart });
};

export const purchaseCart = async (req, res) => {
  const result = await cartService.purchase(req.params.cid, req.user);
  const complete = result.status === 'complete';
  res.status(201).json({
    status: 'success',
    message: complete
      ? 'Compra realizada con éxito'
      : 'Compra realizada parcialmente: algunos productos no tenían stock suficiente y permanecen en el carrito',
    payload: result,
  });
};

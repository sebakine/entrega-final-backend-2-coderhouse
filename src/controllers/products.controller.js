import { productService } from '../services/product.service.js';

export const getProducts = async (req, res) => {
  const baseUrl = `${req.baseUrl}`;
  const result = await productService.list(req.query, baseUrl);
  res.json({ status: 'success', ...result });
};

export const getProductById = async (req, res) => {
  const product = await productService.getById(req.params.pid);
  res.json({ status: 'success', payload: product });
};

export const createProduct = async (req, res) => {
  const product = await productService.create(req.body);
  res.status(201).json({ status: 'success', message: 'Producto creado', payload: product });
};

export const updateProduct = async (req, res) => {
  const product = await productService.update(req.params.pid, req.body);
  res.json({ status: 'success', message: 'Producto actualizado', payload: product });
};

export const deleteProduct = async (req, res) => {
  const product = await productService.delete(req.params.pid);
  res.json({ status: 'success', message: 'Producto eliminado', payload: product });
};

import { ProductDTO, ProductInputDTO } from '../dto/product.dto.js';
import { productRepository } from '../repositories/index.js';
import { AppError } from '../utils/customError.js';

const buildLink = (baseUrl, query, page) => {
  if (!page) return null;
  const params = new URLSearchParams({ ...query, page: String(page) });
  return `${baseUrl}?${params.toString()}`;
};

class ProductService {
  async list({ limit = 10, page = 1, sort, query } = {}, baseUrl = '/api/products') {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    // query admite "category:<nombre>", "status:true|false", "available" o un nombre de categoría.
    const filter = {};
    if (query) {
      const [key, value] = String(query).split(':');
      if (key === 'status' && value !== undefined) filter.status = value === 'true';
      else if (key === 'category' && value) filter.category = value;
      else if (key === 'available') filter.stock = { $gt: 0 };
      else filter.category = String(query);
    }

    const options = { limit: parsedLimit, page: parsedPage };
    if (sort === 'asc' || sort === 'desc') options.sort = { price: sort === 'asc' ? 1 : -1 };

    const result = await productRepository.paginate(filter, options);
    const linkQuery = { limit: String(parsedLimit) };
    if (sort) linkQuery.sort = sort;
    if (query) linkQuery.query = query;

    return {
      payload: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? buildLink(baseUrl, linkQuery, result.prevPage) : null,
      nextLink: result.hasNextPage ? buildLink(baseUrl, linkQuery, result.nextPage) : null,
    };
  }

  async getById(id) {
    const product = await productRepository.getById(id);
    if (!product) throw AppError.notFound('Producto no encontrado');
    return new ProductDTO(product);
  }

  static validate(input) {
    const missing = input.missingRequiredFields();
    if (missing.length) throw AppError.badRequest('Faltan campos obligatorios', { missing });
    if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
      throw AppError.badRequest('El precio debe ser un número mayor o igual a 0');
    }
    if (input.stock !== undefined && (!Number.isInteger(input.stock) || input.stock < 0)) {
      throw AppError.badRequest('El stock debe ser un entero mayor o igual a 0');
    }
  }

  async create(body) {
    const input = new ProductInputDTO(body);
    ProductService.validate(input);
    if (await productRepository.getByCode(input.code)) {
      throw AppError.conflict(`Ya existe un producto con el código ${input.code}`);
    }
    const product = await productRepository.create({ ...input });
    return new ProductDTO(product);
  }

  async update(id, body) {
    const input = new ProductInputDTO(body, { partial: true });
    if (Object.keys(input).length === 0) {
      throw AppError.badRequest('No se enviaron campos para actualizar');
    }
    ProductService.validate(input);
    if (input.code) {
      const other = await productRepository.getByCode(input.code);
      if (other && String(other._id) !== String(id)) {
        throw AppError.conflict(`Ya existe un producto con el código ${input.code}`);
      }
    }
    const product = await productRepository.update(id, { ...input });
    if (!product) throw AppError.notFound('Producto no encontrado');
    return new ProductDTO(product);
  }

  async delete(id) {
    const product = await productRepository.delete(id);
    if (!product) throw AppError.notFound('Producto no encontrado');
    return new ProductDTO(product);
  }
}

export const productService = new ProductService();

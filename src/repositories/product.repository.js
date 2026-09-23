import { ProductDTO } from '../dto/product.dto.js';

export default class ProductRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async paginate(filter, options) {
    const result = await this.dao.paginate(filter, options);
    return { ...result, docs: result.docs.map((p) => new ProductDTO(p)) };
  }

  getById(id) {
    return this.dao.getById(id);
  }

  getByCode(code) {
    return this.dao.getByCode(code);
  }

  getByIds(ids) {
    return this.dao.getByIds(ids);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }

  delete(id) {
    return this.dao.delete(id);
  }

  decrementStockIfAvailable(id, quantity) {
    return this.dao.decrementStockIfAvailable(id, quantity);
  }

  incrementStock(id, quantity) {
    return this.dao.incrementStock(id, quantity);
  }
}

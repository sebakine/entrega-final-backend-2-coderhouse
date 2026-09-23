import BaseMongoDAO from './base.mongo.dao.js';
import { ProductModel } from './models/product.model.js';

export default class ProductMongoDAO extends BaseMongoDAO {
  constructor() {
    super(ProductModel);
  }

  async paginate(filter, options) {
    return this.model.paginate(filter, { ...options, lean: true });
  }

  async getByCode(code) {
    return this.model.findOne({ code }).lean();
  }

  async getByIds(ids) {
    const validIds = ids.filter((id) => BaseMongoDAO.isValidId(id));
    return this.model.find({ _id: { $in: validIds } }).lean();
  }

  // Descuenta stock de forma atómica: solo actualiza si hay stock suficiente.
  // Evita condiciones de carrera entre compras simultáneas.
  async decrementStockIfAvailable(id, quantity) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model
      .findOneAndUpdate(
        { _id: id, status: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      )
      .lean();
  }

  async incrementStock(id, quantity) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model
      .findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true })
      .lean();
  }
}

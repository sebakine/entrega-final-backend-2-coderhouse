import mongoose from 'mongoose';

// DAO genérico: única capa que conoce Mongoose. Devuelve objetos planos (lean)
// para que las capas superiores no dependan de documentos de Mongoose.
export default class BaseMongoDAO {
  constructor(model) {
    this.model = model;
  }

  static isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  async getAll(filter = {}, projection = null) {
    return this.model.find(filter, projection).lean();
  }

  async getById(id) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model.findById(id).lean();
  }

  async getOne(filter) {
    return this.model.findOne(filter).lean();
  }

  async create(data) {
    const doc = await this.model.create(data);
    return doc.toObject();
  }

  async update(id, data) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .lean();
  }

  async delete(id) {
    if (!BaseMongoDAO.isValidId(id)) return null;
    return this.model.findByIdAndDelete(id).lean();
  }
}

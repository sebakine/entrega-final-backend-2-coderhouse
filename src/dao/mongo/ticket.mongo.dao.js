import BaseMongoDAO from './base.mongo.dao.js';
import { TicketModel } from './models/ticket.model.js';

export default class TicketMongoDAO extends BaseMongoDAO {
  constructor() {
    super(TicketModel);
  }

  async getByCode(code) {
    return this.model.findOne({ code }).lean();
  }

  async getByPurchaser(email) {
    return this.model
      .find({ purchaser: String(email).toLowerCase() })
      .sort({ purchase_datetime: -1 })
      .lean();
  }
}

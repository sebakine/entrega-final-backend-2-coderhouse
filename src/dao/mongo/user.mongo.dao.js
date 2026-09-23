import BaseMongoDAO from './base.mongo.dao.js';
import { UserModel } from './models/user.model.js';

export default class UserMongoDAO extends BaseMongoDAO {
  constructor() {
    super(UserModel);
  }

  async getByEmail(email) {
    if (!email) return null;
    return this.model.findOne({ email: String(email).toLowerCase().trim() }).lean();
  }

  async getByCart(cartId) {
    if (!BaseMongoDAO.isValidId(cartId)) return null;
    return this.model.findOne({ cart: cartId }).lean();
  }
}

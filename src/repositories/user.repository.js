import { CurrentUserDTO } from '../dto/user.dto.js';

// Repository: intermediario entre la lógica de negocio y el DAO.
// Los services dependen de esta interfaz, nunca del DAO ni de Mongoose.
export default class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }

  getById(id) {
    return this.dao.getById(id);
  }

  getByEmail(email) {
    return this.dao.getByEmail(email);
  }

  getByCart(cartId) {
    return this.dao.getByCart(cartId);
  }

  async getAll() {
    const users = await this.dao.getAll();
    return users.map((user) => new CurrentUserDTO(user));
  }

  async getCurrent(id) {
    const user = await this.dao.getById(id);
    return user ? new CurrentUserDTO(user) : null;
  }

  create(userData) {
    return this.dao.create(userData);
  }

  update(id, data) {
    return this.dao.update(id, data);
  }

  updatePassword(id, hashedPassword) {
    return this.dao.update(id, { password: hashedPassword });
  }

  touchLastConnection(id) {
    return this.dao.update(id, { last_connection: new Date() });
  }

  delete(id) {
    return this.dao.delete(id);
  }
}

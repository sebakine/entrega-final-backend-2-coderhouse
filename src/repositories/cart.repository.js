export default class CartRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create() {
    return this.dao.create({ products: [] });
  }

  getById(id) {
    return this.dao.getById(id);
  }

  getByIdPopulated(id) {
    return this.dao.getByIdPopulated(id);
  }

  addProduct(cartId, productId, quantity) {
    return this.dao.addProduct(cartId, productId, quantity);
  }

  updateProductQuantity(cartId, productId, quantity) {
    return this.dao.updateProductQuantity(cartId, productId, quantity);
  }

  removeProduct(cartId, productId) {
    return this.dao.removeProduct(cartId, productId);
  }

  replaceProducts(cartId, products) {
    return this.dao.replaceProducts(cartId, products);
  }

  clear(cartId) {
    return this.dao.clear(cartId);
  }

  delete(id) {
    return this.dao.delete(id);
  }
}

const round = (n) => Math.round(n * 100) / 100;

// DTO de salida del carrito: calcula subtotales y total a partir del carrito poblado.
export class CartDTO {
  constructor(cart) {
    this.id = String(cart._id);
    this.products = (cart.products ?? [])
      .filter((item) => item.product) // descarta productos eliminados del catálogo
      .map((item) => {
        const product = item.product;
        const isPopulated = typeof product === 'object' && product.title !== undefined;
        return {
          product: isPopulated
            ? {
                id: String(product._id),
                title: product.title,
                price: product.price,
                stock: product.stock,
                category: product.category,
              }
            : String(product),
          quantity: item.quantity,
          subtotal: isPopulated ? round(product.price * item.quantity) : undefined,
        };
      });
    this.total = round(this.products.reduce((acc, item) => acc + (item.subtotal ?? 0), 0));
  }
}

const PRODUCT_FIELDS = [
  'title',
  'description',
  'code',
  'price',
  'status',
  'stock',
  'category',
  'thumbnails',
];

// DTO de entrada: whitelist de campos editables de un producto.
export class ProductInputDTO {
  constructor(body = {}, { partial = false } = {}) {
    for (const key of PRODUCT_FIELDS) {
      if (body[key] === undefined) continue;
      this[key] = body[key];
    }
    if (this.price !== undefined) this.price = Number(this.price);
    if (this.stock !== undefined) this.stock = Number(this.stock);
    if (this.status !== undefined) this.status = this.status === true || this.status === 'true';
    if (this.thumbnails !== undefined && !Array.isArray(this.thumbnails)) {
      this.thumbnails = [this.thumbnails].filter(Boolean);
    }
    Object.defineProperty(this, 'partial', { value: partial, enumerable: false });
  }

  missingRequiredFields() {
    if (this.partial) return [];
    return ['title', 'description', 'code', 'price', 'stock', 'category'].filter(
      (key) => this[key] === undefined || this[key] === '',
    );
  }
}

// DTO de salida.
export class ProductDTO {
  constructor(product) {
    this.id = String(product._id);
    this.title = product.title;
    this.description = product.description;
    this.code = product.code;
    this.price = product.price;
    this.status = product.status;
    this.stock = product.stock;
    this.category = product.category;
    this.thumbnails = product.thumbnails ?? [];
  }
}

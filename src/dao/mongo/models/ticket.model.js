import mongoose from 'mongoose';

const ticketItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    // Campos exigidos por la consigna
    code: { type: String, required: true, unique: true },
    purchase_datetime: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    purchaser: { type: String, required: true, lowercase: true, trim: true, index: true },
    // Detalle de la compra para trazabilidad
    products: { type: [ticketItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export const TicketModel = mongoose.model('tickets', ticketSchema);

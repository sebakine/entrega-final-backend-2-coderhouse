export class TicketDTO {
  constructor(ticket) {
    this.id = String(ticket._id);
    this.code = ticket.code;
    this.purchase_datetime = ticket.purchase_datetime;
    this.amount = ticket.amount;
    this.purchaser = ticket.purchaser;
    this.products = (ticket.products ?? []).map((item) => ({
      product: String(item.product),
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));
  }
}

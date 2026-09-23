import { randomUUID } from 'node:crypto';
import { TicketDTO } from '../dto/ticket.dto.js';

export default class TicketRepository {
  constructor(dao) {
    this.dao = dao;
  }

  static generateCode() {
    return `TCK-${randomUUID().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }

  async create({ amount, purchaser, products }) {
    const ticket = await this.dao.create({
      code: TicketRepository.generateCode(),
      purchase_datetime: new Date(),
      amount,
      purchaser,
      products,
    });
    return new TicketDTO(ticket);
  }

  async getById(id) {
    const ticket = await this.dao.getById(id);
    return ticket ? new TicketDTO(ticket) : null;
  }

  async getByPurchaser(email) {
    const tickets = await this.dao.getByPurchaser(email);
    return tickets.map((t) => new TicketDTO(t));
  }

  async getAll() {
    const tickets = await this.dao.getAll();
    return tickets.map((t) => new TicketDTO(t));
  }
}

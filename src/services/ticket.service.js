import { ROLES } from '../constants/roles.js';
import { ticketRepository } from '../repositories/index.js';
import { AppError } from '../utils/customError.js';

class TicketService {
  getAll() {
    return ticketRepository.getAll();
  }

  getByPurchaser(email) {
    return ticketRepository.getByPurchaser(email);
  }

  async getById(id, requester) {
    const ticket = await ticketRepository.getById(id);
    if (!ticket) throw AppError.notFound('Ticket no encontrado');
    if (requester.role !== ROLES.ADMIN && ticket.purchaser !== requester.email) {
      throw AppError.forbidden('Solo puedes ver tus propios tickets');
    }
    return ticket;
  }
}

export const ticketService = new TicketService();

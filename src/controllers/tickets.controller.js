import { ticketService } from '../services/ticket.service.js';

export const getAllTickets = async (_req, res) => {
  const tickets = await ticketService.getAll();
  res.json({ status: 'success', payload: tickets });
};

export const getMyTickets = async (req, res) => {
  const tickets = await ticketService.getByPurchaser(req.user.email);
  res.json({ status: 'success', payload: tickets });
};

export const getTicketById = async (req, res) => {
  const ticket = await ticketService.getById(req.params.tid, req.user);
  res.json({ status: 'success', payload: ticket });
};

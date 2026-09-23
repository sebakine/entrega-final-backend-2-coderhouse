import { userDAO, productDAO, cartDAO, ticketDAO } from '../dao/factory.js';
import UserRepository from './user.repository.js';
import ProductRepository from './product.repository.js';
import CartRepository from './cart.repository.js';
import TicketRepository from './ticket.repository.js';

// Punto único de inyección: cada repository recibe el DAO que entrega la factory.
export const userRepository = new UserRepository(userDAO);
export const productRepository = new ProductRepository(productDAO);
export const cartRepository = new CartRepository(cartDAO);
export const ticketRepository = new TicketRepository(ticketDAO);

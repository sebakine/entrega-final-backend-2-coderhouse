import { Router } from 'express';
import cartsRouter from './carts.router.js';
import productsRouter from './products.router.js';
import sessionsRouter from './sessions.router.js';
import ticketsRouter from './tickets.router.js';
import usersRouter from './users.router.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'success', message: 'OK' }));
router.use('/sessions', sessionsRouter);
router.use('/products', productsRouter);
router.use('/carts', cartsRouter);
router.use('/tickets', ticketsRouter);
router.use('/users', usersRouter);

export default router;

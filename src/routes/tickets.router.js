import { Router } from 'express';
import * as tickets from '../controllers/tickets.controller.js';
import { authenticated, onlyAdmin, onlyUser } from '../middlewares/auth.middleware.js';
import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', ...onlyAdmin, asyncHandler(tickets.getAllTickets));
router.get('/mine', ...onlyUser, asyncHandler(tickets.getMyTickets));
router.get('/:tid', authenticated, validateObjectId('tid'), asyncHandler(tickets.getTicketById));

export default router;

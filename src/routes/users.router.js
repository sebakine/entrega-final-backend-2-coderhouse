import { Router } from 'express';
import * as users from '../controllers/users.controller.js';
import { onlyAdmin } from '../middlewares/auth.middleware.js';
import { validateObjectId } from '../middlewares/validateObjectId.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Gestión de usuarios: exclusiva del administrador.
router.use(...onlyAdmin);

router.get('/', asyncHandler(users.getUsers));
router.get('/:uid', validateObjectId('uid'), asyncHandler(users.getUserById));
router.put('/:uid', validateObjectId('uid'), asyncHandler(users.updateUser));
router.delete('/:uid', validateObjectId('uid'), asyncHandler(users.deleteUser));

export default router;

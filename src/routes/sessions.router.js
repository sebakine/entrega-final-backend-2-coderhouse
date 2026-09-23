import { Router } from 'express';
import * as sessions from '../controllers/sessions.controller.js';
import { authenticated, passportCall } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', passportCall('register'), asyncHandler(sessions.register));
router.post('/login', passportCall('login'), asyncHandler(sessions.login));
router.get('/current', authenticated, asyncHandler(sessions.current));
router.post('/logout', asyncHandler(sessions.logout));

// Recuperación de contraseña
router.post('/forgot-password', asyncHandler(sessions.forgotPassword));
router.get('/reset-password/validate', asyncHandler(sessions.validateResetToken));
router.post('/reset-password', asyncHandler(sessions.resetPassword));

export default router;

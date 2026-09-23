import { env, isProduction } from '../config/env.config.js';
import { CurrentUserDTO } from '../dto/user.dto.js';
import { authService } from '../services/auth.service.js';

const cookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: 'strict',
  secure: isProduction,
  maxAge: 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Usuario registrado correctamente',
    payload: new CurrentUserDTO(req.user),
  });
};

export const login = async (req, res) => {
  const token = authService.issueToken(req.user);
  res.cookie(env.COOKIE_NAME, token, cookieOptions).json({
    status: 'success',
    message: 'Sesión iniciada',
    payload: new CurrentUserDTO(req.user),
  });
};

// req.user ya es un CurrentUserDTO (lo entrega la estrategia "current").
export const current = async (req, res) => {
  res.json({ status: 'success', payload: req.user });
};

export const logout = async (_req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie(env.COOKIE_NAME, clearOptions).json({ status: 'success', message: 'Sesión cerrada' });
};

export const forgotPassword = async (req, res) => {
  await authService.requestPasswordReset(req.body?.email);
  res.json({
    status: 'success',
    message: 'Si el email está registrado, recibirás un correo con las instrucciones. El enlace expira en 1 hora.',
  });
};

export const validateResetToken = async (req, res) => {
  await authService.validateResetToken(req.query.token);
  res.json({ status: 'success', message: 'Enlace válido' });
};

export const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body ?? {};
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ status: 'error', message: 'Las contraseñas no coinciden' });
  }
  await authService.resetPassword(token, password);
  return res.json({ status: 'success', message: 'Contraseña actualizada correctamente' });
};

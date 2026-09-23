import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';

// Token de sesión: solo viaja el identificador y el rol, nunca datos sensibles.
export const generateAuthToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

// Token de recuperación: expira en 1 hora y queda ligado al hash actual de la contraseña,
// por lo que deja de ser válido apenas la contraseña cambia (uso único).
export const generateResetToken = (user, fingerprint) =>
  jwt.sign(
    { sub: String(user._id), purpose: 'password-reset', fp: fingerprint },
    env.RESET_PASSWORD_SECRET,
    { expiresIn: env.RESET_PASSWORD_EXPIRES_IN },
  );

export const verifyResetToken = (token) => jwt.verify(token, env.RESET_PASSWORD_SECRET);

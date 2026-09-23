import { createHash as sha256 } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { ROLES } from '../constants/roles.js';
import { CreateUserDTO, CurrentUserDTO } from '../dto/user.dto.js';
import { cartRepository, userRepository } from '../repositories/index.js';
import { AppError } from '../utils/customError.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { generateAuthToken, generateResetToken, verifyResetToken } from '../utils/jwt.js';
import { passwordChangedEmail, resetPasswordEmail } from '../templates/emails.js';
import { mailService } from './mail.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Huella del hash actual: si la contraseña cambia, los enlaces emitidos antes quedan inválidos.
const passwordFingerprint = (hashedPassword) =>
  sha256('sha256').update(hashedPassword).digest('hex').slice(0, 24);

const assertPasswordPolicy = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw AppError.badRequest(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
};

class AuthService {
  async register(body) {
    const data = new CreateUserDTO(body);
    const missing = ['first_name', 'last_name', 'email', 'password'].filter((k) => !data[k]);
    if (missing.length) {
      throw AppError.badRequest('Faltan campos obligatorios', { missing });
    }
    if (!EMAIL_REGEX.test(data.email)) throw AppError.badRequest('Email inválido');
    if (data.age !== undefined && (!Number.isInteger(data.age) || data.age < 0)) {
      throw AppError.badRequest('La edad debe ser un número entero positivo');
    }
    assertPasswordPolicy(data.password);

    const exists = await userRepository.getByEmail(data.email);
    if (exists) throw AppError.conflict('El email ya está registrado');

    // Cada usuario nace con su propio carrito. El rol siempre es "user":
    // los administradores se crean por seed, nunca desde el registro público.
    const cart = await cartRepository.create();
    try {
      const user = await userRepository.create({
        ...data,
        password: createHash(data.password),
        cart: cart._id,
        role: ROLES.USER,
      });
      return user;
    } catch (error) {
      await cartRepository.delete(cart._id);
      throw error;
    }
  }

  async validateCredentials(email, password) {
    const user = await userRepository.getByEmail(email);
    if (!user || !isValidPassword(password, user.password)) {
      throw AppError.unauthorized('Credenciales inválidas');
    }
    await userRepository.touchLastConnection(user._id);
    return user;
  }

  issueToken(user) {
    return generateAuthToken(user);
  }

  async getCurrent(userId) {
    const current = await userRepository.getCurrent(userId);
    if (!current) throw AppError.unauthorized('El usuario de la sesión ya no existe');
    return current;
  }

  async requestPasswordReset(email) {
    const user = await userRepository.getByEmail(email);
    // Respuesta idéntica exista o no el usuario: evita enumeración de cuentas.
    if (!user) return;

    const token = generateResetToken(user, passwordFingerprint(user.password));
    const resetUrl = `${env.BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
    const mail = resetPasswordEmail({ firstName: user.first_name, resetUrl });
    await mailService.send({ to: user.email, ...mail });
  }

  async validateResetToken(token) {
    if (!token) throw AppError.badRequest('Token de recuperación requerido');
    let payload;
    try {
      payload = verifyResetToken(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.badRequest('El enlace de recuperación expiró. Solicita uno nuevo.');
      }
      throw AppError.badRequest('El enlace de recuperación es inválido.');
    }
    if (payload.purpose !== 'password-reset') {
      throw AppError.badRequest('El enlace de recuperación es inválido.');
    }
    const user = await userRepository.getById(payload.sub);
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
      throw AppError.badRequest('El enlace de recuperación ya fue utilizado o no es válido.');
    }
    return user;
  }

  async resetPassword(token, newPassword) {
    const user = await this.validateResetToken(token);
    assertPasswordPolicy(newPassword);

    if (isValidPassword(newPassword, user.password)) {
      throw AppError.badRequest('La nueva contraseña no puede ser igual a la anterior');
    }

    await userRepository.updatePassword(user._id, createHash(newPassword));
    const mail = passwordChangedEmail({ firstName: user.first_name });
    mailService.send({ to: user.email, ...mail }).catch((err) =>
      console.error('[mail] No se pudo enviar la confirmación de cambio de contraseña:', err.message),
    );
    return new CurrentUserDTO(user);
  }
}

export const authService = new AuthService();

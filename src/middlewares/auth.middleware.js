import passport from 'passport';
import { ROLES } from '../constants/roles.js';
import { AppError } from '../utils/customError.js';

// Traduce el "info" que entrega Passport a un AppError con el código HTTP adecuado.
const infoToError = (strategy, info) => {
  if (info?.statusCode !== undefined) {
    return new AppError(info.message, info.statusCode, info.details);
  }
  if (info?.message === 'Missing credentials') {
    return AppError.badRequest('Email y contraseña son obligatorios');
  }
  if (info?.name === 'TokenExpiredError') {
    return AppError.unauthorized('La sesión expiró, vuelve a iniciar sesión');
  }
  if (strategy === 'current') {
    return AppError.unauthorized(
      info?.message === 'No auth token'
        ? 'No autenticado: inicia sesión para continuar'
        : 'Token de sesión inválido',
    );
  }
  return AppError.unauthorized('Credenciales inválidas');
};

// Ejecuta una estrategia de Passport con callback personalizado para responder
// siempre en JSON con el código HTTP correcto (401/400/409...) en vez de un texto plano.
export const passportCall = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (error, user, info) => {
    if (error) return next(error);
    if (!user) return next(infoToError(strategy, info));
    req.user = user;
    return next();
  })(req, res, next);
};

// Middleware de autorización: trabaja DESPUÉS de passportCall('current')
// y restringe el endpoint a los roles indicados.
export const authorization =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Acceso denegado: se requiere rol ${allowedRoles.join(' o ')} (tu rol es ${req.user.role})`,
        ),
      );
    }
    return next();
  };

// Verifica que el carrito del parámetro :cid pertenezca al usuario autenticado.
// Con { allowAdmin: true } el administrador puede consultarlo (solo lectura).
export const cartOwnership =
  ({ allowAdmin = false } = {}) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (allowAdmin && req.user.role === ROLES.ADMIN) return next();
    if (!req.user.cart || String(req.user.cart) !== String(req.params.cid)) {
      return next(AppError.forbidden('Solo puedes operar sobre tu propio carrito'));
    }
    return next();
  };

// Atajos legibles para las rutas.
export const authenticated = passportCall('current');
export const onlyAdmin = [authenticated, authorization(ROLES.ADMIN)];
export const onlyUser = [authenticated, authorization(ROLES.USER)];

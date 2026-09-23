import mongoose from 'mongoose';
import { isProduction } from '../config/env.config.js';
import { AppError } from '../utils/customError.js';

export const notFoundHandler = (req, _res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details;

  if (err instanceof AppError) {
    ({ statusCode, message, details } = err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Datos inválidos';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Valor inválido para ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = 'Registro duplicado';
    details = err.keyValue;
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'JSON mal formado';
  }

  if (statusCode >= 500) console.error('[error]', err);

  const body = { status: 'error', message };
  if (details !== undefined) body.details = details;
  if (!isProduction && statusCode >= 500) body.stack = err?.stack;
  res.status(statusCode).json(body);
};

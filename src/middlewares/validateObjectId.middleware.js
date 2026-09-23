import mongoose from 'mongoose';
import { AppError } from '../utils/customError.js';

// Valida que los parámetros de ruta indicados sean ObjectId válidos antes de llegar a la DB.
export const validateObjectId =
  (...params) =>
  (req, _res, next) => {
    const invalid = params.filter((p) => req.params[p] && !mongoose.isValidObjectId(req.params[p]));
    if (invalid.length) {
      return next(AppError.badRequest(`Identificador inválido: ${invalid.join(', ')}`));
    }
    return next();
  };

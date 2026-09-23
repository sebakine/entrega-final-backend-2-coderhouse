export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message = 'Solicitud inválida', details) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'No autorizado para realizar esta acción') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404);
  }

  static conflict(message = 'Conflicto con el estado actual del recurso', details) {
    return new AppError(message, 409, details);
  }
}

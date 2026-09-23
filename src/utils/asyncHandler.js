// Envuelve controladores async para delegar errores al middleware centralizado.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

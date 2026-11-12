export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg, code = 'BAD_REQUEST') => new HttpError(400, msg, code);
export const unauthorized = (msg = 'No autenticado') => new HttpError(401, msg, 'UNAUTHORIZED');
export const forbidden = (msg = 'No tienes permiso para esta acción') => new HttpError(403, msg, 'FORBIDDEN');
export const notFound = (msg = 'Recurso no encontrado', code = 'NOT_FOUND') => new HttpError(404, msg, code);

/** Envuelve un handler para que los errores lleguen al errorHandler. */
export const asyncHandler = (fn) => (req, res, next) => {
  try {
    const out = fn(req, res, next);
    if (out && typeof out.catch === 'function') out.catch(next);
  } catch (err) {
    next(err);
  }
};

/** Valida que existan los campos requeridos en body. */
export function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw badRequest(`Faltan campos: ${missing.join(', ')}`, 'VALIDATION');
}

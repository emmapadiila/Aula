import { verifyToken } from '../services/auth.service.js';
import { forbidden, unauthorized } from '../utils/errors.js';

/** Exige un JWT válido en "Authorization: Bearer <token>" y deja req.user */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(unauthorized());
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    next(unauthorized('Sesión expirada, inicia sesión de nuevo'));
  }
}

/** Restringe a uno o varios roles: authorize('admin') */
export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden());

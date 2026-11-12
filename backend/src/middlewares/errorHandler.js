export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Violaciones de UNIQUE en SQLite → 409
  if (String(err.message).includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Ya existe un registro con esos datos' } });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: { code: err.code || 'INTERNAL', message: status >= 500 ? 'Error interno del servidor' : err.message },
  });
}

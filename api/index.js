/**
 * Función de Vercel: toda la API (/api/*) la atiende la app de Express.
 * El frontend (carpeta frontend/) lo sirve Vercel como archivos estáticos.
 */
import { app } from '../backend/src/app.js';

export default app;

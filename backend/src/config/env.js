import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');

// Carga backend/.env si existe (Node >= 21.7 trae loadEnvFile nativo)
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  /* sin .env: se usan los valores por defecto */
}

export const env = {
  port: Number(process.env.PORT) || 3100,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-no-usar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  dbFile: path.resolve(ROOT, process.env.DB_FILE || './data/asistencia.db'),
  onTimeMarginMin: Number(process.env.ON_TIME_MARGIN_MIN) || 10,
  frontendDir: path.resolve(ROOT, '../frontend'),
};

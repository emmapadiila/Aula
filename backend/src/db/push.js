/**
 * Copia TODO de la base de datos local (backend/data/asistencia.db) a Turso:
 * usuarios (con contraseñas), salones, horarios, estudiantes (con sus QR) y asistencias.
 * REEMPLAZA lo que haya en Turso.
 *
 * Uso (con las variables de Turso definidas):
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push
 */
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';
import { SCHEMA } from './schema.js';

const { TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: authToken } = process.env;
if (!url) {
  console.error('Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN).');
  process.exit(1);
}

const local = createClient({ url: `file:${path.resolve(env.dbFile).replace(/\\/g, '/')}`, intMode: 'number' });
const remote = createClient({ url, authToken, intMode: 'number' });

const TABLES = ['users', 'classrooms', 'schedules', 'students', 'attendance'];

await remote.executeMultiple(SCHEMA);

const stmts = [...TABLES].reverse().map((t) => ({ sql: `DELETE FROM ${t}`, args: [] }));
const counts = {};
for (const t of TABLES) {
  const rs = await local.execute(`SELECT * FROM ${t}`);
  counts[t] = rs.rows.length;
  const cols = rs.columns;
  for (const row of rs.rows) {
    stmts.push({
      sql: `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      args: cols.map((_, i) => row[i]),
    });
  }
}

await remote.batch(stmts, 'write');
console.log('✔ Datos copiados a Turso:', counts);

// Verificación
for (const t of TABLES) {
  const { rows } = await remote.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  if (rows[0].n !== counts[t]) throw new Error(`Verificación falló en ${t}: local ${counts[t]}, Turso ${rows[0].n}`);
}
console.log('✔ Verificado: Turso tiene exactamente los mismos registros');

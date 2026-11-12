/**
 * Copia TODO de la base local (backend/data/asistencia.db) a Turso, incluidos usuarios y contraseñas.
 * REEMPLAZA lo que haya en Turso.
 *
 * Uso (con las credenciales de Turso):
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:push
 * Si no tienes las credenciales, usa la importación de un solo uso (ver README: "Primera carga en Vercel").
 */
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';
import { exportAll, importStatements, TABLES } from './dump.js';
import { SCHEMA } from './schema.js';

const { TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: authToken } = process.env;
if (!url) {
  console.error('Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN).');
  process.exit(1);
}

const local = createClient({ url: `file:${path.resolve(env.dbFile).replace(/\\/g, '/')}`, intMode: 'number' });
const remote = createClient({ url, authToken, intMode: 'number' });

await remote.executeMultiple(SCHEMA);
const { stmts, counts } = importStatements(await exportAll(local));
await remote.batch(stmts, 'write');
console.log('✔ Datos copiados a Turso:', counts);

for (const t of TABLES) {
  const { rows } = await remote.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  if (rows[0].n !== counts[t]) throw new Error(`Verificación falló en ${t}: local ${counts[t]}, Turso ${rows[0].n}`);
}
console.log('✔ Verificado: Turso tiene exactamente los mismos registros');

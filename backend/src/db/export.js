/**
 * Exporta la base local completa (con usuarios) a un archivo JSON.
 * Uso: npm run db:export -- ruta/salida.json
 * ¡El archivo contiene las contraseñas cifradas y los QR! No lo subas a git ni lo compartas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';
import { exportAll } from './dump.js';

const out = process.argv[2];
if (!out) {
  console.error('Uso: npm run db:export -- ruta/salida.json');
  process.exit(1);
}
const local = createClient({ url: `file:${path.resolve(env.dbFile).replace(/\\/g, '/')}`, intMode: 'number' });
const dump = await exportAll(local);
fs.writeFileSync(out, JSON.stringify(dump));
console.log('✔ Exportado:', Object.fromEntries(Object.entries(dump.tables).map(([t, v]) => [t, v.rows.length])), '→', out);

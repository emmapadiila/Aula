/**
 * Conexión a la base de datos.
 *  - Con TURSO_DATABASE_URL (Vercel / producción): base de datos Turso en la nube.
 *  - Sin ella (desarrollo local): archivo SQLite en backend/data/asistencia.db.
 *
 * API (todas async):
 *   db.all(sql, args)  → filas como objetos
 *   db.get(sql, args)  → primera fila u undefined
 *   db.run(sql, args)  → { changes, lastInsertRowid }
 *   db.batch([{ sql, args }, ...]) → ejecuta todo en una transacción (todo o nada)
 *   db.exec(sql)       → varias sentencias separadas por ";"
 */
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { SCHEMA } from './schema.js';

const remoteUrl = process.env.TURSO_DATABASE_URL;
export const DB_KIND = remoteUrl ? 'turso' : 'local';

// En Vercel no hay disco permanente: sin Turso los datos se perderían
if (process.env.VERCEL && !remoteUrl) {
  throw new Error('Falta conectar la base de datos Turso al proyecto en Vercel (variable TURSO_DATABASE_URL)');
}

let url = remoteUrl;
if (!url) {
  fs.mkdirSync(path.dirname(env.dbFile), { recursive: true });
  url = `file:${env.dbFile.replace(/\\/g, '/')}`;
}

// En la nube se usa el cliente HTTP (sin binarios nativos); en local, el cliente con soporte de archivos.
const { createClient } = remoteUrl ? await import('@libsql/client/web') : await import('@libsql/client');
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN, intMode: 'number' });

const clean = (args = []) => args.map((a) => (a === undefined ? null : typeof a === 'boolean' ? Number(a) : a));
const toObjects = (rs) => rs.rows.map((row) => Object.fromEntries(rs.columns.map((c, i) => [c, row[i]])));

let ready = null;
/** Crea las tablas si no existen (una vez por proceso) */
export const init = () =>
  (ready ??= client.executeMultiple(SCHEMA).catch((err) => {
    ready = null;
    throw err;
  }));

async function execute(sql, args) {
  await init();
  return client.execute({ sql, args: clean(args) });
}

export const db = {
  all: async (sql, args) => toObjects(await execute(sql, args)),
  get: async (sql, args) => toObjects(await execute(sql, args))[0],
  run: async (sql, args) => {
    const rs = await execute(sql, args);
    return { changes: rs.rowsAffected, lastInsertRowid: rs.lastInsertRowid == null ? undefined : Number(rs.lastInsertRowid) };
  },
  exec: async (sql) => {
    await init();
    return client.executeMultiple(sql);
  },
  /** Ejecuta varias sentencias de forma atómica */
  batch: async (statements) => {
    await init();
    if (!statements.length) return [];
    return client.batch(statements.map(({ sql, args }) => ({ sql, args: clean(args) })), 'write');
  },
};

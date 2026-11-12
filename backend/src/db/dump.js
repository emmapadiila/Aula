/**
 * Copia completa de la base de datos, tabla por tabla (incluye usuarios con sus contraseñas cifradas).
 * La usan:
 *  - npm run db:export  → genera el archivo desde la base local
 *  - npm run db:push    → lo copia directo a Turso (si tienes las credenciales)
 *  - POST /api/setup/import → lo carga en una base recién creada (solo una vez, con clave)
 */
export const TABLES = ['users', 'classrooms', 'schedules', 'students', 'attendance'];

/** Lee todas las tablas con un cliente libsql */
export async function exportAll(client) {
  const tables = {};
  for (const t of TABLES) {
    const rs = await client.execute(`SELECT * FROM ${t}`);
    tables[t] = { columns: rs.columns, rows: rs.rows.map((r) => rs.columns.map((_, i) => r[i])) };
  }
  return { tipo: 'volcado-completo', generado: new Date().toISOString(), tables };
}

/** Sentencias para reemplazar todo el contenido por el del volcado (para ejecutar en un batch) */
export function importStatements(dump) {
  if (dump?.tipo !== 'volcado-completo' || !dump.tables) throw new Error('El archivo no es un volcado completo');
  const stmts = [...TABLES].reverse().map((t) => ({ sql: `DELETE FROM ${t}`, args: [] }));
  const counts = {};
  for (const t of TABLES) {
    const { columns = [], rows = [] } = dump.tables[t] ?? {};
    counts[t] = rows.length;
    if (columns.some((c) => !/^[a-z_]+$/.test(c))) throw new Error(`Columna inválida en ${t}`);
    for (const row of rows) {
      stmts.push({ sql: `INSERT INTO ${t} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, args: row });
    }
  }
  return { stmts, counts };
}

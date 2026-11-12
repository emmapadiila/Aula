/**
 * Sincroniza estudiantes.js con la base de datos SIN borrar nada:
 * crea los salones que falten (con su horario) y agrega los estudiantes que no existan.
 * Los estudiantes existentes conservan su código y su QR.
 * Uso: npm run sync
 */
import { pathToFileURL } from 'node:url';
import { db } from './database.js';
import { GRUPOS, HORARIO, studentCode } from './estudiantes.js';
import { newToken } from '../services/qr.service.js';
import { writeBackup } from '../services/backup.service.js';

export async function syncGroups() {
  const admin = await db.get("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  if (!admin) throw new Error('No hay cuenta de administrador. Ejecuta primero: npm run seed');

  for (const g of GRUPOS) {
    let room = await db.get('SELECT id FROM classrooms WHERE name = ?', [g.name]);
    if (!room) {
      const r = await db.run('INSERT INTO classrooms (name, grade, teacher_id) VALUES (?, ?, ?)', [g.name, g.grade, admin.id]);
      room = { id: r.lastInsertRowid };
      await db.batch(HORARIO.days.map((wd) => ({
        sql: `INSERT INTO schedules (classroom_id, teacher_id, subject, weekday, start_time, end_time, on_time_margin)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [room.id, admin.id, HORARIO.subject, wd, HORARIO.start, HORARIO.end, HORARIO.margin],
      })));
      console.log(`+ Salón ${g.name} creado (${HORARIO.start}–${HORARIO.end}, lunes a viernes)`);
    }

    const existing = new Set((await db.all('SELECT name FROM students WHERE classroom_id = ?', [room.id])).map((s) => s.name));
    const nuevos = g.students
      .map((raw, i) => ({ name: raw.trim(), code: studentCode(g.name, i + 1) }))
      .filter((s) => !existing.has(s.name));
    await db.batch(nuevos.map((s) => ({
      sql: 'INSERT INTO students (code, name, classroom_id, qr_token) VALUES (?, ?, ?, ?)',
      args: [s.code, s.name, room.id, newToken()],
    })));
    const { n } = await db.get('SELECT COUNT(*) AS n FROM students WHERE classroom_id = ?', [room.id]);
    console.log(`✔ Salón ${g.name}: ${n} estudiantes${nuevos.length ? ` (${nuevos.length} nuevos)` : ''}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await syncGroups();
  await writeBackup();
  console.log('✔ Listo');
}

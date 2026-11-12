/**
 * Sincroniza estudiantes.js con la base de datos SIN borrar nada:
 * crea los salones que falten (con su horario) y agrega los estudiantes que no existan.
 * Los estudiantes existentes conservan su código y su QR.
 * Uso: npm run sync
 */
import { pathToFileURL } from 'node:url';
import { db, transaction } from './database.js';
import { GRUPOS, HORARIO, studentCode } from './estudiantes.js';
import { newToken } from '../services/qr.service.js';
import { writeBackup } from '../services/backup.service.js';

export function syncGroups() {
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
  if (!admin) throw new Error('No hay cuenta de administrador. Ejecuta primero: npm run seed');

  transaction(() => {
    for (const g of GRUPOS) {
      let room = db.prepare('SELECT id FROM classrooms WHERE name = ?').get(g.name);
      if (!room) {
        const id = db.prepare('INSERT INTO classrooms (name, grade, teacher_id) VALUES (?, ?, ?)').run(g.name, g.grade, admin.id).lastInsertRowid;
        room = { id: Number(id) };
        const ins = db.prepare(`INSERT INTO schedules (classroom_id, teacher_id, subject, weekday, start_time, end_time, on_time_margin)
                                VALUES (?, ?, ?, ?, ?, ?, ?)`);
        for (const wd of HORARIO.days) ins.run(room.id, admin.id, HORARIO.subject, wd, HORARIO.start, HORARIO.end, HORARIO.margin);
        console.log(`+ Salón ${g.name} creado (${HORARIO.start}–${HORARIO.end}, lunes a viernes)`);
      }

      const exists = db.prepare('SELECT 1 FROM students WHERE classroom_id = ? AND name = ?');
      const ins = db.prepare('INSERT INTO students (code, name, classroom_id, qr_token) VALUES (?, ?, ?, ?)');
      let added = 0;
      g.students.forEach((raw, i) => {
        const name = raw.trim();
        if (exists.get(room.id, name)) return;
        ins.run(studentCode(g.name, i + 1), name, room.id, newToken());
        added++;
      });
      const total = db.prepare('SELECT COUNT(*) AS n FROM students WHERE classroom_id = ?').get(room.id).n;
      console.log(`✔ Salón ${g.name}: ${total} estudiantes${added ? ` (${added} nuevos)` : ''}`);
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncGroups();
  writeBackup();
  console.log('✔ Respaldo JSON actualizado');
}

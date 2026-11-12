/**
 * Carga inicial completa: cuenta de administrador, salones, horarios y estudiantes (estudiantes.js).
 * Uso: npm run seed   (BORRA todo lo existente, incluido el historial y los QR, y vuelve a crear)
 * Para agregar un salón nuevo sin borrar nada: npm run sync
 */
import { db } from './database.js';
import { hashPassword } from '../services/auth.service.js';
import { syncGroups } from './sync.js';
import { writeBackup } from '../services/backup.service.js';

const PASSWORD = 'cambiar123';

await db.batch([
  ...['attendance', 'schedules', 'students', 'classrooms', 'users'].map((t) => ({ sql: `DELETE FROM ${t}`, args: [] })),
  { sql: "DELETE FROM sqlite_sequence WHERE name IN ('attendance', 'schedules', 'students', 'classrooms', 'users')", args: [] },
  { sql: 'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    args: ['Administrador', 'admin@colegio.edu.co', hashPassword(PASSWORD), 'admin'] },
]);

await syncGroups();
await writeBackup();
console.log(`  Administrador: admin@colegio.edu.co / ${PASSWORD}`);

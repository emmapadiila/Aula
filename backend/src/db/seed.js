/**
 * Carga inicial completa: cuenta de administrador, salones, horarios y estudiantes (estudiantes.js).
 * Uso: npm run seed   (BORRA todo lo existente, incluido el historial y los QR, y vuelve a crear)
 * Para agregar un salón nuevo sin borrar nada: npm run sync
 */
import { db, transaction } from './database.js';
import { hashPassword } from '../services/auth.service.js';
import { syncGroups } from './sync.js';
import { writeBackup } from '../services/backup.service.js';

const PASSWORD = 'cambiar123';

transaction(() => {
  for (const t of ['attendance', 'schedules', 'students', 'classrooms', 'users']) db.exec(`DELETE FROM ${t}`);
  db.exec('DELETE FROM sqlite_sequence');
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('Administrador', 'admin@colegio.edu.co', hashPassword(PASSWORD), 'admin');
});

syncGroups();
writeBackup();
console.log(`  Administrador: admin@colegio.edu.co / ${PASSWORD}`);

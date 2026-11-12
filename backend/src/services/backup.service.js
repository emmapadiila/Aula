/**
 * Respaldo completo en JSON (backend/data/respaldo.json).
 * Se reescribe automáticamente después de cada cambio (crear, editar, borrar, escanear…)
 * y al arrancar el servidor. Además se guarda una copia diaria en data/respaldos/AAAA-MM-DD.json.
 *
 * Las contraseñas NO se incluyen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { db } from '../db/database.js';
import { todayISO } from '../utils/time.js';

const DIR = path.dirname(env.dbFile);
export const BACKUP_FILE = path.join(DIR, 'respaldo.json');
const DAILY_DIR = path.join(DIR, 'respaldos');

export function buildBackup() {
  const all = (sql) => db.prepare(sql).all();
  const estudiantes = all(`
    SELECT s.id, s.code AS codigo, s.name AS nombre, s.document AS identificacion, s.email AS correo,
           s.classroom_id AS salon_id, c.name AS salon, c.grade AS grado, s.entry_time AS hora_entrada_individual,
           s.active AS activo, s.qr_token, 'ASQR:' || s.qr_token AS contenido_qr, s.created_at AS creado
    FROM students s LEFT JOIN classrooms c ON c.id = s.classroom_id
    ORDER BY CAST(c.name AS INTEGER), s.code`);

  return {
    colegio: 'Colegio María Montessori · El Copey, Cesar',
    generado: new Date().toISOString(),
    totales: {
      salones: db.prepare('SELECT COUNT(*) n FROM classrooms').get().n,
      estudiantes: estudiantes.length,
      asistencias: db.prepare('SELECT COUNT(*) n FROM attendance').get().n,
    },
    usuarios: all('SELECT id, name AS nombre, email AS correo, role AS rol, subject AS materia, active AS activo FROM users ORDER BY id'),
    salones: all(`SELECT c.id, c.name AS nombre, c.grade AS grado, u.name AS encargado, u.email AS encargado_correo,
                  (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id) AS estudiantes
                  FROM classrooms c LEFT JOIN users u ON u.id = c.teacher_id ORDER BY CAST(c.name AS INTEGER)`),
    horarios: all(`SELECT sc.id, sc.classroom_id AS salon_id, c.name AS salon, sc.subject AS materia, sc.weekday AS dia_semana,
                   sc.start_time AS entrada, sc.end_time AS salida, sc.on_time_margin AS margen_puntual_min,
                   u.name AS encargado, u.email AS encargado_correo
                   FROM schedules sc JOIN classrooms c ON c.id = sc.classroom_id JOIN users u ON u.id = sc.teacher_id
                   ORDER BY sc.weekday, CAST(c.name AS INTEGER)`),
    estudiantes,
    asistencias: all(`SELECT a.id, a.student_id AS estudiante_id, a.schedule_id AS horario_id,
                      a.date AS fecha, s.code AS codigo, s.name AS estudiante, c.name AS salon,
                      a.scheduled_time AS hora_programada, a.arrival_time AS hora_llegada, a.status AS estado
                      FROM attendance a JOIN students s ON s.id = a.student_id
                      JOIN schedules sc ON sc.id = a.schedule_id JOIN classrooms c ON c.id = sc.classroom_id
                      ORDER BY a.date, CAST(c.name AS INTEGER), s.code`),
  };
}

/** Escribe el archivo de forma atómica (primero a .tmp y luego renombra) */
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/** Copia de seguridad del estado actual antes de una operación peligrosa (p. ej. restaurar) */
export function snapshot(label) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(DAILY_DIR, `${label}-${stamp}.json`);
  writeJson(file, buildBackup());
  return file;
}

export function writeBackup() {
  try {
    const data = buildBackup();
    writeJson(BACKUP_FILE, data);
    writeJson(path.join(DAILY_DIR, `${todayISO()}.json`), data);
  } catch (err) {
    console.error('No se pudo escribir el respaldo JSON:', err.message);
  }
}

// Agrupa varios cambios seguidos (p. ej. escaneos rápidos) en una sola escritura
let timer = null;
export function scheduleBackup() {
  clearTimeout(timer);
  timer = setTimeout(writeBackup, 300);
}

/** Middleware: tras cualquier POST/PUT/PATCH/DELETE exitoso en /api, actualiza el respaldo */
export function backupAfterWrites(req, res, next) {
  if (req.method !== 'GET' && !req.path.startsWith('/auth')) {
    res.on('finish', () => { if (res.statusCode < 400) scheduleBackup(); });
  }
  next();
}

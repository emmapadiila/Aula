/**
 * Restaurar desde un respaldo JSON (el mismo formato que genera backup.service.js).
 *
 * - Reemplaza salones, horarios, estudiantes (con su QR) y asistencias.
 * - NO toca las cuentas de usuario ni las contraseñas: las jornadas se asignan al usuario
 *   con el mismo correo, o al administrador si no existe.
 * - Antes de borrar nada guarda una copia del estado actual (snapshot).
 * - Todo se ejecuta en un solo lote atómico: si algo falla, no se cambia nada.
 */
import { db } from '../db/database.js';
import { badRequest } from '../utils/errors.js';
import { weekdayOf } from '../utils/time.js';
import { snapshot } from './backup.service.js';

const STATUSES = new Set(['Temprano', 'Puntual', 'Tarde', 'Inasistencia']);
const TOKEN = /^[a-f0-9]{32}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Revisa el archivo y devuelve un resumen; lanza 400 con la lista de problemas si no sirve */
export function validateBackup(data) {
  const errors = [];
  if (!data || typeof data !== 'object') throw badRequest('El archivo no es un respaldo válido');
  for (const k of ['salones', 'horarios', 'estudiantes']) {
    if (!Array.isArray(data[k])) errors.push(`Falta la lista "${k}"`);
  }
  if (errors.length) throw badRequest(`El archivo no es un respaldo de este sistema: ${errors.join('; ')}`, 'INVALID_BACKUP');

  const salones = new Set(data.salones.map((s) => String(s.nombre)));
  const codes = new Set();
  const tokens = new Set();
  data.estudiantes.forEach((e, i) => {
    const who = `Estudiante #${i + 1} (${e.nombre ?? 'sin nombre'})`;
    if (!e.nombre || !String(e.nombre).trim()) errors.push(`${who}: falta el nombre`);
    if (!e.codigo) errors.push(`${who}: falta el código`);
    else if (codes.has(e.codigo)) errors.push(`${who}: código repetido ${e.codigo}`);
    codes.add(e.codigo);
    if (!TOKEN.test(e.qr_token ?? '')) errors.push(`${who}: QR inválido`);
    else if (tokens.has(e.qr_token)) errors.push(`${who}: QR repetido`);
    tokens.add(e.qr_token);
    if (e.salon != null && !salones.has(String(e.salon))) errors.push(`${who}: el salón ${e.salon} no está en la lista de salones`);
  });
  data.horarios.forEach((h, i) => {
    if (!HHMM.test(h.entrada ?? '') || !HHMM.test(h.salida ?? '')) errors.push(`Horario #${i + 1}: hora inválida`);
    if (!salones.has(String(h.salon))) errors.push(`Horario #${i + 1}: salón ${h.salon} desconocido`);
  });
  (data.asistencias ?? []).forEach((a, i) => {
    if (!STATUSES.has(a.estado)) errors.push(`Asistencia #${i + 1}: estado "${a.estado}" inválido`);
  });

  if (errors.length) {
    const shown = errors.slice(0, 8).join(' · ');
    throw badRequest(`El respaldo tiene ${errors.length} problema(s): ${shown}${errors.length > 8 ? ' …' : ''}`, 'INVALID_BACKUP');
  }
  return {
    generado: data.generado ?? null,
    salones: data.salones.length,
    horarios: data.horarios.length,
    estudiantes: data.estudiantes.length,
    asistencias: (data.asistencias ?? []).length,
  };
}

/** Asigna ids: usa el del respaldo si es válido y no se repite; si no, el siguiente libre */
function idAllocator(items) {
  const used = new Set();
  let next = Math.max(0, ...items.map((x) => (Number.isInteger(x.id) ? x.id : 0))) + 1;
  return (item) => {
    if (Number.isInteger(item.id) && item.id > 0 && !used.has(item.id)) { used.add(item.id); return item.id; }
    while (used.has(next)) next++;
    used.add(next);
    return next++;
  };
}

export async function restoreBackup(data) {
  const summary = validateBackup(data);
  const snapshotId = await snapshot('antes-de-restaurar');

  const users = await db.all('SELECT id, email, role FROM users ORDER BY id');
  const admin = users.find((u) => u.role === 'admin');
  const userFor = (email) => users.find((u) => email && u.email === String(email).toLowerCase())?.id ?? admin.id;

  const stmts = ['attendance', 'schedules', 'students', 'classrooms'].map((t) => ({ sql: `DELETE FROM ${t}`, args: [] }));

  // Salones
  const roomByOldId = new Map();
  const roomByName = new Map();
  const roomId = idAllocator(data.salones);
  for (const s of data.salones) {
    const id = roomId(s);
    if (s.id != null) roomByOldId.set(s.id, id);
    roomByName.set(String(s.nombre), id);
    stmts.push({ sql: 'INSERT INTO classrooms (id, name, grade, teacher_id) VALUES (?, ?, ?, ?)',
      args: [id, String(s.nombre), s.grado ?? `${s.nombre}°`, userFor(s.encargado_correo)] });
  }
  const roomOf = (oldId, name) => roomByOldId.get(oldId) ?? roomByName.get(String(name)) ?? null;

  // Horarios
  const schByOldId = new Map();
  const schByRoomDay = new Map();
  const schId = idAllocator(data.horarios);
  for (const h of data.horarios) {
    const id = schId(h);
    const room = roomOf(h.salon_id, h.salon);
    if (h.id != null) schByOldId.set(h.id, id);
    if (!schByRoomDay.has(`${room}-${h.dia_semana}`)) schByRoomDay.set(`${room}-${h.dia_semana}`, id);
    stmts.push({
      sql: `INSERT INTO schedules (id, classroom_id, teacher_id, subject, weekday, start_time, end_time, on_time_margin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, room, userFor(h.encargado_correo), h.materia ?? 'Jornada', Number(h.dia_semana), h.entrada, h.salida, h.margen_puntual_min ?? null],
    });
  }

  // Estudiantes (conservan código y QR → las manillas impresas siguen funcionando)
  const stuByOldId = new Map();
  const stuByCode = new Map();
  const stuId = idAllocator(data.estudiantes);
  for (const e of data.estudiantes) {
    const id = stuId(e);
    if (e.id != null) stuByOldId.set(e.id, id);
    stuByCode.set(e.codigo, id);
    stmts.push({
      sql: `INSERT INTO students (id, code, name, document, email, classroom_id, entry_time, qr_token, active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, e.codigo, String(e.nombre).trim(), e.identificacion || null, e.correo || null,
        roomOf(e.salon_id, e.salon), e.hora_entrada_individual || null, e.qr_token, e.activo === 0 ? 0 : 1],
    });
  }

  // Asistencias
  let skipped = 0;
  for (const a of data.asistencias ?? []) {
    const student = stuByOldId.get(a.estudiante_id) ?? stuByCode.get(a.codigo);
    const room = roomByName.get(String(a.salon));
    const schedule = schByOldId.get(a.horario_id)
      ?? schByRoomDay.get(`${room}-${weekdayOf(new Date(`${a.fecha}T12:00:00`))}`);
    if (!student || !schedule) { skipped++; continue; }
    stmts.push({
      sql: `INSERT OR IGNORE INTO attendance (student_id, schedule_id, date, scheduled_time, arrival_time, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [student, schedule, a.fecha, a.hora_programada, a.hora_llegada ?? null, a.estado],
    });
  }

  await db.batch(stmts);
  return { ...summary, asistencias_omitidas: skipped, copia_previa: snapshotId };
}

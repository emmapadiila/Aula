import { db } from '../db/database.js';
import { AttendanceModel } from '../models/attendance.model.js';
import { todayISO } from '../utils/time.js';

const STATUSES = ['Temprano', 'Puntual', 'Tarde', 'Inasistencia'];

/** Convierte [{status, n}] en {Temprano, Puntual, Tarde, Inasistencia, total, rate} */
function summarize(rows) {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of rows) out[r.status] = r.n;
  const total = STATUSES.reduce((a, s) => a + out[s], 0);
  const present = total - out.Inasistencia;
  return { ...out, total, present, rate: total ? Math.round((present / total) * 1000) / 10 : 0 };
}

/** Resumen del día (tarjetas del dashboard) */
export function daySummary({ date = todayISO(), teacherId } = {}) {
  const totals = summarize(AttendanceModel.countByStatus({ date, teacherId }));
  const students = db.prepare('SELECT COUNT(*) AS n FROM students WHERE active = 1').get().n;
  return { date, students, ...totals };
}

/** Porcentaje de asistencia por salón en un rango */
export function byClassroom({ from, to, teacherId } = {}) {
  const where = ['1 = 1'];
  const p = [];
  if (from) { where.push('a.date >= ?'); p.push(from); }
  if (to) { where.push('a.date <= ?'); p.push(to); }
  if (teacherId) { where.push('sc.teacher_id = ?'); p.push(teacherId); }
  return db.prepare(`
    SELECT c.name AS classroom,
           COUNT(a.id) AS total,
           SUM(a.status != 'Inasistencia') AS present,
           SUM(a.status = 'Tarde') AS late,
           SUM(a.status = 'Inasistencia') AS absent,
           ROUND(100.0 * SUM(a.status != 'Inasistencia') / MAX(COUNT(a.id), 1), 1) AS rate
    FROM classrooms c
    LEFT JOIN schedules sc ON sc.classroom_id = c.id
    LEFT JOIN attendance a ON a.schedule_id = sc.id AND ${where.join(' AND ')}
    GROUP BY c.id ORDER BY CAST(c.name AS INTEGER), c.name`).all(...p);
}

/** Asistencia diaria (para el gráfico semanal) */
export function daily({ from, to, teacherId } = {}) {
  const where = ['a.date BETWEEN ? AND ?'];
  const p = [from, to];
  if (teacherId) { where.push('sc.teacher_id = ?'); p.push(teacherId); }
  return db.prepare(`
    SELECT a.date,
           COUNT(*) AS total,
           ROUND(100.0 * SUM(a.status != 'Inasistencia') / COUNT(*), 1) AS rate
    FROM attendance a JOIN schedules sc ON sc.id = a.schedule_id
    WHERE ${where.join(' AND ')}
    GROUP BY a.date ORDER BY a.date`).all(...p);
}

export function statusDistribution(filters = {}) {
  return summarize(AttendanceModel.countByStatus(filters));
}

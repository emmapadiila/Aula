import { db } from '../db/database.js';

const SELECT = `
  SELECT a.id, a.date, a.scheduled_time, a.arrival_time, a.status, a.created_at,
         s.id AS student_id, s.name AS student, s.code,
         c.name AS classroom, sc.subject, sc.id AS schedule_id, u.name AS teacher
  FROM attendance a
  JOIN students s   ON s.id = a.student_id
  JOIN schedules sc ON sc.id = a.schedule_id
  JOIN classrooms c ON c.id = sc.classroom_id
  JOIN users u      ON u.id = sc.teacher_id`;

const COUNT_FROM = `FROM attendance a
  JOIN students s ON s.id = a.student_id JOIN schedules sc ON sc.id = a.schedule_id`;

function buildWhere({ from, to, date, classroomId, status, studentId, scheduleId, teacherId, search }) {
  const where = [];
  const p = [];
  if (date) { where.push('a.date = ?'); p.push(date); }
  if (from) { where.push('a.date >= ?'); p.push(from); }
  if (to) { where.push('a.date <= ?'); p.push(to); }
  if (classroomId) { where.push('sc.classroom_id = ?'); p.push(classroomId); }
  if (status) { where.push('a.status = ?'); p.push(status); }
  if (studentId) { where.push('a.student_id = ?'); p.push(studentId); }
  if (scheduleId) { where.push('a.schedule_id = ?'); p.push(scheduleId); }
  if (teacherId) { where.push('sc.teacher_id = ?'); p.push(teacherId); }
  if (search) { where.push('(s.name LIKE ? OR s.code LIKE ?)'); p.push(`%${search}%`, `%${search}%`); }
  return { w: where.length ? `WHERE ${where.join(' AND ')}` : '', p };
}

export const AttendanceModel = {
  async list(filters = {}) {
    const { w, p } = buildWhere(filters);
    const limit = Number(filters.limit) || 50;
    const offset = Number(filters.offset) || 0;
    const [{ n: total }, rows] = await Promise.all([
      db.get(`SELECT COUNT(*) AS n ${COUNT_FROM} ${w}`, p),
      db.all(`${SELECT} ${w} ORDER BY a.date DESC, a.arrival_time DESC LIMIT ? OFFSET ?`, [...p, limit, offset]),
    ]);
    return { total, rows };
  },

  /** Todos los registros (sin paginar) para exportar */
  all(filters = {}) {
    const { w, p } = buildWhere(filters);
    return db.all(`${SELECT} ${w} ORDER BY CAST(c.name AS INTEGER), c.name, a.date, s.code`, p);
  },

  find: (studentId, scheduleId, date) =>
    db.get('SELECT * FROM attendance WHERE student_id = ? AND schedule_id = ? AND date = ?', [studentId, scheduleId, date]),

  async create(d) {
    const r = await db.run(`
      INSERT INTO attendance (student_id, schedule_id, date, scheduled_time, arrival_time, status, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.student_id, d.schedule_id, d.date, d.scheduled_time, d.arrival_time ?? null, d.status, d.recorded_by ?? null]);
    return db.get(`${SELECT} WHERE a.id = ?`, [r.lastInsertRowid]);
  },

  updateStatus: async (id, status) => (await db.run('UPDATE attendance SET status = ? WHERE id = ?', [status, id])).changes,

  /** Conteo por estado con filtros */
  countByStatus(filters = {}) {
    const { w, p } = buildWhere(filters);
    return db.all(`SELECT a.status, COUNT(*) AS n ${COUNT_FROM} ${w} GROUP BY a.status`, p);
  },
};

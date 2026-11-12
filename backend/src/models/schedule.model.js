import { db } from '../db/database.js';

const SELECT = `
  SELECT sc.*, c.name AS classroom, c.grade, u.name AS teacher_name,
         (SELECT COUNT(*) FROM students s WHERE s.classroom_id = sc.classroom_id AND s.active = 1) AS student_count
  FROM schedules sc
  JOIN classrooms c ON c.id = sc.classroom_id
  JOIN users u ON u.id = sc.teacher_id`;

export const ScheduleModel = {
  list({ teacherId, classroomId, weekday } = {}) {
    const where = [];
    const params = [];
    if (teacherId) { where.push('sc.teacher_id = ?'); params.push(teacherId); }
    if (classroomId) { where.push('sc.classroom_id = ?'); params.push(classroomId); }
    if (weekday) { where.push('sc.weekday = ?'); params.push(weekday); }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return db.all(`${SELECT} ${w} ORDER BY sc.weekday, sc.start_time, CAST(c.name AS INTEGER)`, params);
  },

  findById: (id) => db.get(`${SELECT} WHERE sc.id = ?`, [id]),

  async create(d) {
    const r = await db.run(`
      INSERT INTO schedules (classroom_id, teacher_id, subject, weekday, start_time, end_time, on_time_margin)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.classroom_id, d.teacher_id, d.subject, d.weekday, d.start_time, d.end_time, d.on_time_margin ?? null]);
    return ScheduleModel.findById(r.lastInsertRowid);
  },

  async update(id, d) {
    await db.run(`
      UPDATE schedules SET classroom_id = COALESCE(?, classroom_id), teacher_id = COALESCE(?, teacher_id),
        subject = COALESCE(?, subject), weekday = COALESCE(?, weekday), start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time), on_time_margin = COALESCE(?, on_time_margin)
      WHERE id = ?`,
    [d.classroom_id ?? null, d.teacher_id ?? null, d.subject ?? null, d.weekday ?? null,
      d.start_time ?? null, d.end_time ?? null, d.on_time_margin ?? null, id]);
    return ScheduleModel.findById(id);
  },

  /** Borra la jornada y sus asistencias */
  async remove(id) {
    if (!(await db.get('SELECT id FROM schedules WHERE id = ?', [id]))) return 0;
    await db.batch([
      { sql: 'DELETE FROM attendance WHERE schedule_id = ?', args: [id] },
      { sql: 'DELETE FROM schedules WHERE id = ?', args: [id] },
    ]);
    return 1;
  },
};

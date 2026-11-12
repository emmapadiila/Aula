import { db } from '../db/database.js';

const ORDER = 'ORDER BY CAST(c.name AS INTEGER), c.name';

export const ClassroomModel = {
  list: () =>
    db.all(`
      SELECT c.*, u.name AS teacher_name,
             (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id AND s.active = 1) AS student_count
      FROM classrooms c LEFT JOIN users u ON u.id = c.teacher_id
      ${ORDER}`),

  /** Salones donde el profesor tiene alguna jornada */
  listByTeacher: (teacherId) =>
    db.all(`
      SELECT DISTINCT c.*,
             (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id AND s.active = 1) AS student_count
      FROM classrooms c JOIN schedules sc ON sc.classroom_id = c.id
      WHERE sc.teacher_id = ? ${ORDER}`, [teacherId]),

  findById: (id) => db.get('SELECT * FROM classrooms WHERE id = ?', [id]),

  async create({ name, grade, teacher_id }) {
    const r = await db.run('INSERT INTO classrooms (name, grade, teacher_id) VALUES (?, ?, ?)', [name, grade, teacher_id ?? null]);
    return ClassroomModel.findById(r.lastInsertRowid);
  },

  async update(id, { name, grade, teacher_id }) {
    await db.run(`UPDATE classrooms SET name = COALESCE(?, name), grade = COALESCE(?, grade),
                  teacher_id = COALESCE(?, teacher_id) WHERE id = ?`,
    [name ?? null, grade ?? null, teacher_id ?? null, id]);
    return ClassroomModel.findById(id);
  },

  /** Borra el salón y sus jornadas (con asistencias). Los estudiantes quedan sin salón. */
  async remove(id) {
    if (!(await ClassroomModel.findById(id))) return 0;
    await db.batch([
      { sql: 'DELETE FROM attendance WHERE schedule_id IN (SELECT id FROM schedules WHERE classroom_id = ?)', args: [id] },
      { sql: 'DELETE FROM schedules WHERE classroom_id = ?', args: [id] },
      { sql: 'UPDATE students SET classroom_id = NULL WHERE classroom_id = ?', args: [id] },
      { sql: 'DELETE FROM classrooms WHERE id = ?', args: [id] },
    ]);
    return 1;
  },
};

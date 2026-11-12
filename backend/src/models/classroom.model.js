import { db } from '../db/database.js';

export const ClassroomModel = {
  list: () =>
    db.prepare(`
      SELECT c.*, u.name AS teacher_name,
             (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id AND s.active = 1) AS student_count
      FROM classrooms c LEFT JOIN users u ON u.id = c.teacher_id
      ORDER BY CAST(c.name AS INTEGER), c.name`).all(),

  /** Salones donde el profesor dicta alguna clase */
  listByTeacher: (teacherId) =>
    db.prepare(`
      SELECT DISTINCT c.*,
             (SELECT COUNT(*) FROM students s WHERE s.classroom_id = c.id AND s.active = 1) AS student_count
      FROM classrooms c JOIN schedules sc ON sc.classroom_id = c.id
      WHERE sc.teacher_id = ? ORDER BY CAST(c.name AS INTEGER), c.name`).all(teacherId),

  findById: (id) => db.prepare('SELECT * FROM classrooms WHERE id = ?').get(id),

  create: ({ name, grade, teacher_id }) => {
    const r = db.prepare('INSERT INTO classrooms (name, grade, teacher_id) VALUES (?, ?, ?)')
      .run(name, grade, teacher_id ?? null);
    return ClassroomModel.findById(r.lastInsertRowid);
  },

  update: (id, { name, grade, teacher_id }) => {
    db.prepare(`UPDATE classrooms SET name = COALESCE(?, name), grade = COALESCE(?, grade),
                teacher_id = COALESCE(?, teacher_id) WHERE id = ?`)
      .run(name ?? null, grade ?? null, teacher_id ?? null, id);
    return ClassroomModel.findById(id);
  },

  remove: (id) => db.prepare('DELETE FROM classrooms WHERE id = ?').run(id).changes,
};

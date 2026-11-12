import { db } from '../db/database.js';

const PUBLIC = 'id, name, email, role, subject, active, created_at';

export const UserModel = {
  findByEmail: (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email),
  findById: (id) => db.prepare(`SELECT ${PUBLIC} FROM users WHERE id = ?`).get(id),

  listTeachers: () =>
    db.prepare(`
      SELECT u.id, u.name, u.email, u.subject, u.active,
             (SELECT GROUP_CONCAT(DISTINCT c.name) FROM schedules s
                JOIN classrooms c ON c.id = s.classroom_id WHERE s.teacher_id = u.id) AS classrooms
      FROM users u WHERE u.role = 'teacher' ORDER BY u.name`).all(),

  create: ({ name, email, passwordHash, role, subject }) => {
    const r = db
      .prepare('INSERT INTO users (name, email, password_hash, role, subject) VALUES (?, ?, ?, ?, ?)')
      .run(name, email, passwordHash, role, subject ?? null);
    return UserModel.findById(r.lastInsertRowid);
  },

  update: (id, { name, email, subject, active }) => {
    db.prepare(`
      UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
             subject = COALESCE(?, subject), active = COALESCE(?, active) WHERE id = ?`)
      .run(name ?? null, email ?? null, subject ?? null, active ?? null, id);
    return UserModel.findById(id);
  },

  remove: (id) => db.prepare('DELETE FROM users WHERE id = ?').run(id).changes,
};

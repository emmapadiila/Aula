import { db } from '../db/database.js';

const PUBLIC = 'id, name, email, role, subject, active, created_at';

export const UserModel = {
  findByEmail: (email) => db.get('SELECT * FROM users WHERE email = ?', [email]),
  findById: (id) => db.get(`SELECT ${PUBLIC} FROM users WHERE id = ?`, [id]),

  listTeachers: () =>
    db.all(`
      SELECT u.id, u.name, u.email, u.subject, u.active,
             (SELECT GROUP_CONCAT(DISTINCT c.name) FROM schedules s
                JOIN classrooms c ON c.id = s.classroom_id WHERE s.teacher_id = u.id) AS classrooms
      FROM users u WHERE u.role = 'teacher' ORDER BY u.name`),

  async create({ name, email, passwordHash, role, subject }) {
    const r = await db.run('INSERT INTO users (name, email, password_hash, role, subject) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, subject ?? null]);
    return UserModel.findById(r.lastInsertRowid);
  },

  async update(id, { name, email, subject, active }) {
    await db.run(`
      UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
             subject = COALESCE(?, subject), active = COALESCE(?, active) WHERE id = ?`,
    [name ?? null, email ?? null, subject ?? null, active ?? null, id]);
    return UserModel.findById(id);
  },

  /** Borra el usuario y sus jornadas (con sus asistencias) */
  async remove(id) {
    const exists = await UserModel.findById(id);
    if (!exists) return 0;
    await db.batch([
      { sql: 'DELETE FROM attendance WHERE schedule_id IN (SELECT id FROM schedules WHERE teacher_id = ?)', args: [id] },
      { sql: 'DELETE FROM schedules WHERE teacher_id = ?', args: [id] },
      { sql: 'UPDATE classrooms SET teacher_id = NULL WHERE teacher_id = ?', args: [id] },
      { sql: 'UPDATE attendance SET recorded_by = NULL WHERE recorded_by = ?', args: [id] },
      { sql: 'DELETE FROM users WHERE id = ?', args: [id] },
    ]);
    return 1;
  },
};

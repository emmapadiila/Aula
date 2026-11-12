import { db } from '../db/database.js';

const SELECT = `
  SELECT s.id, s.code, s.name, s.document, s.email, s.classroom_id, s.entry_time,
         s.photo_url, s.active, s.created_at, c.name AS classroom, c.grade
  FROM students s LEFT JOIN classrooms c ON c.id = s.classroom_id`;

export const StudentModel = {
  /** Lista con filtros opcionales: search, classroomId, teacherId (solo salones del profesor) */
  list: ({ search, classroomId, teacherId, limit = 50, offset = 0 } = {}) => {
    const where = [];
    const params = [];
    if (search) {
      where.push('(s.name LIKE ? OR s.code LIKE ? OR s.document LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (classroomId) { where.push('s.classroom_id = ?'); params.push(classroomId); }
    if (teacherId) {
      where.push('s.classroom_id IN (SELECT classroom_id FROM schedules WHERE teacher_id = ?)');
      params.push(teacherId);
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) AS n FROM students s ${w}`).get(...params).n;
    const rows = db.prepare(`${SELECT} ${w} ORDER BY s.code LIMIT ? OFFSET ?`).all(...params, limit, offset);
    return { total, rows };
  },

  findById: (id) => db.prepare(`${SELECT} WHERE s.id = ?`).get(id),
  findByToken: (token) => db.prepare(`${SELECT} WHERE s.qr_token = ? AND s.active = 1`).get(token),
  getToken: (id) => db.prepare('SELECT qr_token FROM students WHERE id = ?').get(id)?.qr_token,

  /** Siguiente código del salón: EST-06041, EST-11035 ... */
  nextCode: (classroomId) => {
    const room = db.prepare('SELECT name FROM classrooms WHERE id = ?').get(classroomId);
    const prefix = `EST-${String(room?.name ?? '0').replace(/\W/g, '').padStart(2, '0')}`;
    const rows = db.prepare('SELECT code FROM students WHERE code LIKE ?').all(`${prefix}%`);
    const max = rows.reduce((m, r) => Math.max(m, Number(r.code.slice(prefix.length)) || 0), 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  },

  create: (data) => {
    const r = db.prepare(`
      INSERT INTO students (code, name, document, email, classroom_id, entry_time, qr_token, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(data.code, data.name, data.document ?? null, data.email ?? null, data.classroom_id ?? null,
        data.entry_time ?? null, data.qr_token, data.photo_url ?? null);
    return StudentModel.findById(r.lastInsertRowid);
  },

  /** Actualiza solo los campos enviados. Un campo vacío ('' o null) se borra. */
  update: (id, d) => {
    const ALLOWED = ['code', 'name', 'document', 'email', 'classroom_id', 'entry_time', 'photo_url', 'active', 'qr_token'];
    const keys = ALLOWED.filter((k) => d[k] !== undefined);
    if (keys.length) {
      db.prepare(`UPDATE students SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`)
        .run(...keys.map((k) => (d[k] === '' ? null : d[k])), id);
    }
    return StudentModel.findById(id);
  },

  remove: (id) => db.prepare('DELETE FROM students WHERE id = ?').run(id).changes,
};

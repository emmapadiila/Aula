import { db } from '../db/database.js';

const SELECT = `
  SELECT s.id, s.code, s.name, s.document, s.email, s.classroom_id, s.entry_time,
         s.photo_url, s.active, s.created_at, c.name AS classroom, c.grade
  FROM students s LEFT JOIN classrooms c ON c.id = s.classroom_id`;

export const StudentModel = {
  /** Lista con filtros opcionales: search, classroomId, teacherId (solo salones del profesor) */
  async list({ search, classroomId, teacherId, limit = 50, offset = 0 } = {}) {
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
    const [{ n: total }, rows] = await Promise.all([
      db.get(`SELECT COUNT(*) AS n FROM students s ${w}`, params),
      db.all(`${SELECT} ${w} ORDER BY s.code LIMIT ? OFFSET ?`, [...params, limit, offset]),
    ]);
    return { total, rows };
  },

  findById: (id) => db.get(`${SELECT} WHERE s.id = ?`, [id]),
  findByToken: (token) => db.get(`${SELECT} WHERE s.qr_token = ? AND s.active = 1`, [token]),
  findByCode: (code) => db.get(`${SELECT} WHERE s.code = ?`, [code]),
  getToken: async (id) => (await db.get('SELECT qr_token FROM students WHERE id = ?', [id]))?.qr_token,

  /** Siguiente código del salón: EST-06041, EST-11035 ... */
  async nextCode(classroomId) {
    const room = await db.get('SELECT name FROM classrooms WHERE id = ?', [classroomId]);
    const prefix = `EST-${String(room?.name ?? '0').replace(/\W/g, '').padStart(2, '0')}`;
    const rows = await db.all('SELECT code FROM students WHERE code LIKE ?', [`${prefix}%`]);
    const max = rows.reduce((m, r) => Math.max(m, Number(r.code.slice(prefix.length)) || 0), 0);
    return `${prefix}${String(max + 1).padStart(3, '0')}`;
  },

  async create(data) {
    const r = await db.run(`
      INSERT INTO students (code, name, document, email, classroom_id, entry_time, qr_token, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.code, data.name, data.document ?? null, data.email ?? null, data.classroom_id ?? null,
      data.entry_time ?? null, data.qr_token, data.photo_url ?? null]);
    return StudentModel.findById(r.lastInsertRowid);
  },

  /** Actualiza solo los campos enviados. Un campo vacío ('' o null) se borra. */
  async update(id, d) {
    const ALLOWED = ['code', 'name', 'document', 'email', 'classroom_id', 'entry_time', 'photo_url', 'active', 'qr_token'];
    const keys = ALLOWED.filter((k) => d[k] !== undefined);
    if (keys.length) {
      await db.run(`UPDATE students SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...keys.map((k) => (d[k] === '' ? null : d[k])), id]);
    }
    return StudentModel.findById(id);
  },

  /** Borra el estudiante y su historial de asistencia */
  async remove(id) {
    if (!(await StudentModel.findById(id))) return 0;
    await db.batch([
      { sql: 'DELETE FROM attendance WHERE student_id = ?', args: [id] },
      { sql: 'DELETE FROM students WHERE id = ?', args: [id] },
    ]);
    return 1;
  },
};

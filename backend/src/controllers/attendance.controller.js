import { AttendanceModel } from '../models/attendance.model.js';
import { closeClass, registerScan } from '../services/attendance.service.js';
import { badRequest, notFound, requireFields } from '../utils/errors.js';

const STATUSES = ['Temprano', 'Puntual', 'Tarde', 'Inasistencia'];

export const AttendanceController = {
  /** Historial con filtros: date, from, to, classroomId, status, studentId, scheduleId, search */
  async list(req, res) {
    const q = req.query;
    res.json(await AttendanceModel.list({
      ...q,
      classroomId: Number(q.classroomId) || undefined,
      studentId: Number(q.studentId) || undefined,
      scheduleId: Number(q.scheduleId) || undefined,
      teacherId: req.user.role === 'teacher' ? req.user.id : Number(q.teacherId) || undefined,
    }));
  },

  /** POST /attendance/scan { qr, scheduleId } */
  async scan(req, res) {
    requireFields(req.body, ['qr', 'scheduleId']);
    const result = await registerScan({ qrPayload: req.body.qr, scheduleId: Number(req.body.scheduleId), user: req.user });
    res.status(201).json(result);
  },

  /** POST /attendance/close/:scheduleId → genera inasistencias automáticas */
  async close(req, res) {
    res.json(await closeClass({ scheduleId: Number(req.params.scheduleId), user: req.user, date: req.body?.date }));
  },

  /** PATCH /attendance/:id { status } → corrección manual (admin) */
  async updateStatus(req, res) {
    if (!STATUSES.includes(req.body.status)) throw badRequest(`Estado inválido. Usa: ${STATUSES.join(', ')}`);
    if (!(await AttendanceModel.updateStatus(Number(req.params.id), req.body.status))) throw notFound();
    res.json({ ok: true });
  },
};

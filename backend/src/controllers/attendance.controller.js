import { AttendanceModel } from '../models/attendance.model.js';
import { closeClass, registerScan } from '../services/attendance.service.js';
import { badRequest, notFound, requireFields } from '../utils/errors.js';

const STATUSES = ['Temprano', 'Puntual', 'Tarde', 'Inasistencia'];

export const AttendanceController = {
  /** Historial con filtros: date, from, to, classroomId, status, studentId, scheduleId, search */
  list(req, res) {
    const q = req.query;
    res.json(AttendanceModel.list({
      ...q,
      classroomId: Number(q.classroomId) || undefined,
      studentId: Number(q.studentId) || undefined,
      scheduleId: Number(q.scheduleId) || undefined,
      teacherId: req.user.role === 'teacher' ? req.user.id : Number(q.teacherId) || undefined,
    }));
  },

  /** POST /attendance/scan { qr, scheduleId } */
  scan(req, res) {
    requireFields(req.body, ['qr', 'scheduleId']);
    const result = registerScan({ qrPayload: req.body.qr, scheduleId: Number(req.body.scheduleId), user: req.user });
    res.status(201).json(result);
  },

  /** POST /attendance/close/:scheduleId → genera inasistencias automáticas */
  close(req, res) {
    res.json(closeClass({ scheduleId: Number(req.params.scheduleId), user: req.user, date: req.body?.date }));
  },

  /** PATCH /attendance/:id { status } → corrección manual (admin) */
  updateStatus(req, res) {
    if (!STATUSES.includes(req.body.status)) throw badRequest(`Estado inválido. Usa: ${STATUSES.join(', ')}`);
    if (!AttendanceModel.updateStatus(Number(req.params.id), req.body.status)) throw notFound();
    res.json({ ok: true });
  },
};

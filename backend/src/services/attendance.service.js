import { env } from '../config/env.js';
import { db, transaction } from '../db/database.js';
import { AttendanceModel } from '../models/attendance.model.js';
import { ScheduleModel } from '../models/schedule.model.js';
import { StudentModel } from '../models/student.model.js';
import { badRequest, forbidden, HttpError, notFound } from '../utils/errors.js';
import { nowHHMM, todayISO, toMinutes } from '../utils/time.js';
import { parsePayload } from './qr.service.js';

/**
 * Regla de clasificación (pantalla "¿Cómo se clasifica la llegada?"):
 *   llegada <  hora programada                 → Temprano
 *   llegada <= hora programada + margen        → Puntual
 *   llegada >  hora programada + margen        → Tarde
 *   sin registro al cerrar la clase            → Inasistencia
 */
export function classifyArrival(scheduled, arrival, margin = env.onTimeMarginMin) {
  const diff = toMinutes(arrival) - toMinutes(scheduled);
  if (diff < 0) return 'Temprano';
  if (diff <= margin) return 'Puntual';
  return 'Tarde';
}

/** Registra un escaneo de QR para una clase concreta. */
export function registerScan({ qrPayload, scheduleId, user, at = new Date() }) {
  const schedule = ScheduleModel.findById(scheduleId);
  if (!schedule) throw notFound('Clase no encontrada');
  if (user.role === 'teacher' && schedule.teacher_id !== user.id) {
    throw forbidden('Esta clase no está asignada a ti');
  }

  const token = parsePayload(qrPayload);
  if (!token) {
    throw new HttpError(422, 'No pudimos reconocer este código. Verifica la manilla e inténtalo de nuevo.', 'INVALID_QR');
  }

  const student = StudentModel.findByToken(token);
  if (!student || student.classroom_id !== schedule.classroom_id) {
    throw new HttpError(404,
      'El código es válido, pero no está asociado a un estudiante de esta clase. Verifica el salón seleccionado.',
      'STUDENT_NOT_IN_CLASS');
  }

  const date = todayISO(at);
  const existing = AttendanceModel.find(student.id, schedule.id, date);
  if (existing) {
    throw new HttpError(409, `${student.name} ya tiene asistencia registrada (${existing.status}).`, 'ALREADY_REGISTERED');
  }

  // El horario individual del estudiante tiene prioridad sobre el de la clase
  const scheduled = student.entry_time || schedule.start_time;
  const margin = schedule.on_time_margin ?? env.onTimeMarginMin;
  const arrival = nowHHMM(at);
  const status = classifyArrival(scheduled, arrival, margin);

  const record = AttendanceModel.create({
    student_id: student.id,
    schedule_id: schedule.id,
    date,
    scheduled_time: scheduled,
    arrival_time: arrival,
    status,
    recorded_by: user.id,
  });
  return { student, record };
}

/** Cierra la clase: los estudiantes sin registro quedan como Inasistencia. */
export function closeClass({ scheduleId, user, date = todayISO() }) {
  const schedule = ScheduleModel.findById(scheduleId);
  if (!schedule) throw notFound('Clase no encontrada');
  if (user.role === 'teacher' && schedule.teacher_id !== user.id) throw forbidden();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest('Fecha inválida');

  const missing = db.prepare(`
    SELECT s.id, s.entry_time FROM students s
    WHERE s.classroom_id = ? AND s.active = 1
      AND NOT EXISTS (SELECT 1 FROM attendance a WHERE a.student_id = s.id AND a.schedule_id = ? AND a.date = ?)`)
    .all(schedule.classroom_id, schedule.id, date);

  transaction(() => {
    for (const s of missing) {
      AttendanceModel.create({
        student_id: s.id, schedule_id: schedule.id, date,
        scheduled_time: s.entry_time || schedule.start_time,
        arrival_time: null, status: 'Inasistencia', recorded_by: user.id,
      });
    }
  });
  return { absences: missing.length };
}

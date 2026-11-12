import { ScheduleModel } from '../models/schedule.model.js';
import { badRequest, notFound, requireFields } from '../utils/errors.js';
import { weekdayOf } from '../utils/time.js';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(body, current = {}) {
  for (const k of ['start_time', 'end_time']) {
    if (body[k] !== undefined && !HHMM.test(body[k])) throw badRequest(`${k} debe tener formato HH:MM`);
  }
  const start = body.start_time ?? current.start_time;
  const end = body.end_time ?? current.end_time;
  if (start && end && end <= start) throw badRequest('La hora de salida debe ser después de la de entrada');
  if (body.on_time_margin !== undefined && body.on_time_margin !== null &&
      !(Number.isInteger(Number(body.on_time_margin)) && Number(body.on_time_margin) >= 0 && Number(body.on_time_margin) <= 120)) {
    throw badRequest('El margen debe ser un número de minutos entre 0 y 120');
  }
}

export const ScheduleController = {
  async list(req, res) {
    const teacherId = req.user.role === 'teacher' ? req.user.id : Number(req.query.teacherId) || undefined;
    res.json(await ScheduleModel.list({
      teacherId,
      classroomId: Number(req.query.classroomId) || undefined,
      weekday: Number(req.query.weekday) || undefined,
    }));
  },

  /** Jornadas de hoy (hora de Colombia) del profesor, o de todos (admin) */
  async today(req, res) {
    const teacherId = req.user.role === 'teacher' ? req.user.id : undefined;
    res.json(await ScheduleModel.list({ teacherId, weekday: weekdayOf() }));
  },

  async create(req, res) {
    requireFields(req.body, ['classroom_id', 'teacher_id', 'subject', 'weekday', 'start_time', 'end_time']);
    validate(req.body);
    res.status(201).json(await ScheduleModel.create(req.body));
  },

  async update(req, res) {
    const id = Number(req.params.id);
    const current = await ScheduleModel.findById(id);
    if (!current) throw notFound('Horario no encontrado');
    validate(req.body, current);
    res.json(await ScheduleModel.update(id, req.body));
  },

  async remove(req, res) {
    if (!(await ScheduleModel.remove(Number(req.params.id)))) throw notFound('Horario no encontrado');
    res.status(204).end();
  },
};

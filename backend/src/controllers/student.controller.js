import { StudentModel } from '../models/student.model.js';
import { newToken, toDataURL, toPNG } from '../services/qr.service.js';
import { badRequest, forbidden, notFound, requireFields } from '../utils/errors.js';

const own = (req) => (req.user.role === 'teacher' ? req.user.id : undefined);

export const StudentController = {
  list(req, res) {
    const { search, classroomId, limit, offset } = req.query;
    res.json(StudentModel.list({
      search, classroomId: classroomId ? Number(classroomId) : undefined,
      teacherId: own(req), limit: Number(limit) || 50, offset: Number(offset) || 0,
    }));
  },

  get(req, res) {
    const s = StudentModel.findById(Number(req.params.id));
    if (!s) throw notFound('Estudiante no encontrado');
    res.json(s);
  },

  /** "Guardar y generar QR" */
  async create(req, res) {
    requireFields(req.body, ['name', 'classroom_id']);
    if (!req.body.document) delete req.body.document;
    const student = StudentModel.create({
      ...req.body,
      email: req.body.email?.trim().toLowerCase(),
      code: StudentModel.nextCode(req.body.classroom_id),
      qr_token: newToken(),
    });
    const qr = await toDataURL(StudentModel.getToken(student.id));
    res.status(201).json({ student, qr });
  },

  update(req, res) {
    const id = Number(req.params.id);
    if (!StudentModel.findById(id)) throw notFound('Estudiante no encontrado');
    const { qr_token, ...data } = req.body; // el token del QR solo cambia con /qr/regenerate
    if (data.name !== undefined && !String(data.name).trim()) throw badRequest('El nombre no puede quedar vacío');
    if (data.classroom_id === '' || data.classroom_id === null) throw badRequest('El estudiante debe tener un salón');
    if (data.code !== undefined) {
      data.code = String(data.code).trim().toUpperCase();
      if (!data.code) throw badRequest('El código no puede quedar vacío');
      const other = StudentModel.list({ search: data.code, limit: 500 }).rows.find((s) => s.code === data.code && s.id !== id);
      if (other) throw badRequest(`El código ${data.code} ya lo tiene ${other.name}`, 'DUPLICATE_CODE');
    }
    if (data.name) data.name = data.name.trim();
    if (data.email) data.email = data.email.trim().toLowerCase();
    if (data.active !== undefined) data.active = data.active ? 1 : 0;
    res.json(StudentModel.update(id, data));
  },

  /** POST /students/:id/qr/regenerate → nuevo QR (el anterior deja de funcionar, p. ej. manilla perdida) */
  async regenerateQr(req, res) {
    const id = Number(req.params.id);
    if (!StudentModel.findById(id)) throw notFound('Estudiante no encontrado');
    const student = StudentModel.update(id, { qr_token: newToken() });
    res.json({ student, qr: await toDataURL(StudentModel.getToken(id)) });
  },

  remove(req, res) {
    if (!StudentModel.remove(Number(req.params.id))) throw notFound('Estudiante no encontrado');
    res.status(204).end();
  },

  /** GET /students/:id/qr          → { qr: dataURL }
   *  GET /students/:id/qr?format=png → imagen descargable */
  async qr(req, res) {
    const s = StudentModel.findById(Number(req.params.id));
    if (!s) throw notFound('Estudiante no encontrado');
    if (req.user.role === 'teacher' && !StudentModel.list({ teacherId: req.user.id, search: s.code }).total) {
      throw forbidden();
    }
    const token = StudentModel.getToken(s.id);
    if (req.query.format === 'png') {
      res.type('png').attachment(`QR-${s.code}.png`).send(await toPNG(token));
    } else {
      res.json({ student: s, qr: await toDataURL(token) });
    }
  },
};

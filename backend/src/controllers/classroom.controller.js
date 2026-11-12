import { ClassroomModel } from '../models/classroom.model.js';
import { notFound, requireFields } from '../utils/errors.js';

export const ClassroomController = {
  list: (req, res) =>
    res.json(req.user.role === 'teacher' ? ClassroomModel.listByTeacher(req.user.id) : ClassroomModel.list()),

  create(req, res) {
    requireFields(req.body, ['name', 'grade']);
    res.status(201).json(ClassroomModel.create(req.body));
  },

  update(req, res) {
    const id = Number(req.params.id);
    if (!ClassroomModel.findById(id)) throw notFound('Salón no encontrado');
    res.json(ClassroomModel.update(id, req.body));
  },

  remove(req, res) {
    if (!ClassroomModel.remove(Number(req.params.id))) throw notFound('Salón no encontrado');
    res.status(204).end();
  },
};

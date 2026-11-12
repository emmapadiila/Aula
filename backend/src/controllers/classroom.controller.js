import { ClassroomModel } from '../models/classroom.model.js';
import { notFound, requireFields } from '../utils/errors.js';

export const ClassroomController = {
  list: async (req, res) =>
    res.json(req.user.role === 'teacher' ? await ClassroomModel.listByTeacher(req.user.id) : await ClassroomModel.list()),

  async create(req, res) {
    requireFields(req.body, ['name', 'grade']);
    res.status(201).json(await ClassroomModel.create({ ...req.body, name: String(req.body.name).trim() }));
  },

  async update(req, res) {
    const id = Number(req.params.id);
    if (!(await ClassroomModel.findById(id))) throw notFound('Salón no encontrado');
    res.json(await ClassroomModel.update(id, req.body));
  },

  async remove(req, res) {
    if (!(await ClassroomModel.remove(Number(req.params.id)))) throw notFound('Salón no encontrado');
    res.status(204).end();
  },
};

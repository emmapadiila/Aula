import { UserModel } from '../models/user.model.js';
import { hashPassword } from '../services/auth.service.js';
import { notFound, requireFields } from '../utils/errors.js';

export const TeacherController = {
  list: (_req, res) => res.json(UserModel.listTeachers()),

  create(req, res) {
    requireFields(req.body, ['name', 'email', 'password']);
    const user = UserModel.create({
      name: req.body.name,
      email: req.body.email.trim().toLowerCase(),
      passwordHash: hashPassword(req.body.password),
      role: 'teacher',
      subject: req.body.subject,
    });
    res.status(201).json(user);
  },

  update(req, res) {
    const id = Number(req.params.id);
    const u = UserModel.findById(id);
    if (!u || u.role !== 'teacher') throw notFound('Profesor no encontrado');
    res.json(UserModel.update(id, req.body));
  },

  remove(req, res) {
    if (!UserModel.remove(Number(req.params.id))) throw notFound('Profesor no encontrado');
    res.status(204).end();
  },
};

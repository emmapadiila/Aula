import { UserModel } from '../models/user.model.js';
import { hashPassword } from '../services/auth.service.js';
import { notFound, requireFields } from '../utils/errors.js';

export const TeacherController = {
  list: async (_req, res) => res.json(await UserModel.listTeachers()),

  async create(req, res) {
    requireFields(req.body, ['name', 'email', 'password']);
    const user = await UserModel.create({
      name: req.body.name,
      email: req.body.email.trim().toLowerCase(),
      passwordHash: hashPassword(req.body.password),
      role: 'teacher',
      subject: req.body.subject,
    });
    res.status(201).json(user);
  },

  async update(req, res) {
    const id = Number(req.params.id);
    const u = await UserModel.findById(id);
    if (!u || u.role !== 'teacher') throw notFound('Profesor no encontrado');
    res.json(await UserModel.update(id, req.body));
  },

  async remove(req, res) {
    const id = Number(req.params.id);
    const u = await UserModel.findById(id);
    if (!u || u.role !== 'teacher') throw notFound('Profesor no encontrado');
    await UserModel.remove(id);
    res.status(204).end();
  },
};

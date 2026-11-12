import { UserModel } from '../models/user.model.js';
import { login } from '../services/auth.service.js';
import { requireFields } from '../utils/errors.js';

export const AuthController = {
  async login(req, res) {
    requireFields(req.body, ['email', 'password']);
    res.json(await login(req.body.email, req.body.password));
  },
  async me(req, res) {
    res.json(await UserModel.findById(req.user.id));
  },
};

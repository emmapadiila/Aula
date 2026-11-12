import { UserModel } from '../models/user.model.js';
import { login } from '../services/auth.service.js';
import { requireFields } from '../utils/errors.js';

export const AuthController = {
  login(req, res) {
    requireFields(req.body, ['email', 'password']);
    res.json(login(req.body.email, req.body.password));
  },
  me(req, res) {
    res.json(UserModel.findById(req.user.id));
  },
};

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
import { unauthorized } from '../utils/errors.js';

export const hashPassword = (plain) => bcrypt.hashSync(plain, 10);

export function login(email, password) {
  const user = UserModel.findByEmail(String(email).trim().toLowerCase());
  if (!user || !user.active || !bcrypt.compareSync(password, user.password_hash)) {
    throw unauthorized('Correo o contraseña incorrectos');
  }
  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
  const { password_hash, ...publicUser } = user;
  return { token, user: publicUser };
}

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

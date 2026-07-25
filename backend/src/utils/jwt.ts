import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

export const generateAdminToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '24h' });
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AdminTokenPayload;
};

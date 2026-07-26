import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

// Use a dedicated admin secret — isolates admin JWTs from user access tokens
export const generateAdminToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ADMIN_SECRET, { expiresIn: '24h' });
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload;
};

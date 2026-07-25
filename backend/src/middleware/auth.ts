import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createError } from './errorHandler';
import User, { IUser } from '../models/User';
import Admin, { IAdmin } from '../models/Admin';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface AdminRequest extends Request {
  admin?: IAdmin;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as { userId: string };
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokenHash');
    if (!user) throw createError('User not found', 401);
    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(createError('Invalid or expired token', 401));
    } else {
      next(err);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Unauthorized', 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(createError('Forbidden: insufficient permissions', 403));
      return;
    }
    next();
  };
};

export const authenticateAdmin = async (
  req: AdminRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token = req.cookies?.adminToken;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw createError('No admin token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as { id: string, role: string };
    
    const validRoles = ['admin', 'super_admin', 'superadmin'];
    if (!validRoles.includes(decoded.role)) {
      throw createError('Forbidden: insufficient admin privileges', 403);
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash -secretKeyHash');
    if (!admin || admin.isDeleted) {
      throw createError('Admin not found', 401);
    }
    if (!admin.isActive) {
      throw createError('Admin account is deactivated', 403);
    }

    req.admin = admin;
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(createError('Invalid or expired admin token', 401));
    } else {
      next(err);
    }
  }
};

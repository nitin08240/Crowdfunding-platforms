import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { AdminRequest } from '../middleware/auth';
import { generateAdminToken, verifyAdminToken } from '../utils/jwt';

export const adminAuthController = {
  /**
   * POST /api/v1/admin-auth/login
   * Production-grade MongoDB 3FA authentication (Email + Password + Secret Key)
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, secretKey } = req.body;

      if (!email || !password || !secretKey) {
        throw createError('Please provide email, password, and secretKey', 400);
      }

      // Step 4: Find Admin in MongoDB by email (excluding soft-deleted)
      const admin = await Admin.findOne({ 
        email: email.toLowerCase().trim(),
        isDeleted: false 
      });

      if (!admin) {
        throw createError('Invalid credentials', 401);
      }

      // Account status check
      if (!admin.isActive) {
        throw createError('Admin account is deactivated. Contact system administrator.', 403);
      }

      // Compare Password using bcrypt
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        await admin.save();
        throw createError('Invalid credentials', 401);
      }

      // Compare Secret Key using bcrypt
      const isSecretValid = await admin.compareSecretKey(secretKey);
      if (!isSecretValid) {
        admin.loginAttempts = (admin.loginAttempts || 0) + 1;
        await admin.save();
        throw createError('Invalid credentials', 401);
      }

      // Login success — reset attempts & update last login
      admin.loginAttempts = 0;
      admin.lastLoginAt = new Date();
      await admin.save();

      // Step 5: Generate JWT with payload { id, email, role }
      const token = generateAdminToken({
        id: String(admin._id),
        email: admin.email,
        role: admin.role,
      });

      // Audit log entry
      try {
        await AuditLog.create({
          adminId: admin._id,
          action: 'ADMIN_LOGIN',
          targetType: 'platform',
          details: { email: admin.email, name: admin.name, role: admin.role },
          ip: req.ip,
        });
      } catch (e) {
        console.error('Audit log failed:', e);
      }

      // HttpOnly secure cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // 'strict' blocks cross-port in dev (localhost:5173 → localhost:5000);
        // use 'lax' in dev so the cookie is sent on top-level navigations
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            profileImage: admin.profileImage,
            lastLoginAt: admin.lastLoginAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin-auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = verifyAdminToken(token);
          await AuditLog.create({
            adminId: decoded.id,
            action: 'ADMIN_LOGOUT',
            targetType: 'platform',
            details: { email: decoded.email },
            ip: req.ip,
          });
        } catch {
          // Ignore token verification errors during logout
        }
      }

      res.clearCookie('adminToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.json({ success: true, message: 'Admin logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Step 7: GET /api/v1/admin-auth/me
   * Return currently authenticated Admin profile
   */
  async getMe(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const admin = req.admin;
      if (!admin) throw createError('Not authenticated', 401);

      res.json({
        success: true,
        data: {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            profileImage: admin.profileImage,
            isActive: admin.isActive,
            lastLoginAt: admin.lastLoginAt,
            createdAt: admin.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Step 9: PUT /api/v1/admin-auth/change-password
   */
  async changePassword(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const admin = req.admin;

      if (!admin) throw createError('Not authenticated', 401);
      if (!currentPassword || !newPassword) {
        throw createError('Current password and new password are required', 400);
      }
      if (newPassword.length < 6) {
        throw createError('New password must be at least 6 characters long', 400);
      }

      const isValid = await admin.comparePassword(currentPassword);
      if (!isValid) {
        throw createError('Invalid current password', 400);
      }

      admin.passwordHash = newPassword; // Pre-save hook will hash this
      await admin.save();

      try {
        await AuditLog.create({
          adminId: admin._id,
          action: 'ADMIN_CHANGE_PASSWORD',
          targetType: 'platform',
          details: { email: admin.email },
          ip: req.ip,
        });
      } catch (e) {
        console.error('Audit log failed:', e);
      }

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Step 10: PUT /api/v1/admin-auth/change-secret-key
   */
  async changeSecretKey(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { currentSecretKey, newSecretKey } = req.body;
      const admin = req.admin;

      if (!admin) throw createError('Not authenticated', 401);
      if (!currentSecretKey || !newSecretKey) {
        throw createError('Current secret key and new secret key are required', 400);
      }
      if (newSecretKey.length < 4) {
        throw createError('New secret key must be at least 4 characters', 400);
      }

      const isValid = await admin.compareSecretKey(currentSecretKey);
      if (!isValid) {
        throw createError('Invalid current secret key', 400);
      }

      const secretKeyHash = await bcrypt.hash(newSecretKey, 12);
      admin.secretKeyHash = secretKeyHash;
      await admin.save();

      try {
        await AuditLog.create({
          adminId: admin._id,
          action: 'ADMIN_CHANGE_SECRET_KEY',
          targetType: 'platform',
          details: { email: admin.email },
          ip: req.ip,
        });
      } catch (e) {
        console.error('Audit log failed:', e);
      }

      res.json({ success: true, message: 'Secret key updated successfully' });
    } catch (error) {
      next(error);
    }
  },
};

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { cloudinaryService } from '../services/cloudinary.service';
import { createError } from '../middleware/errorHandler';
export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.register(name, email, password);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          accessToken,
          user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({
        success: true,
        data: {
          accessToken,
          user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) await authService.logout(String(req.user._id));
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, message: 'No refresh token' });
        return;
      }
      const { accessToken, refreshToken } = await authService.refreshTokens(token);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, data: { accessToken } });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      await authService.verifyEmail(token);
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: { user: req.user } });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, address, bio } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user) throw createError('User not found', 404);

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (bio !== undefined) user.bio = bio;

      await user.save();
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const user = await User.findById(req.user!._id);
      if (!user) throw createError('User not found', 404);

      const avatarUrl = await cloudinaryService.uploadBuffer(file.buffer, file.mimetype, 'avatars');
      
      // Delete old avatar if it exists
      if (user.avatar) {
        await cloudinaryService.deleteByUrl(user.avatar);
      }

      user.avatar = avatarUrl;
      await user.save();

      res.json({ success: true, data: { avatarUrl } });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user) throw createError('User not found', 404);

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) throw createError('Incorrect current password', 400);

      user.passwordHash = newPassword; // Pre-save hook will hash it
      await user.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  },
};

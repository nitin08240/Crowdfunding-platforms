import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { emailService } from './email.service';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as any,
  });
  return { accessToken, refreshToken };
};

export type UserRole = 'user' | 'admin';

export const authService = {
  async register(name: string, email: string, password: string, role: UserRole = 'user') {
    const existing = await User.findOne({ email });
    if (existing) throw createError('Email already in use', 409);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role,
      emailVerificationToken: verificationToken,
    });

    try {
      await emailService.sendVerificationEmail(email, name, verificationToken);
    } catch (e) {
      console.error('Failed to send verification email during registration:', e);
    }
    const { accessToken, refreshToken } = generateTokens(String(user._id));
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshHash;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw createError('Invalid credentials', 401);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw createError('Invalid credentials', 401);

    const { accessToken, refreshToken } = generateTokens(String(user._id));
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshHash;
    await user.save();

    return { user, accessToken, refreshToken };
  },

  async verifyEmail(token: string) {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) throw createError('Invalid or expired token', 400);
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    return user;
  },

  async refreshTokens(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokenHash) throw createError('Invalid refresh token', 401);
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) throw createError('Invalid refresh token', 401);

    const { accessToken, refreshToken: newRefresh } = generateTokens(String(user._id));
    user.refreshTokenHash = await bcrypt.hash(newRefresh, 10);
    await user.save();
    return { accessToken, refreshToken: newRefresh };
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) return; // Silent fail for security

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    await emailService.sendPasswordResetEmail(email, user.name, resetToken);
  },

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) throw createError('Invalid or expired reset token', 400);
    user.passwordHash = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return user;
  },
};

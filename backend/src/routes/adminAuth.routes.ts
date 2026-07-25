import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuthController } from '../controllers/adminAuth.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Strict rate limiting for admin login: 10 attempts per 15 minutes
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', adminLoginLimiter, adminAuthController.login);
router.post('/logout', adminAuthController.logout);
router.get('/me', authenticateAdmin, adminAuthController.getMe);
router.put('/change-password', authenticateAdmin, adminAuthController.changePassword);
router.put('/change-secret-key', authenticateAdmin, adminAuthController.changeSecretKey);

export default router;

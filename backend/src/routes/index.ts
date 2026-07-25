import { Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import donationRoutes from './donation.routes';
import paymentRoutes from './payment.routes';
import withdrawalRoutes from './withdrawal.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import adminAuthRoutes from './adminAuth.routes';
import notificationRoutes from './notification.routes';
import ngoRoutes from './ngo.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/donations', donationRoutes);
router.use('/payments', paymentRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/admin-auth', adminAuthRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ngos', ngoRoutes);

export default router;

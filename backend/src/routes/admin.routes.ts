import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { adminAuthController } from '../controllers/adminAuth.controller';
import { notificationController } from '../controllers/notification.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require admin authentication via HttpOnly cookie or Bearer token
router.use(authenticateAdmin);

// ── Admin Profile & Settings ──────────────────────────────────────────────────
router.get('/me', adminAuthController.getMe);
router.put('/change-password', adminAuthController.changePassword);
router.put('/change-secret-key', adminAuthController.changeSecretKey);

// ── Stats & Dashboard ─────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getDashboard);
router.get('/reports', adminController.getReports);
router.get('/search', adminController.globalSearch);

// ── Platform Settings ─────────────────────────────────────────────────────────
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/approve-kyc', adminController.approveKYC);
router.patch('/users/:id/reject-kyc', adminController.rejectKYC);
router.delete('/users/:id', adminController.deleteUser);

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns', adminController.getCampaigns);
router.get('/campaigns/:id', adminController.getCampaignDetail);
router.put('/campaigns/:id/approve', adminController.approveCampaign);
router.put('/campaigns/:id/reject', adminController.rejectCampaign);
router.put('/campaigns/:id/suspend', adminController.suspendCampaign);
router.patch('/campaigns/:id/feature', adminController.featureCampaign);
router.delete('/campaigns/:id', adminController.deleteCampaign);

// ── Donations ─────────────────────────────────────────────────────────────────
router.get('/donations', adminController.getDonations);

// ── Withdrawals ───────────────────────────────────────────────────────────────
router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminController.rejectWithdrawal);
router.put('/withdrawals/:id/complete', adminController.completeWithdrawal);

// ── NGOs ──────────────────────────────────────────────────────────────────────
router.get('/ngos', adminController.getNGOs);
router.get('/ngos/:id', adminController.getNGODetail);
router.put('/ngos/:id/verify', adminController.verifyNGO);
router.put('/ngos/:id/reject', adminController.rejectNGO);
router.put('/ngos/:id/request-info', adminController.requestMoreInfoNGO);
router.put('/ngos/:id/suspend', adminController.suspendNGO);
router.delete('/ngos/:id', adminController.deleteNGO);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', adminController.getAuditLogs);

export default router;

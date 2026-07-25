import { Router } from 'express';
import { donationController } from '../controllers/donation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Authenticated user's own donation history (paginated)
router.get('/history', authenticate, donationController.getHistory);

// Aggregated stats for dashboard (total donated, count, avg, campaigns supported)
router.get('/me/stats', authenticate, donationController.getMyStats);

// Public campaign donor list (masked for anonymous)
router.get('/campaign/:id', donationController.getCampaignDonations);

router.get('/:id/receipt/download', authenticate, donationController.downloadReceipt);

export default router;

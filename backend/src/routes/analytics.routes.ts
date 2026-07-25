import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), analyticsController.getOverall);
router.get('/campaign/:id', authenticate, analyticsController.getCampaignAnalytics);

export default router;

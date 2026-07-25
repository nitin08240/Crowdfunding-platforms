import { Router } from 'express';
import { withdrawalController } from '../controllers/withdrawal.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createWithdrawalSchema } from '../validators/withdrawal.validator';

const router = Router();

// Create a new withdrawal request (Zod validated)
router.post('/', authenticate, validate(createWithdrawalSchema), withdrawalController.create);

// Get all withdrawals for the logged-in user (paginated)
router.get('/mine', authenticate, withdrawalController.getMine);

// Get all withdrawals for a specific campaign (with aggregated stats)
router.get('/campaign/:campaignId', authenticate, withdrawalController.getByCampaign);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCampaignSchema, updateCampaignSchema } from '../validators/campaign.validator';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Public routes
router.get('/', campaignController.getAll);
router.get('/:slug/by-slug', campaignController.getOne);

// Protected routes (any authenticated user)
router.get('/my', authenticate, campaignController.getMyCampaigns);
router.post('/', authenticate, validate(createCampaignSchema), campaignController.create);
router.put('/:id', authenticate, validate(updateCampaignSchema), campaignController.update);
router.delete('/:id', authenticate, campaignController.delete);
router.patch('/:id/status', authenticate, campaignController.updateStatus);

// Document upload
router.post('/:id/documents', authenticate, upload.array('documents', 10), campaignController.uploadDocuments);

// Campaign updates (owner posts progress)
router.post('/:id/updates', authenticate, campaignController.addUpdate);
router.get('/:id/updates', campaignController.getUpdates);

// Slug-based single campaign (must be last to avoid catching other routes)
router.get('/:slug', campaignController.getOne);

export default router;

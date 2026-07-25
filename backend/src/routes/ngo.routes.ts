import { Router } from 'express';
import { ngoController } from '../controllers/ngo.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Document fields array for multer
const documentFields = [
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'certificate12A', maxCount: 1 },
  { name: 'certificate80G', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'representativeIdProof', maxCount: 1 },
  { name: 'representativePhoto', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'annualReport', maxCount: 1 },
  { name: 'financialStatement', maxCount: 1 },
  { name: 'fcraCertificate', maxCount: 1 },
  { name: 'cancelledChequeUrl', maxCount: 1 },
];

// Public routes
router.get('/', ngoController.getNGOs);
router.get('/:id', ngoController.getNGOById);

// Protected applicant routes
router.get('/user/my-ngo', authenticate, ngoController.getMyNGO);
router.post('/register', authenticate, upload.fields(documentFields), ngoController.registerNGO);
router.put('/:id', authenticate, upload.fields(documentFields), ngoController.updateNGO);

export default router;


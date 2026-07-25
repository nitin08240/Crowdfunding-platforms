import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';

const router = Router();

// Create a Razorpay order + pending Donation record
router.post('/create-order', authenticate, validate(createOrderSchema), paymentController.createOrder);

// Verify payment signature and mark donation as paid
router.post('/verify', authenticate, validate(verifyPaymentSchema), paymentController.verifyPayment);

// Razorpay webhook — no auth (signature verified in service)
router.post('/webhook', paymentController.webhook);

export default router;

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { paymentService } from '../services/payment.service';

export const paymentController = {
  /**
   * POST /payments/create-order
   * Creates a Razorpay order and a pending Donation document.
   * Validation: createOrderSchema (applied at router level).
   */
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { campaignId, amount, isAnonymous, message } = req.body;
      const result = await paymentService.createOrder(
        campaignId,
        amount,
        String(req.user!._id),
        isAnonymous ?? false,
        message,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /payments/verify
   * Verifies the Razorpay signature and marks the donation as paid.
   * Validation: verifyPaymentSchema (applied at router level).
   */
  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const donation = await paymentService.verifyPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );
      res.json({ success: true, message: 'Payment verified', data: { donation } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /payments/webhook
   * Razorpay webhook receiver — no auth required (signature verified in service).
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody
        ? (req as any).rawBody.toString('utf8')
        : JSON.stringify(req.body);
      await paymentService.handleWebhook(rawBody, signature);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

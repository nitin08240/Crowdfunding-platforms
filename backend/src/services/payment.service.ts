import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { env } from '../config/env';
import Donation from '../models/Donation';
import Campaign from '../models/Campaign';
import Transaction from '../models/Transaction';
import { createError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import User from '../models/User';
import { logger } from '../utils/logger';
import { emitDonation } from '../sockets/donation.socket';

// ── Singleton Razorpay instance (created once at module load) ────────────────
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

/** Generate a short unique receipt number, e.g. "RCP-20260707-A3F8" */
const generateReceiptNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${date}-${rand}`;
};

/** Determines whether mock payment bypass is allowed (dev/test only). */
const isMockPayment = (orderId: string, paymentId: string): boolean =>
  (orderId.startsWith('order_mock_') ||
    paymentId.startsWith('pay_mock_') ||
    env.RAZORPAY_KEY_SECRET === 'placeholder_secret') &&
  process.env.NODE_ENV !== 'production';

/**
 * Non-fatal side effects run after a donation is successfully paid.
 * Emits a real-time socket event and sends a confirmation email.
 * Errors here are logged but do NOT propagate — payment is already committed.
 */
const runPostPaymentSideEffects = async (
  donation: any,
  updatedCampaign: any,
): Promise<void> => {
  // Socket event
  try {
    const donor = await User.findById(donation.donor).select('name').lean();
    emitDonation(String(donation.campaign), {
      amount: donation.amount,
      donorName: donation.isAnonymous ? 'Anonymous' : (donor?.name ?? 'Anonymous'),
      isAnonymous: donation.isAnonymous,
      message: donation.message,
      raisedAmount: updatedCampaign?.raisedAmount ?? 0,
      donorCount: updatedCampaign?.donorCount ?? 0,
    });
  } catch (socketErr) {
    logger.error({ socketErr }, 'Socket emit failed after payment');
  }

  // Confirmation email
  try {
    const [donor, campaign] = await Promise.all([
      User.findById(donation.donor).lean(),
      Campaign.findById(donation.campaign).select('title').lean(),
    ]);
    if (donor && campaign) {
      await emailService.sendDonationConfirmation(
        (donor as any).email,
        (donor as any).name,
        (campaign as any).title,
        donation.amount,
      );
    }
  } catch (emailErr) {
    logger.error({ emailErr }, 'Failed to send donation confirmation email');
  }
};

export const paymentService = {
  /**
   * Creates a Razorpay order and a pending Donation document.
   * In development (when the key is a placeholder) a mock order is created instead.
   */
  async createOrder(
    campaignId: string,
    amount: number,
    donorId: string,
    isAnonymous: boolean,
    message?: string,
  ) {
    const campaign = await Campaign.findById(campaignId).select('status deadline title').lean();
    if (!campaign) throw createError('Campaign not found', 404);
    if ((campaign as any).status !== 'active')
      throw createError('Campaign is not accepting donations', 400);
    if (new Date() > new Date((campaign as any).deadline))
      throw createError('This campaign has ended and is no longer accepting donations', 400);

    let razorpayOrder: any;
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder') {
      razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // paise
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
      });
    } else {
      // Mock order for development
      razorpayOrder = {
        id: `order_mock_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
      };
    }

    const donation = await Donation.create({
      donor: donorId,
      campaign: campaignId,
      amount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      status: 'created',
      isAnonymous,
      message,
    });

    return { order: razorpayOrder, donation, keyId: env.RAZORPAY_KEY_ID };
  },

  /**
   * Called by the frontend immediately after Razorpay checkout succeeds.
   * This is the PRIMARY path — it atomically:
   *   1. Verifies the Razorpay signature
   *   2. Marks the donation as paid (idempotent via findOneAndUpdate)
   *   3. Increments Campaign raisedAmount + donorCount + availableBalance
   *   4. Creates a Transaction ledger record
   *   5. Runs non-fatal side-effects (socket + email)
   */
  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    // ── Step 1: Verify Razorpay signature ─────────────────────────────────
    if (!isMockPayment(razorpayOrderId, razorpayPaymentId)) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSig = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      if (expectedSig !== razorpaySignature) {
        throw createError('Invalid payment signature', 400);
      }
    }

    // ── Step 2 – 4: Atomic DB update inside a transaction ─────────────────
    let updatedCampaign: any = null;
    let donation: any = null;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomic: only updates if not already paid — prevents race conditions
      donation = await Donation.findOneAndUpdate(
        { razorpayOrderId, status: { $ne: 'paid' } },
        {
          $set: { status: 'paid', razorpayPaymentId, paymentMethod: 'razorpay' },
        },
        { new: true, session },
      );

      if (!donation) {
        // Check whether it already exists and is paid (idempotency)
        const existing = await Donation.findOne({ razorpayOrderId }).session(session).lean();
        if (!existing) throw createError('Donation not found', 404);
        if ((existing as any).status === 'paid') {
          logger.info(`verifyPayment: donation ${(existing as any)._id} already paid — skipping`);
          await session.abortTransaction();
          return existing;
        }
      }

      // Assign receipt number if not already set
      if (!donation.receiptNumber) {
        donation.receiptNumber = generateReceiptNumber();
        await donation.save({ session });
      }

      // Increment campaign stats atomically
      updatedCampaign = await Campaign.findByIdAndUpdate(
        donation.campaign,
        {
          $inc: {
            raisedAmount: donation.amount,
            donorCount: 1,
            availableBalance: donation.amount,
          },
          $set: { updatedAt: new Date(), lastDonationDate: new Date() },
        },
        { new: true, session },
      );

      // Idempotent transaction ledger entry
      const existingTx = await Transaction.findOne({
        transactionId: razorpayPaymentId,
      }).session(session);

      if (!existingTx) {
        await Transaction.create(
          [
            {
              transactionId: razorpayPaymentId,
              donation: donation._id,
              user: donation.donor,
              campaign: donation.campaign,
              amount: donation.amount,
              paymentMethod: 'razorpay',
              status: 'success',
              gatewayResponse: { razorpayOrderId, razorpayPaymentId, razorpaySignature },
            },
          ],
          { session },
        );
      }

      await session.commitTransaction();
      logger.info(
        `verifyPayment: donation ${donation._id} paid ✓, campaign ${donation.campaign} updated`,
      );
    } catch (err) {
      await session.abortTransaction();
      logger.error({ err }, 'verifyPayment failed');
      throw err;
    } finally {
      session.endSession();
    }

    // ── Step 5: Non-fatal side effects ────────────────────────────────────
    await runPostPaymentSideEffects(donation, updatedCampaign);

    return donation;
  },

  /**
   * Razorpay Webhook — authoritative fallback for payment events.
   * Handles cases where the user closes the browser before verifyPayment runs.
   * Idempotency: skips campaign increment if donation is already 'paid'.
   */
  async handleWebhook(body: string, signature: string) {
    // Verify webhook signature
    if (
      env.RAZORPAY_WEBHOOK_SECRET &&
      env.RAZORPAY_WEBHOOK_SECRET !== 'placeholder_webhook_secret'
    ) {
      const expectedSig = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      if (expectedSig !== signature) throw createError('Invalid webhook signature', 400);
    }

    const payload = JSON.parse(body);
    if (payload.event !== 'payment.captured') return;

    const { order_id, id: paymentId } = payload.payment.entity;

    let updatedCampaign: any = null;
    let processedDonation: any = null;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomic: only updates if not already paid
      processedDonation = await Donation.findOneAndUpdate(
        { razorpayOrderId: order_id, status: { $ne: 'paid' } },
        {
          $set: { status: 'paid', razorpayPaymentId: paymentId, paymentMethod: 'razorpay' },
        },
        { new: true, session },
      );

      if (!processedDonation) {
        const existing = await Donation.findOne({ razorpayOrderId: order_id }).session(session).lean();
        if (!existing) {
          logger.error(`Webhook: No donation found for orderId: ${order_id}`);
          await session.abortTransaction();
          return;
        }
        if ((existing as any).status === 'paid') {
          logger.info(
            `Webhook: donation ${(existing as any)._id} already paid — ensuring tx record exists`,
          );
          const existingTx = await Transaction.findOne({ transactionId: paymentId }).session(session);
          if (!existingTx) {
            await Transaction.create(
              [
                {
                  transactionId: paymentId,
                  donation: (existing as any)._id,
                  user: (existing as any).donor,
                  campaign: (existing as any).campaign,
                  amount: (existing as any).amount,
                  paymentMethod: 'razorpay',
                  status: 'success',
                  gatewayResponse: payload.payment.entity,
                },
              ],
              { session },
            );
          }
          await session.commitTransaction();
          return existing;
        }
      }

      if (!processedDonation.receiptNumber) {
        processedDonation.receiptNumber = generateReceiptNumber();
        await processedDonation.save({ session });
      }

      updatedCampaign = await Campaign.findByIdAndUpdate(
        processedDonation.campaign,
        {
          $inc: {
            raisedAmount: processedDonation.amount,
            donorCount: 1,
            availableBalance: processedDonation.amount,
          },
          $set: { updatedAt: new Date(), lastDonationDate: new Date() },
        },
        { new: true, session },
      );

      await Transaction.create(
        [
          {
            transactionId: paymentId,
            donation: processedDonation._id,
            user: processedDonation.donor,
            campaign: processedDonation.campaign,
            amount: processedDonation.amount,
            paymentMethod: 'razorpay',
            status: 'success',
            gatewayResponse: payload.payment.entity,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      logger.info(`Webhook (fallback): donation ${processedDonation._id} paid ✓, campaign updated`);
    } catch (err) {
      await session.abortTransaction();
      logger.error({ err }, 'Webhook update failed');
      throw err;
    } finally {
      session.endSession();
    }

    // Non-fatal side effects
    await runPostPaymentSideEffects(processedDonation, updatedCampaign);

    return processedDonation;
  },
};

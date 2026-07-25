import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import WithdrawalRequest from '../models/WithdrawalRequest';
import Campaign from '../models/Campaign';
import mongoose from 'mongoose';
import { createError } from '../middleware/errorHandler';
import Notification from '../models/Notification';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

export const withdrawalController = {
  /**
   * POST /withdrawals
   * Creator requests a withdrawal from one of their campaigns.
   * - Validates ownership (creator === req.user._id).
   * - Validates amount <= campaign.availableBalance.
   * - Atomically deducts availableBalance and creates the WithdrawalRequest.
   * Validation: createWithdrawalSchema (applied at router level).
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { campaignId, amount, bankDetails } = req.body;

      // Atomic: fetch campaign with session so the balance read is consistent
      const campaign = await Campaign.findById(campaignId).session(session);
      if (!campaign) throw createError('Campaign not found', 404);

      if (String(campaign.creator) !== String(req.user!._id)) {
        throw createError('Forbidden: you are not the owner of this campaign', 403);
      }

      if (campaign.availableBalance < amount) {
        throw createError(
          `Insufficient balance. Available: ₹${campaign.availableBalance.toLocaleString()}, Requested: ₹${amount.toLocaleString()}`,
          400,
        );
      }

      // Deduct immediately to prevent double-spend
      campaign.availableBalance -= amount;
      await campaign.save({ session });

      const [withdrawal] = await WithdrawalRequest.create(
        [{ campaign: campaignId, creator: req.user!._id, amount, bankDetails, status: 'pending' }],
        { session },
      );

      await session.commitTransaction();

      // Non-fatal notifications (outside transaction)
      await Notification.insertMany([
        {
          user: req.user!._id,
          type: 'withdrawal_submitted',
          title: 'Withdrawal Submitted',
          message: `Your withdrawal request for ₹${amount.toLocaleString()} from "${campaign.title}" is pending approval.`,
          link: '/dashboard/withdrawals',
        },
        {
          isAdminNotification: true,
          type: 'admin_withdrawal_request',
          title: 'New Withdrawal Request',
          message: `${req.user!.name} requested a withdrawal of ₹${amount.toLocaleString()} for campaign "${campaign.title}".`,
          link: '/admin/withdrawals',
        },
      ]).catch((err) => {
        // Notification failure is non-fatal — log and continue
        console.error('Notification insertMany failed:', err);
      });

      res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: { withdrawal },
      });
    } catch (err) {
      await session.abortTransaction();
      next(err);
    } finally {
      session.endSession();
    }
  },

  /**
   * GET /withdrawals/campaign/:campaignId
   * Fetch all withdrawal requests for a specific campaign (creator only).
   * Uses a single $facet aggregation pipeline — one DB round-trip instead of two.
   */
  async getByCampaign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const campaignOId = new mongoose.Types.ObjectId(campaignId);

      // Verify campaign ownership (lean — no hydration overhead)
      const campaign = await Campaign.findById(campaignId)
        .select('creator raisedAmount availableBalance')
        .lean();
      if (!campaign) throw createError('Campaign not found', 404);
      if (String((campaign as any).creator) !== String(req.user!._id)) {
        throw createError('Forbidden', 403);
      }

      // Single aggregation: list + stats in one round-trip using $facet
      const [result] = await WithdrawalRequest.aggregate([
        { $match: { campaign: campaignOId } },
        {
          $facet: {
            withdrawals: [{ $sort: { createdAt: -1 } }],
            stats: [
              {
                $group: {
                  _id: '$status',
                  total: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]);

      // Reduce stats array into a flat object
      const statsMap = (result?.stats ?? []).reduce(
        (acc: any, item: any) => {
          if (item._id === 'completed') acc.totalWithdrawn += item.total;
          if (item._id === 'pending' || item._id === 'approved') {
            acc.pendingAmount += item.total;
            acc.pendingCount += item.count;
          }
          return acc;
        },
        { totalWithdrawn: 0, pendingAmount: 0, pendingCount: 0 },
      );

      res.json({
        success: true,
        data: {
          withdrawals: result?.withdrawals ?? [],
          stats: {
            raisedAmount: (campaign as any).raisedAmount,
            availableBalance: (campaign as any).availableBalance,
            ...statsMap,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /withdrawals/mine?page=1&limit=10
   * Fetch all withdrawals for the logged-in user across all campaigns.
   * Paginated using parsePagination utility.
   */
  async getMine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePagination(req.query, 50, 10);
      const filter = { creator: req.user!._id };

      const [withdrawals, total] = await Promise.all([
        WithdrawalRequest.find(filter)
          .populate('campaign', 'title slug images')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        WithdrawalRequest.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          withdrawals,
          pagination: buildPaginationMeta(page, limit, total),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

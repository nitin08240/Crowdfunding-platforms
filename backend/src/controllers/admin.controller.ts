import { Request, Response, NextFunction } from 'express';
import { AdminRequest } from '../middleware/auth';
import User from '../models/User';
import Campaign from '../models/Campaign';
import Donation from '../models/Donation';
import WithdrawalRequest from '../models/WithdrawalRequest';
import AuditLog from '../models/AuditLog';
import NGO from '../models/NGO';
import PlatformSettings from '../models/PlatformSettings';
import Notification from '../models/Notification';
import { createError } from '../middleware/errorHandler';
import { emailService } from '../services/email.service';
import mongoose from 'mongoose';

// ─── Helper: Write Audit Log ──────────────────────────────────────────────────
async function writeAudit(
  adminId: any,
  action: string,
  targetType: 'campaign' | 'user' | 'withdrawal' | 'platform' | 'ngo' | 'settings',
  details: Record<string, any> = {},
  campaignId?: any,
  userId?: any,
  ip?: string
) {
  try {
    const validTargetTypes = ['campaign', 'user', 'withdrawal', 'platform'];
    const safeTargetType = validTargetTypes.includes(targetType) ? targetType : 'platform';
    await AuditLog.create({ adminId, action, targetType: safeTargetType, details, campaignId, userId, ip });
  } catch (e) {
    console.error('Audit log write failed:', e);
  }
}

export const adminController = {

  // ── COMPREHENSIVE STATS ───────────────────────────────────────────────────────
  async getStats(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        userStats,
        campaignStats,
        donationStats,
        ngoStats,
        todayUsers,
        todayDonations,
        monthDonations,
      ] = await Promise.all([
        // User stats
        User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              kycVerified: [{ $match: { kycStatus: 'verified' } }, { $count: 'count' }],
              kycPending: [{ $match: { kycStatus: 'pending' } }, { $count: 'count' }],
              suspended: [{ $match: { isSuspended: true } }, { $count: 'count' }],
            },
          },
        ]),
        // Campaign stats
        Campaign.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              pending: [{ $match: { status: 'pending_review' } }, { $count: 'count' }],
              active: [{ $match: { status: 'active' } }, { $count: 'count' }],
              rejected: [{ $match: { status: 'rejected' } }, { $count: 'count' }],
              completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
              suspended: [{ $match: { status: 'suspended' } }, { $count: 'count' }],
              expired: [{ $match: { deadline: { $lt: now }, status: 'active' } }, { $count: 'count' }],
            },
          },
        ]),
        // All-time donation stats
        Donation.aggregate([
          { $match: { status: 'paid' } },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' },
              maxAmount: { $max: '$amount' },
            },
          },
        ]),
        // NGO stats
        NGO.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              pending: [{ $match: { verificationStatus: 'pending' } }, { $count: 'count' }],
              verified: [{ $match: { verificationStatus: 'verified' } }, { $count: 'count' }],
              rejected: [{ $match: { verificationStatus: 'rejected' } }, { $count: 'count' }],
            },
          },
        ]),
        // Today's registrations
        User.countDocuments({ createdAt: { $gte: startOfToday } }),
        // Today's donations
        Donation.aggregate([
          { $match: { status: 'paid', createdAt: { $gte: startOfToday } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // This month's donations
        Donation.aggregate([
          { $match: { status: 'paid', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

      const u = userStats[0];
      const c = campaignStats[0];
      const d = donationStats[0] || { totalAmount: 0, count: 0, avgAmount: 0, maxAmount: 0 };
      const n = ngoStats[0];

      res.json({
        success: true,
        data: {
          users: {
            total: u.total[0]?.count || 0,
            kycVerified: u.kycVerified[0]?.count || 0,
            kycPending: u.kycPending[0]?.count || 0,
            suspended: u.suspended[0]?.count || 0,
            todayRegistrations: todayUsers,
          },
          campaigns: {
            total: c.total[0]?.count || 0,
            pending: c.pending[0]?.count || 0,
            active: c.active[0]?.count || 0,
            rejected: c.rejected[0]?.count || 0,
            completed: c.completed[0]?.count || 0,
            suspended: c.suspended[0]?.count || 0,
            expired: c.expired[0]?.count || 0,
          },
          donations: {
            totalAmount: d.totalAmount || 0,
            count: d.count || 0,
            avgAmount: Math.round(d.avgAmount || 0),
            highestDonation: d.maxAmount || 0,
            todayAmount: todayDonations[0]?.total || 0,
            todayCount: todayDonations[0]?.count || 0,
            monthlyAmount: monthDonations[0]?.total || 0,
            monthlyCount: monthDonations[0]?.count || 0,
          },
          ngos: {
            total: n.total[0]?.count || 0,
            pending: n.pending[0]?.count || 0,
            verified: n.verified[0]?.count || 0,
            rejected: n.rejected[0]?.count || 0,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── DASHBOARD SNAPSHOT ────────────────────────────────────────────────────────
  async getDashboard(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const [latestUsers, latestCampaigns, latestDonations, latestNGOs, pendingKYC, auditLogs] =
        await Promise.all([
          User.find().sort('-createdAt').limit(5).select('name email avatar kycStatus isSuspended createdAt').lean(),
          Campaign.find()
            .sort('-createdAt')
            .limit(5)
            .populate('creator', 'name email')
            .select('title status goalAmount raisedAmount category createdAt creator')
            .lean(),
          Donation.find({ status: 'paid' })
            .sort('-createdAt')
            .limit(5)
            .populate('donor', 'name email')
            .populate('campaign', 'title slug')
            .lean(),
          NGO.find()
            .sort('-createdAt')
            .limit(5)
            .populate('creator', 'name email')
            .select('name verificationStatus createdAt creator contactDetails')
            .lean(),
          User.find({ kycStatus: 'pending' })
            .sort('-createdAt')
            .limit(10)
            .select('name email kycStatus createdAt')
            .lean(),
          AuditLog.find()
            .sort('-timestamp')
            .limit(10)
            .populate('adminId', 'name email')
            .lean(),
        ]);

      res.json({
        success: true,
        data: {
          latestUsers,
          latestCampaigns,
          latestDonations,
          latestNGOs,
          pendingKYC,
          auditLogs,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── USERS ─────────────────────────────────────────────────────────────────────
  async getUsers(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const {
        search,
        page = '1',
        limit = '20',
        kycStatus,
        isSuspended,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};

      if (search) {
        filter.$or = [
          { name: new RegExp(search as string, 'i') },
          { email: new RegExp(search as string, 'i') },
          { phone: new RegExp(search as string, 'i') },
        ];
      }
      if (kycStatus) filter.kycStatus = kycStatus;
      if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';

      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sortField = ['createdAt', 'name', 'email'].includes(sortBy as string)
        ? (sortBy as string)
        : 'createdAt';

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-passwordHash -refreshTokenHash -emailVerificationToken -passwordResetToken')
          .sort({ [sortField]: sortDirection })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          users,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async suspendUser(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw createError('User not found', 404);
      user.isSuspended = !user.isSuspended;
      await user.save();

      await writeAudit(
        req.admin!._id,
        user.isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
        'user',
        { userName: user.name, userEmail: user.email },
        undefined,
        user._id,
        req.ip
      );

      res.json({
        success: true,
        message: `User ${user.isSuspended ? 'suspended' : 'reactivated'}`,
        data: { isSuspended: user.isSuspended },
      });
    } catch (err) {
      next(err);
    }
  },

  async approveKYC(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw createError('User not found', 404);
      if (user.kycStatus === 'verified') throw createError('KYC already verified', 400);

      user.kycStatus = 'verified';
      await user.save();

      await writeAudit(
        req.admin!._id,
        'KYC_APPROVED',
        'user',
        { userName: user.name, userEmail: user.email },
        undefined,
        user._id,
        req.ip
      );

      res.json({ success: true, message: 'KYC approved successfully', data: { kycStatus: user.kycStatus } });
    } catch (err) {
      next(err);
    }
  },

  async rejectKYC(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) throw createError('User not found', 404);

      user.kycStatus = 'rejected';
      await user.save();

      await writeAudit(
        req.admin!._id,
        'KYC_REJECTED',
        'user',
        { userName: user.name, userEmail: user.email, reason },
        undefined,
        user._id,
        req.ip
      );

      res.json({ success: true, message: 'KYC rejected', data: { kycStatus: user.kycStatus } });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw createError('User not found', 404);

      await writeAudit(
        req.admin!._id,
        'USER_DELETED',
        'user',
        { userName: user.name, userEmail: user.email },
        undefined,
        user._id,
        req.ip
      );

      await user.deleteOne();
      res.json({ success: true, message: 'User deleted permanently' });
    } catch (err) {
      next(err);
    }
  },

  // ── CAMPAIGNS ─────────────────────────────────────────────────────────────────
  async getCampaigns(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', limit = '20', search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};
      if (status && status !== 'all') filter.status = status;
      if (search) {
        filter.$or = [
          { title: new RegExp(search as string, 'i') },
          { category: new RegExp(search as string, 'i') },
        ];
      }

      const [campaigns, total] = await Promise.all([
        Campaign.find(filter)
          .populate('creator', 'name email avatar phone')
          .populate('approvedBy', 'name email')
          .sort('-createdAt')
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Campaign.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          campaigns,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getCampaignDetail(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate('creator', 'name email avatar phone')
        .populate('approvedBy', 'name email');
      if (!campaign) throw createError('Campaign not found', 404);
      res.json({ success: true, data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async approveCampaign(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await Campaign.findById(req.params.id).populate('creator', 'name email');
      if (!campaign) throw createError('Campaign not found', 404);
      if (campaign.status !== 'pending_review') throw createError('Campaign is not pending review', 400);

      campaign.status = 'active';
      campaign.verified = true;
      campaign.approvedBy = req.admin!._id as any;
      campaign.approvedAt = new Date();
      campaign.rejectedReason = undefined;
      await campaign.save();

      const creator = campaign.creator as any;
      try {
        await emailService.sendCampaignApproved(creator.email, creator.name, campaign.title, campaign.slug);
      } catch (e) {
        console.error('Email send failed:', e);
      }

      await writeAudit(
        req.admin!._id,
        'CAMPAIGN_APPROVED',
        'campaign',
        { campaignTitle: campaign.title, creatorEmail: creator.email },
        campaign._id,
        undefined,
        req.ip
      );

      res.json({ success: true, message: 'Campaign approved and is now live', data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async rejectCampaign(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      if (!reason || !reason.trim()) throw createError('Rejection reason is required', 400);

      const campaign = await Campaign.findById(req.params.id).populate('creator', 'name email');
      if (!campaign) throw createError('Campaign not found', 404);

      campaign.status = 'rejected';
      campaign.verified = false;
      campaign.rejectedReason = reason.trim();
      await campaign.save();

      const creator = campaign.creator as any;
      try {
        await emailService.sendCampaignRejected(creator.email, creator.name, campaign.title, reason);
      } catch (e) {
        console.error('Email send failed:', e);
      }

      await writeAudit(
        req.admin!._id,
        'CAMPAIGN_REJECTED',
        'campaign',
        { campaignTitle: campaign.title, reason, creatorEmail: creator.email },
        campaign._id,
        undefined,
        req.ip
      );

      res.json({ success: true, message: 'Campaign rejected', data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async suspendCampaign(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) throw createError('Campaign not found', 404);

      campaign.status = 'suspended';
      campaign.verified = false;
      await campaign.save();

      await writeAudit(
        req.admin!._id,
        'CAMPAIGN_SUSPENDED',
        'campaign',
        { campaignTitle: campaign.title, reason: req.body.reason },
        campaign._id,
        undefined,
        req.ip
      );

      res.json({ success: true, message: 'Campaign suspended', data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async featureCampaign(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) throw createError('Campaign not found', 404);

      campaign.flaggedForReview = !campaign.flaggedForReview;
      await campaign.save();

      await writeAudit(
        req.admin!._id,
        campaign.flaggedForReview ? 'CAMPAIGN_FEATURED' : 'CAMPAIGN_UNFEATURED',
        'campaign',
        { campaignTitle: campaign.title },
        campaign._id,
        undefined,
        req.ip
      );

      res.json({
        success: true,
        message: campaign.flaggedForReview ? 'Campaign featured' : 'Campaign unfeatured',
        data: { flaggedForReview: campaign.flaggedForReview },
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteCampaign(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) throw createError('Campaign not found', 404);

      await writeAudit(
        req.admin!._id,
        'CAMPAIGN_DELETED',
        'campaign',
        { campaignTitle: campaign.title },
        campaign._id,
        undefined,
        req.ip
      );

      await campaign.deleteOne();
      res.json({ success: true, message: 'Campaign deleted permanently' });
    } catch (err) {
      next(err);
    }
  },

  // ── DONATIONS ─────────────────────────────────────────────────────────────────
  async getDonations(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', status, search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};
      if (status && status !== 'all') filter.status = status;
      if (search) {
        // We'll handle searching by donor name/email via lookup if needed
      }

      const [donations, total] = await Promise.all([
        Donation.find(filter)
          .populate('donor', 'name email avatar')
          .populate('campaign', 'title slug')
          .sort('-createdAt')
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Donation.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          donations,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── WITHDRAWALS ───────────────────────────────────────────────────────────────
  async getWithdrawals(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', limit = '20', search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};
      if (status && status !== 'all') filter.status = status;

      const [withdrawals, total] = await Promise.all([
        WithdrawalRequest.find(filter)
          .populate('creator', 'name email phone')
          .populate('campaign', 'title slug raisedAmount availableBalance')
          .populate('reviewedBy', 'email')
          .sort('-createdAt')
          .skip(skip)
          .limit(limitNum)
          .lean(),
        WithdrawalRequest.countDocuments(filter),
      ]);

      // Aggregate summary counts by status
      const statusCounts = await WithdrawalRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      ]);

      res.json({
        success: true,
        data: {
          withdrawals,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
          statusCounts,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async approveWithdrawal(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const withdrawal = await WithdrawalRequest.findById(req.params.id);
      if (!withdrawal) throw createError('Withdrawal request not found', 404);
      if (withdrawal.status !== 'pending') {
        throw createError(`Cannot approve a withdrawal with status "${withdrawal.status}"`, 400);
      }

      withdrawal.status = 'approved';
      withdrawal.reviewedBy = req.admin!._id as any;
      if (req.body.notes) withdrawal.adminNotes = req.body.notes;
      await withdrawal.save();

      await writeAudit(
        req.admin!._id,
        'WITHDRAWAL_APPROVED',
        'withdrawal',
        { withdrawalId: withdrawal._id, amount: withdrawal.amount },
        withdrawal.campaign,
        withdrawal.creator,
        req.ip
      );

      // Notification
      await Notification.create({
        user: withdrawal.creator,
        type: 'withdrawal_approved',
        title: 'Withdrawal Approved',
        message: `Your withdrawal request for ₹${withdrawal.amount.toLocaleString()} has been approved and is pending transfer.`,
        link: '/dashboard/withdrawals'
      });

      res.json({ success: true, message: 'Withdrawal approved', data: { withdrawal } });
    } catch (err) {
      next(err);
    }
  },

  async rejectWithdrawal(req: AdminRequest, res: Response, next: NextFunction) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const withdrawal = await WithdrawalRequest.findById(req.params.id).session(session);
      if (!withdrawal) throw createError('Withdrawal request not found', 404);
      if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
        throw createError(`Cannot reject a withdrawal with status "${withdrawal.status}"`, 400);
      }

      // Restore the amount back to the campaign's available balance
      await Campaign.findByIdAndUpdate(
        withdrawal.campaign,
        { $inc: { availableBalance: withdrawal.amount } },
        { session }
      );

      withdrawal.status = 'rejected';
      withdrawal.reviewedBy = req.admin!._id as any;
      if (req.body.notes) withdrawal.adminNotes = req.body.notes;
      await withdrawal.save({ session });

      await session.commitTransaction();

      await writeAudit(
        req.admin!._id,
        'WITHDRAWAL_REJECTED',
        'withdrawal',
        { withdrawalId: withdrawal._id, amount: withdrawal.amount, reason: req.body.notes },
        withdrawal.campaign,
        withdrawal.creator,
        req.ip
      );

      res.json({ success: true, message: 'Withdrawal rejected, balance restored', data: { withdrawal } });
    } catch (err) {
      await session.abortTransaction();
      next(err);
    } finally {
      session.endSession();
    }
  },

  async completeWithdrawal(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const withdrawal = await WithdrawalRequest.findById(req.params.id);
      if (!withdrawal) throw createError('Withdrawal request not found', 404);
      if (withdrawal.status !== 'approved') {
        throw createError(`Cannot complete a withdrawal with status "${withdrawal.status}". Approve it first.`, 400);
      }

      const { transactionId, utrNumber, transferDate, notes } = req.body;

      if (!transactionId || !utrNumber || !transferDate) {
        throw createError('Transaction ID, UTR Number, and Transfer Date are required to mark as completed.', 400);
      }

      withdrawal.status = 'completed';
      withdrawal.completedAt = new Date();
      withdrawal.transactionDetails = {
        transactionId,
        utrNumber,
        transferDate: new Date(transferDate),
      };
      if (notes) withdrawal.adminNotes = notes;
      await withdrawal.save();

      await writeAudit(
        req.admin!._id,
        'WITHDRAWAL_COMPLETED',
        'withdrawal',
        { withdrawalId: withdrawal._id, amount: withdrawal.amount, transactionId },
        withdrawal.campaign,
        withdrawal.creator,
        req.ip
      );

      // Notification
      await Notification.create({
        user: withdrawal.creator,
        type: 'withdrawal_completed',
        title: 'Funds Transferred',
        message: `₹${withdrawal.amount.toLocaleString()} has been successfully transferred to your bank account. (Txn ID: ${transactionId})`,
        link: '/dashboard/withdrawals'
      });

      res.json({ success: true, message: 'Withdrawal marked as completed', data: { withdrawal } });
    } catch (err) {
      next(err);
    }
  },

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────────
  async getAuditLogs(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '30', action } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};
      if (action && action !== 'all') filter.action = action;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('adminId', 'name email')
          .populate('campaignId', 'title')
          .populate('userId', 'name email')
          .sort('-timestamp')
          .skip(skip)
          .limit(limitNum)
          .lean(),
        AuditLog.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── NGOs ──────────────────────────────────────────────────────────────────────
  async getNGOs(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { search, page = '1', limit = '20', verificationStatus } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};
      if (search) {
        filter.$or = [
          { name: new RegExp(search as string, 'i') },
          { registrationNumber: new RegExp(search as string, 'i') },
          { 'contactDetails.email': new RegExp(search as string, 'i') },
          { 'representative.fullName': new RegExp(search as string, 'i') },
        ];
      }
      if (verificationStatus && verificationStatus !== 'all') {
        filter.verificationStatus = verificationStatus;
      }

      const [ngos, total, statusCounts] = await Promise.all([
        NGO.find(filter)
          .populate('creator', 'name email phone avatar')
          .populate('approvedBy', 'name email')
          .sort('-createdAt')
          .skip(skip)
          .limit(limitNum)
          .lean(),
        NGO.countDocuments(filter),
        NGO.aggregate([
          { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          ngos,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum),
          statusCounts,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getNGODetail(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const ngo = await NGO.findById(req.params.id)
        .populate('creator', 'name email phone avatar kycStatus')
        .populate('approvedBy', 'name email');

      if (!ngo) throw createError('NGO not found', 404);

      res.json({ success: true, data: { ngo } });
    } catch (err) {
      next(err);
    }
  },

  async verifyNGO(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const ngo = await NGO.findById(req.params.id).populate('creator', 'name email');
      if (!ngo) throw createError('NGO not found', 404);

      ngo.verificationStatus = 'verified';
      ngo.approvedBy = req.admin!._id as any;
      ngo.approvedAt = new Date();
      ngo.adminNotes = req.body.notes || 'NGO documents verified and approved.';

      ngo.approvalHistory = ngo.approvalHistory || [];
      ngo.approvalHistory.push({
        status: 'verified',
        timestamp: new Date(),
        adminId: req.admin!._id as any,
        notes: req.body.notes || 'Approved by Admin.',
      });

      await ngo.save();

      // Automatically promote User KYC Status & role
      if (ngo.creator) {
        await User.findByIdAndUpdate(ngo.creator._id || ngo.creator, {
          kycStatus: 'verified',
        });
      }

      // Notification to Creator
      await Notification.create({
        user: ngo.creator._id || ngo.creator,
        type: 'ngo_approved',
        title: 'NGO Application Approved! 🎉',
        message: `Your NGO "${ngo.name}" has been verified and approved. You can now launch campaigns and appear in the public NGO directory.`,
        link: '/dashboard',
      });

      // Email Notification
      try {
        await emailService.sendNGOApproved(
          ngo.contactDetails.email,
          ngo.name,
          ngo.representative?.fullName || ngo.name
        );
      } catch (e) {
        console.error('NGO Approval Email failed:', e);
      }

      await writeAudit(req.admin!._id, 'NGO_VERIFIED', 'platform', { ngoName: ngo.name, regNo: ngo.registrationNumber }, undefined, ngo.creator._id || ngo.creator, req.ip);

      res.json({ success: true, message: 'NGO approved and verified successfully.', data: { ngo } });
    } catch (err) {
      next(err);
    }
  },

  async rejectNGO(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        throw createError('Rejection reason is required.', 400);
      }

      const ngo = await NGO.findById(req.params.id);
      if (!ngo) throw createError('NGO not found', 404);

      ngo.verificationStatus = 'rejected';
      ngo.rejectedReason = reason.trim();
      ngo.adminNotes = reason.trim();

      ngo.approvalHistory = ngo.approvalHistory || [];
      ngo.approvalHistory.push({
        status: 'rejected',
        timestamp: new Date(),
        adminId: req.admin!._id as any,
        notes: reason.trim(),
      });

      await ngo.save();

      if (ngo.creator) {
        await User.findByIdAndUpdate(ngo.creator, { kycStatus: 'rejected' });
      }

      // Notification
      await Notification.create({
        user: ngo.creator,
        type: 'ngo_rejected',
        title: 'NGO Application Update',
        message: `Your application for "${ngo.name}" was not approved. Reason: ${reason}`,
        link: '/register-ngo',
      });

      // Email Notification
      try {
        await emailService.sendNGORejected(
          ngo.contactDetails.email,
          ngo.name,
          ngo.representative?.fullName || ngo.name,
          reason
        );
      } catch (e) {
        console.error('NGO Rejection Email failed:', e);
      }

      await writeAudit(req.admin!._id, 'NGO_REJECTED', 'platform', { ngoName: ngo.name, reason }, undefined, ngo.creator, req.ip);

      res.json({ success: true, message: 'NGO application rejected.', data: { ngo } });
    } catch (err) {
      next(err);
    }
  },

  async requestMoreInfoNGO(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { notes, requestedChanges } = req.body;
      if (!notes || !notes.trim()) {
        throw createError('Please specify what documents or information are missing.', 400);
      }

      const ngo = await NGO.findById(req.params.id);
      if (!ngo) throw createError('NGO not found', 404);

      ngo.verificationStatus = 'more_info_required';
      ngo.adminNotes = notes.trim();
      if (Array.isArray(requestedChanges)) {
        ngo.requestedChanges = requestedChanges;
      }

      ngo.approvalHistory = ngo.approvalHistory || [];
      ngo.approvalHistory.push({
        status: 'more_info_required',
        timestamp: new Date(),
        adminId: req.admin!._id as any,
        notes: notes.trim(),
      });

      await ngo.save();

      // Notification
      await Notification.create({
        user: ngo.creator,
        type: 'ngo_more_info',
        title: 'Action Required: NGO Verification',
        message: `Additional information or missing documents are required for "${ngo.name}". Click to view details and resubmit.`,
        link: '/register-ngo',
      });

      // Email Notification
      try {
        await emailService.sendNGOMoreInfoRequested(
          ngo.contactDetails.email,
          ngo.name,
          ngo.representative?.fullName || ngo.name,
          notes.trim()
        );
      } catch (e) {
        console.error('NGO More Info Email failed:', e);
      }

      await writeAudit(req.admin!._id, 'NGO_MORE_INFO_REQUESTED', 'platform', { ngoName: ngo.name, notes }, undefined, ngo.creator, req.ip);

      res.json({ success: true, message: 'Requested missing information from NGO applicant.', data: { ngo } });
    } catch (err) {
      next(err);
    }
  },

  async suspendNGO(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const ngo = await NGO.findById(req.params.id);
      if (!ngo) throw createError('NGO not found', 404);

      ngo.verificationStatus = 'suspended';
      await ngo.save();

      await writeAudit(req.admin!._id, 'NGO_SUSPENDED', 'platform', { ngoName: ngo.name }, undefined, ngo.creator, req.ip);
      res.json({ success: true, message: 'NGO suspended', data: { ngo } });
    } catch (err) {
      next(err);
    }
  },

  async deleteNGO(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const ngo = await NGO.findById(req.params.id);
      if (!ngo) throw createError('NGO not found', 404);

      await writeAudit(req.admin!._id, 'NGO_DELETED', 'platform', { ngoName: ngo.name }, undefined, ngo.creator, req.ip);
      await ngo.deleteOne();
      res.json({ success: true, message: 'NGO deleted permanently' });
    } catch (err) {
      next(err);
    }
  },

  // ── REPORTS & ANALYTICS ───────────────────────────────────────────────────────
  async getReports(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [monthlyDonations, topCampaigns, topDonors, campaignGrowth, userGrowth] = await Promise.all([
        // Monthly donation trends (last 6 months)
        Donation.aggregate([
          { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // Top 5 campaigns by raised amount
        Campaign.find({ status: { $in: ['active', 'completed'] } })
          .sort('-raisedAmount')
          .limit(5)
          .select('title raisedAmount goalAmount donorCount category')
          .lean(),
        // Top 5 donors by total donation
        Donation.aggregate([
          { $match: { status: 'paid', isAnonymous: false } },
          { $group: { _id: '$donor', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'donor',
            },
          },
          { $unwind: '$donor' },
          {
            $project: {
              'donor.name': 1,
              'donor.email': 1,
              'donor.avatar': 1,
              total: 1,
              count: 1,
            },
          },
        ]),
        // Campaign growth (last 6 months)
        Campaign.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        // User growth (last 6 months)
        User.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          monthlyDonations,
          topCampaigns,
          topDonors,
          campaignGrowth,
          userGrowth,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── PLATFORM SETTINGS ─────────────────────────────────────────────────────────
  async getSettings(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      let settings = await PlatformSettings.findOne();
      if (!settings) {
        settings = await PlatformSettings.create({});
      }
      res.json({ success: true, data: { settings } });
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const allowedFields = [
        'siteName', 'logo', 'platformCommission', 'defaultCurrency',
        'maintenanceMode', 'maintenanceMessage', 'footerText',
        'contactEmail', 'contactPhone', 'contactAddress', 'socialLinks',
      ];

      const updateData: Record<string, any> = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
      );

      await writeAudit(
        req.admin!._id,
        'SETTINGS_UPDATED',
        'platform',
        { updatedFields: Object.keys(updateData) },
        undefined,
        undefined,
        req.ip
      );

      res.json({ success: true, message: 'Settings updated', data: { settings } });
    } catch (err) {
      next(err);
    }
  },

  // ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
  async globalSearch(req: AdminRequest, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || (q as string).trim().length < 2) {
        return res.json({ success: true, data: { users: [], campaigns: [], donations: [] } });
      }

      const searchRegex = new RegExp(q as string, 'i');

      const [users, campaigns] = await Promise.all([
        User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] })
          .select('name email avatar kycStatus isSuspended')
          .limit(5)
          .lean(),
        Campaign.find({ $or: [{ title: searchRegex }, { category: searchRegex }] })
          .select('title status goalAmount raisedAmount category slug')
          .limit(5)
          .lean(),
      ]);

      res.json({ success: true, data: { users, campaigns } });
    } catch (err) {
      next(err);
    }
  },
};

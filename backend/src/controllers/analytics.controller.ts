import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Donation from '../models/Donation';
import Campaign from '../models/Campaign';
import User from '../models/User';
import mongoose from 'mongoose';

export const analyticsController = {
  async getOverall(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [totalDonations, totalCampaigns, totalUsers, donationSum] = await Promise.all([
        Donation.countDocuments({ status: 'paid' }),
        Campaign.countDocuments({ status: 'active' }),
        User.countDocuments(),
        Donation.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      // Daily donations for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailyData = await Donation.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        data: {
          totalDonations,
          totalCampaigns,
          totalUsers,
          totalRaised: donationSum[0]?.total || 0,
          dailyData,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getCampaignAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const campaign = await Campaign.findById(id);
      if (!campaign) {
        res.status(404).json({ success: false, message: 'Campaign not found' });
        return;
      }

      const donations = await Donation.aggregate([
        { $match: { campaign: new mongoose.Types.ObjectId(id), status: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        success: true,
        data: {
          campaign: {
            title: campaign.title,
            goalAmount: campaign.goalAmount,
            raisedAmount: campaign.raisedAmount,
            donorCount: campaign.donorCount,
            viewCount: campaign.viewCount,
            percentFunded: Math.round((campaign.raisedAmount / campaign.goalAmount) * 100),
          },
          dailyDonations: donations,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

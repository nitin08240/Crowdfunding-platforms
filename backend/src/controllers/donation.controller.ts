import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Donation from '../models/Donation';
import Campaign from '../models/Campaign';
import { createError } from '../middleware/errorHandler';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import PDFDocument from 'pdfkit';

export const donationController = {
  /**
   * GET /donations/history?page=1&limit=10
   * Returns the authenticated user's paid donation history, newest first.
   * Uses lean() for performance and compound index (donor, status, createdAt).
   */
  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePagination(req.query, 100, 10);
      const filter = { donor: req.user!._id, status: 'paid' };

      const [donations, total] = await Promise.all([
        Donation.find(filter)
          .populate({
            path: 'campaign',
            select: 'title slug images category creator',
            populate: { path: 'creator', select: 'name email avatar' },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Donation.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          donations,
          pagination: buildPaginationMeta(page, limit, total),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /donations/me/stats
   * Returns aggregated donation statistics for the authenticated user's dashboard.
   * Single aggregation pipeline + lean recent-donations query in parallel.
   */
  async getMyStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = new mongoose.Types.ObjectId(String(req.user!._id));
      const filter = { donor: userId, status: 'paid' };

      const [aggregate, recentDonations] = await Promise.all([
        Donation.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalDonated: { $sum: '$amount' },
              donationCount: { $sum: 1 },
              avgDonation: { $avg: '$amount' },
              campaignIds: { $addToSet: '$campaign' },
            },
          },
          {
            $project: {
              _id: 0,
              totalDonated: 1,
              donationCount: 1,
              avgDonation: { $round: ['$avgDonation', 0] },
              campaignsSupported: { $size: '$campaignIds' },
            },
          },
        ]),
        Donation.find(filter)
          .populate('campaign', 'title slug images')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

      const stats = aggregate[0] ?? {
        totalDonated: 0,
        donationCount: 0,
        avgDonation: 0,
        campaignsSupported: 0,
      };

      res.json({ success: true, data: { stats, recentDonations } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /donations/campaign/:id?page=1&limit=20
   * Returns all paid donations for a specific campaign.
   * Masks donor info for anonymous donations. Uses lean() for performance.
   */
  async getCampaignDonations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page, limit, skip } = parsePagination(req.query, 100, 20);
      const filter = { campaign: id, status: 'paid' };

      // Verify campaign exists (lean — no hydration needed)
      const campaign = await Campaign.findById(id).select('_id').lean();
      if (!campaign) throw createError('Campaign not found', 404);

      const [donations, total] = await Promise.all([
        Donation.find(filter)
          .populate('donor', 'name avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Donation.countDocuments(filter),
      ]);

      // Mask donor info for anonymous donations
      const masked = donations.map((d) => ({
        ...d,
        donor: d.isAnonymous ? { name: 'Anonymous' } : d.donor,
      }));

      res.json({
        success: true,
        data: {
          donations: masked,
          pagination: buildPaginationMeta(page, limit, total),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /donations/:id/receipt/download
   * Generates and streams a professional PDF receipt for a successful donation.
   * Uses lean() on the initial check; only hydrates for populate fields needed by PDF.
   */
  async downloadReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const donation = await Donation.findOne({
        _id: req.params.id,
        donor: req.user!._id,
        status: 'paid',
      })
        .populate('campaign', 'title')
        .populate('donor', 'name email')
        .lean();

      if (!donation) {
        throw createError('Donation not found or not paid', 404);
      }

      // Initialize PDF document
      const doc = new PDFDocument({ margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Receipt_${(donation as any).receiptNumber || donation._id}.pdf"`,
      );

      doc.pipe(res);

      // ── PDF Content ──────────────────────────────────────────────────────

      // Title
      doc.fillColor('#444444').fontSize(20).text('DONATION RECEIPT', { align: 'center' }).moveDown(1.5);

      // Organization info
      doc
        .fillColor('#7c3aed')
        .fontSize(16)
        .text('Save the World Trust', { align: 'left' })
        .fillColor('#666666')
        .fontSize(10)
        .text('123 Philanthropy Lane, Giving City')
        .text('contact@savetheworld.org')
        .moveDown(2);

      // Receipt detail box
      const detailsTop = doc.y;
      doc.rect(50, detailsTop, 500, 150).stroke('#dddddd');

      const col1X = 70;
      const col2X = 200;
      const lineSpacing = 20;

      doc
        .fillColor('#333333')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Receipt Number:', col1X, detailsTop + 20)
        .font('Helvetica')
        .text((donation as any).receiptNumber || 'N/A', col2X, detailsTop + 20)

        .font('Helvetica-Bold')
        .text('Date:', col1X, detailsTop + 20 + lineSpacing)
        .font('Helvetica')
        .text(new Date((donation as any).createdAt).toLocaleString(), col2X, detailsTop + 20 + lineSpacing)

        .font('Helvetica-Bold')
        .text('Payment ID:', col1X, detailsTop + 20 + lineSpacing * 2)
        .font('Helvetica')
        .text(
          (donation as any).razorpayPaymentId || (donation as any).razorpayOrderId,
          col2X,
          detailsTop + 20 + lineSpacing * 2,
        )

        .font('Helvetica-Bold')
        .text('Donor Name:', col1X, detailsTop + 20 + lineSpacing * 3)
        .font('Helvetica')
        .text((donation.donor as any)?.name || 'Anonymous', col2X, detailsTop + 20 + lineSpacing * 3)

        .font('Helvetica-Bold')
        .text('Campaign:', col1X, detailsTop + 20 + lineSpacing * 4)
        .font('Helvetica')
        .text((donation.campaign as any)?.title || 'N/A', col2X, detailsTop + 20 + lineSpacing * 4)

        .font('Helvetica-Bold')
        .text('Amount Donated:', col1X, detailsTop + 20 + lineSpacing * 5)
        .font('Helvetica')
        .fillColor('#7c3aed')
        .text(`Rs. ${donation.amount.toLocaleString()}`, col2X, detailsTop + 20 + lineSpacing * 5);

      // Footer
      doc
        .moveDown(3)
        .fillColor('#666666')
        .fontSize(10)
        .text('Thank you for your generous contribution!', 50, doc.y + 160, {
          align: 'center',
          width: 500,
        })
        .moveDown(0.5)
        .fontSize(8)
        .text('This is a computer-generated receipt and requires no physical signature.', {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (err) {
      next(err);
    }
  },
};

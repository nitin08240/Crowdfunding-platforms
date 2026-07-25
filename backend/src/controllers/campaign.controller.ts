import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { campaignService } from '../services/campaign.service';
import { cloudinaryService } from '../services/cloudinary.service';

export const campaignController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category, status, sort, search, cursor, limit } = req.query;
      const result = await campaignService.findAll({
        category: category as string,
        status: status as string,
        sort: sort as string,
        search: search as string,
        cursor: cursor as string,
        limit: limit ? parseInt(limit as string) : 12,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.findBySlug(req.params.slug);
      res.json({ success: true, data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.create(req.body, String(req.user!._id));
      res.status(201).json({ success: true, data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.update(req.params.id, req.body, String(req.user!._id));
      res.json({ success: true, data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await campaignService.delete(req.params.id, String(req.user!._id), req.user!.role);
      res.json({ success: true, message: 'Campaign deleted' });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const campaign = await campaignService.updateStatus(req.params.id, status, String(req.user!._id));
      res.json({ success: true, data: { campaign } });
    } catch (err) {
      next(err);
    }
  },

  async getMyCampaigns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const campaigns = await campaignService.getCreatorCampaigns(String(req.user!._id));
      res.json({ success: true, data: { campaigns } });
    } catch (err) {
      next(err);
    }
  },

  async uploadDocuments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No files uploaded' });
        return;
      }

      const { labels } = req.body; // comma-separated labels matching file order
      const labelArr: string[] = Array.isArray(labels) ? labels : (labels ? labels.split(',') : []);

      // Upload all files to Cloudinary
      const uploadPromises = files.map((file, i) =>
        cloudinaryService.uploadBuffer(file.buffer, file.mimetype, 'campaign-documents').then((url) => ({
          url,
          label: labelArr[i] || 'other',
        }))
      );
      const docs = await Promise.all(uploadPromises);

      const campaign = await campaignService.uploadDocuments(req.params.id, String(req.user!._id), docs);
      res.json({ success: true, data: { documents: campaign.documents } });
    } catch (err) {
      next(err);
    }
  },

  async addUpdate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, content, images } = req.body;
      const update = await campaignService.addUpdate(
        req.params.id,
        String(req.user!._id),
        title,
        content,
        images
      );
      res.status(201).json({ success: true, data: { update } });
    } catch (err) {
      next(err);
    }
  },

  async getUpdates(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = await campaignService.getUpdates(req.params.id);
      res.json({ success: true, data: { updates } });
    } catch (err) {
      next(err);
    }
  },
};

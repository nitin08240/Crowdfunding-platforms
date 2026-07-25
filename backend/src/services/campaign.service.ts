import Campaign, { ICampaign } from '../models/Campaign';
import CampaignUpdate from '../models/CampaignUpdate';
import { createError } from '../middleware/errorHandler';
import slugify from 'slugify';
import { CreateCampaignInput } from '../validators/campaign.validator';
import mongoose from 'mongoose';
import Notification from '../models/Notification';

export const campaignService = {
  async create(data: CreateCampaignInput, creatorId: string): Promise<ICampaign> {
    let slug = slugify(data.title, { lower: true, strict: true });
    const existing = await Campaign.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const campaign = await Campaign.create({
      ...data,
      slug,
      deadline: new Date(data.deadline),
      creator: new mongoose.Types.ObjectId(creatorId),
      status: 'pending_review',
    });

    await Notification.create({
      isAdminNotification: true,
      type: 'campaign_pending',
      title: 'New Campaign Pending',
      message: `A new campaign "${campaign.title}" is waiting for your review.`,
      link: `/admin/campaigns`
    });

    return campaign;
  },

  async findAll(query: {
    category?: string;
    status?: string;
    sort?: string;
    search?: string;
    cursor?: string;
    limit?: number;
  }) {
    const {
      category,
      status = 'active',
      sort = '-createdAt',
      search,
      cursor,
      limit = 12,
    } = query;

    const filter: Record<string, any> = { status };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

    const campaigns = await Campaign.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .populate('creator', 'name avatar')
      .lean();

    const hasMore = campaigns.length > limit;
    const data = campaigns.slice(0, limit);
    const nextCursor = hasMore ? String(data[data.length - 1]._id) : null;
    return { campaigns: data, nextCursor, hasMore };
  },

  async findBySlug(slug: string) {
    const campaign = await Campaign.findOneAndUpdate(
      { slug },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('creator', 'name avatar email');
    if (!campaign) throw createError('Campaign not found', 404);

    // Automatically transition to completed if deadline passed
    if (campaign.status === 'active' && new Date() > new Date(campaign.deadline)) {
      campaign.status = 'completed';
      await campaign.save();
    }

    return campaign;
  },

  async update(id: string, data: Partial<CreateCampaignInput>, userId: string) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw createError('Campaign not found', 404);
    if (String(campaign.creator) !== userId) throw createError('Forbidden', 403);
    if (!['draft', 'paused', 'rejected'].includes(campaign.status))
      throw createError('Cannot edit a campaign that is active or completed', 400);

    Object.assign(campaign, data);
    if (data.deadline) campaign.deadline = new Date(data.deadline);
    return campaign.save();
  },

  async delete(id: string, userId: string, role: string) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw createError('Campaign not found', 404);
    if (String(campaign.creator) !== userId && role !== 'admin') throw createError('Forbidden', 403);
    await campaign.deleteOne();
  },

  async updateStatus(
    id: string,
    status: 'paused' | 'archived',
    userId: string
  ) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw createError('Campaign not found', 404);
    if (String(campaign.creator) !== userId) throw createError('Forbidden', 403);
    campaign.status = status;
    return campaign.save();
  },

  async getCreatorCampaigns(creatorId: string) {
    return Campaign.find({ creator: creatorId }).sort('-createdAt').lean();
  },

  async uploadDocuments(
    id: string,
    userId: string,
    docs: { url: string; label: string }[]
  ) {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw createError('Campaign not found', 404);
    if (String(campaign.creator) !== userId) throw createError('Forbidden', 403);

    const validLabels = ['aadhaar', 'pan', 'medical_report', 'hospital_bill', 'identity_proof', 'other'];
    const mappedDocs = docs.map((d) => ({
      url: d.url,
      label: validLabels.includes(d.label) ? d.label : 'other' as any,
      uploadedAt: new Date(),
    }));

    // Replace documents with same label, add new ones
    for (const doc of mappedDocs) {
      const idx = campaign.documents.findIndex((existing) => existing.label === doc.label);
      if (idx >= 0) {
        campaign.documents[idx] = doc;
      } else {
        campaign.documents.push(doc);
      }
    }

    return campaign.save();
  },

  async addUpdate(campaignId: string, userId: string, title: string, content: string, images?: string[]) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw createError('Campaign not found', 404);
    if (String(campaign.creator) !== userId) throw createError('Forbidden', 403);

    return CampaignUpdate.create({ campaign: campaignId, author: userId, title, content, images });
  },

  async getUpdates(campaignId: string) {
    return CampaignUpdate.find({ campaign: campaignId })
      .populate('author', 'name avatar')
      .sort('-createdAt')
      .lean();
  },
};

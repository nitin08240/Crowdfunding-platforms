import api from './api';
import type { Campaign } from '../types';

export const campaignService = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/campaigns', { params }).then((r) => r.data.data),

  getBySlug: (slug: string) =>
    api.get(`/campaigns/${slug}`).then((r) => r.data.data.campaign as Campaign),

  create: (data: FormData) =>
    api.post('/campaigns', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.campaign),

  createJson: (data: Record<string, any>) =>
    api.post('/campaigns', data).then((r) => r.data.data.campaign),

  uploadDocuments: (id: string, data: FormData) =>
    api.post(`/campaigns/${id}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data.documents),

  update: (id: string, data: Record<string, any>) =>
    api.put(`/campaigns/${id}`, data).then((r) => r.data.data.campaign),

  delete: (id: string) => api.delete(`/campaigns/${id}`),

  getUpdates: (id: string) => api.get(`/campaigns/${id}/updates`).then((r) => r.data.data.updates),

  addUpdate: (id: string, data: { title: string; content: string }) => 
    api.post(`/campaigns/${id}/updates`, data).then((r) => r.data.data.update),

  getMyCampaigns: () => api.get('/campaigns/my').then((r) => r.data.data.campaigns as Campaign[]),

  getCampaignAnalytics: (id: string) => api.get(`/analytics/campaign/${id}`).then((r) => r.data.data),
};

export const donationService = {
  createOrder: (data: { campaignId: string; amount: number; isAnonymous: boolean; message?: string }) =>
    api.post('/payments/create-order', data).then((r) => r.data.data),

  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/verify', data).then((r) => r.data),

  /** Fetch current user's paginated donation history */
  getHistory: (page: number = 1, limit: number = 20) =>
    api.get(`/donations/history?page=${page}&limit=${limit}`).then((r) => r.data.data),

  /** Aggregated stats: totalDonated, donationCount, campaignsSupported, avgDonation, recentDonations */
  getDonationStats: () =>
    api.get('/donations/me/stats').then((r) => r.data.data),

  getCampaignDonations: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/donations/campaign/${id}`, { params }).then((r) => r.data.data.donations),
};

export const withdrawalService = {
  /** Create a new withdrawal request */
  create: (data: {
    campaignId: string;
    amount: number;
    bankDetails: { accountHolder: string; accountNumber: string; ifsc: string; bankName?: string };
  }) => api.post('/withdrawals', data).then((r) => r.data),

  /** Get all withdrawals + financial stats for a specific campaign */
  getByCampaign: (campaignId: string) =>
    api.get(`/withdrawals/campaign/${campaignId}`).then((r) => r.data.data),

  /** Get all withdrawals across all campaigns for the logged-in user */
  getMine: () => api.get('/withdrawals/mine').then((r) => r.data.data.withdrawals),
};

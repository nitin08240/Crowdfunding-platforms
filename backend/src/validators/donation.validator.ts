import { z } from 'zod';

export const createDonationSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  amount: z.number().positive('Amount must be positive').min(10, 'Minimum donation is ₹10'),
  isAnonymous: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

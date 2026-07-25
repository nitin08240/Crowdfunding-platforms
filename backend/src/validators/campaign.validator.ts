import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(5, 'Title too short').max(200),
  description: z.string().min(20, 'Description too short').max(500),
  story: z.string().min(50, 'Story too short'),
  goalAmount: z.number().positive('Goal must be a positive number'),
  category: z.enum([
    'education',
    'medical',
    'environment',
    'community',
    'technology',
    'arts',
    'animals',
    'disaster_relief',
    'other',
  ]),
  deadline: z.string().refine((d) => new Date(d) > new Date(), 'Deadline must be in the future'),
  location: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  videoUrl: z.string().url().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

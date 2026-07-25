import { z } from 'zod';

export const createWithdrawalSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  amount: z.number().positive().min(100, 'Minimum withdrawal amount is ₹100'),
  bankDetails: z.object({
    accountHolder: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    ifsc: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format')
      .min(1, 'IFSC code is required'),
    bankName: z.string().optional().default(''),
  }),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;

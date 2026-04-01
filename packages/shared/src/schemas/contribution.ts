import { z } from 'zod';

export const submitContributionSchema = z.object({
  groupId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  amount: z.number().int().positive(),
  paymentMethod: z.enum(['BKASH', 'BANK']),
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export const verifyContributionSchema = z.object({
  contributionId: z.string().min(1),
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const waiveFineSchema = z.object({
  fineId: z.string().min(1),
  reason: z.string().min(1, 'Waive reason is required'),
});

export type SubmitContributionInput = z.infer<typeof submitContributionSchema>;
export type VerifyContributionInput = z.infer<typeof verifyContributionSchema>;
export type WaiveFineInput = z.infer<typeof waiveFineSchema>;

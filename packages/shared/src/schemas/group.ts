import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  description: z.string().optional(),
  monthlyAmount: z.number().int().positive().default(1000),
  fineAmount: z.number().int().positive().default(100),
  fineDeadlineDay: z.number().int().min(1).max(28).default(15),
});

export const updateGroupSchema = createGroupSchema.partial();

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

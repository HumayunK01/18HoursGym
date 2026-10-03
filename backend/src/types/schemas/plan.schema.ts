import { z } from 'zod';

export const createPlanSchema = z
  .object({
    name: z.string().trim().min(2, 'Plan name must be at least 2 characters').max(100),
    description: z.string().trim().max(1000).optional(),
    durationInDays: z
      .number()
      .int('Duration must be an integer number of days')
      .min(1, 'Duration must be at least 1 day')
      .max(3650, 'Duration cannot exceed 10 years'),
    price: z
      .number()
      .positive('Price must be greater than 0')
      .max(1000000, 'Price exceeds maximum limit'),
    features: z.array(z.string().trim()).default([]),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updatePlanSchema = createPlanSchema.partial();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

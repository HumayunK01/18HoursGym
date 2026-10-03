import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format. Must be a valid UUID.'),
});

export const paymentIdParamSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format. Must be a valid UUID.'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int('Page must be an integer').min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int('Limit must be an integer').min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});

export const memberQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100, 'Search term too long').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    message: "Status must be either 'ACTIVE' or 'SUSPENDED'",
  }).optional(),
});

export const classesQuerySchema = z.object({
  trainerId: z.string().uuid('Invalid trainer ID format. Must be a valid UUID.').optional(),
});

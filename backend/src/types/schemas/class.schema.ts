import { z } from 'zod';

export const createClassSchema = z.object({
  trainerId: z.string().uuid('Invalid trainer ID format'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().max(1000).optional(),
  startTime: z.string().datetime({ message: 'Start time must be a valid ISO 8601 string' }),
  endTime: z.string().datetime({ message: 'End time must be a valid ISO 8601 string' }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200, 'Capacity cannot exceed 200'),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const updateClassStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassStatusInput = z.infer<typeof updateClassStatusSchema>;

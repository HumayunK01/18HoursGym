import { z } from 'zod';

export const createIntentSchema = z
  .object({
    planId: z.string().uuid('Invalid plan ID format'),
  })
  .strict();

export const mockPaySchema = z
  .object({
    paymentId: z.string().uuid('Invalid payment ID format'),
    simulateOutcome: z.enum(['SUCCESS', 'FAILED']).default('SUCCESS'),
    paymentMethod: z.enum(['MOCK_CARD', 'MOCK_UPI', 'MOCK_NETBANKING']).default('MOCK_CARD'),
  })
  .strict();

export type CreateIntentInput = z.infer<typeof createIntentSchema>;
export type MockPayInput = z.infer<typeof mockPaySchema>;

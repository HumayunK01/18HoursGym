import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { paymentLimiter } from '../middleware/rateLimit.middleware.js';
import { createIntentSchema, mockPaySchema } from '../types/schemas/checkout.schema.js';
import { paymentIdParamSchema } from '../types/schemas/common.schema.js';

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);

checkoutRouter.post(
  '/create-intent',
  paymentLimiter,
  validateBody(createIntentSchema),
  CheckoutController.createIntent
);
checkoutRouter.post(
  '/mock-pay',
  paymentLimiter,
  validateBody(mockPaySchema),
  CheckoutController.processPayment
);
checkoutRouter.get(
  '/receipt/:paymentId',
  validateParams(paymentIdParamSchema),
  CheckoutController.getReceipt
);

import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createIntentSchema, mockPaySchema } from '../types/schemas/checkout.schema.js';

export const checkoutRouter = Router();

checkoutRouter.use(requireAuth);

checkoutRouter.post('/create-intent', validateBody(createIntentSchema), CheckoutController.createIntent);
checkoutRouter.post('/mock-pay', validateBody(mockPaySchema), CheckoutController.processPayment);
checkoutRouter.get('/receipt/:paymentId', CheckoutController.getReceipt);

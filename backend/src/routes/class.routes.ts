import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { bookingLimiter } from '../middleware/rateLimit.middleware.js';
import { validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { uuidParamSchema, classesQuerySchema } from '../types/schemas/common.schema.js';

export const classRouter = Router();

// Public schedule exploration
classRouter.get('/', validateQuery(classesQuerySchema), ClassController.getClasses);
classRouter.get('/:id', validateParams(uuidParamSchema), ClassController.getClassById);

// Protected booking actions
classRouter.post(
  '/:id/book',
  requireAuth,
  validateParams(uuidParamSchema),
  bookingLimiter,
  ClassController.bookClass
);
classRouter.delete(
  '/:id/book',
  requireAuth,
  validateParams(uuidParamSchema),
  ClassController.cancelBooking
);

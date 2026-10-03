import { Router } from 'express';
import { ClassController } from '../controllers/class.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { bookingLimiter } from '../middleware/rateLimit.middleware.js';

export const classRouter = Router();

// Public schedule exploration
classRouter.get('/', ClassController.getClasses);
classRouter.get('/:id', ClassController.getClassById);

// Protected booking actions
classRouter.post('/:id/book', requireAuth, bookingLimiter, ClassController.bookClass);
classRouter.delete('/:id/book', requireAuth, ClassController.cancelBooking);

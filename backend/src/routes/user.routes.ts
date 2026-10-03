import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateProfileSchema } from '../types/schemas/auth.schema.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', UserController.getMe);
userRouter.patch('/me', validateBody(updateProfileSchema), UserController.updateMe);
userRouter.get('/me/membership', UserController.getMyMembership);
userRouter.get('/me/bookings', UserController.getMyBookings);

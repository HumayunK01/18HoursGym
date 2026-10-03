import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { signupSchema, loginSchema } from '../types/schemas/auth.schema.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

export const authRouter = Router();

authRouter.post('/signup', authLimiter, validateBody(signupSchema), AuthController.signup);
authRouter.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
authRouter.post('/refresh', authLimiter, AuthController.refresh);
authRouter.post('/logout', AuthController.logout);

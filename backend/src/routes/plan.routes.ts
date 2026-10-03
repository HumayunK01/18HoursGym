import { Router } from 'express';
import { PlanController } from '../controllers/plan.controller.js';
import { validateParams } from '../middleware/validate.middleware.js';
import { uuidParamSchema } from '../types/schemas/common.schema.js';

export const planRouter = Router();

planRouter.get('/', PlanController.getPlans);
planRouter.get('/:id', validateParams(uuidParamSchema), PlanController.getPlanById);

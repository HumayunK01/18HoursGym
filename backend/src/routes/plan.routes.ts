import { Router } from 'express';
import { PlanController } from '../controllers/plan.controller.js';

export const planRouter = Router();

planRouter.get('/', PlanController.getPlans);
planRouter.get('/:id', PlanController.getPlanById);

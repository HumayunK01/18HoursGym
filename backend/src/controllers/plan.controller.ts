import { Request, Response, NextFunction } from 'express';
import { PlanService } from '../services/plan.service.js';
import { HTTP_STATUS } from '../config/constants.js';

export class PlanController {
  static async getPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await PlanService.getActivePlans();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlanService.getPlanById(req.params.id as string);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }
}

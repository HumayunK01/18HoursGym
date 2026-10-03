import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { PlanService } from '../services/plan.service.js';
import { ClassService } from '../services/class.service.js';
import { HTTP_STATUS } from '../config/constants.js';

import { UserStatus, PaymentStatus } from '@prisma/client';

export class AdminController {
  static async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await AdminService.getOverviewMetrics();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as UserStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await AdminService.getMembers({ search, status, page, limit });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.members,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const member = await AdminService.updateMemberStatus(req.params.id as string, status);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlanService.createPlan(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await PlanService.updatePlan(req.params.id as string, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newClass = await ClassService.createClass(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: newClass,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as any;
      const userId = req.query.userId as string | undefined;

      const result = await AdminService.getPayments({ page, limit, status, userId });
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.payments,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

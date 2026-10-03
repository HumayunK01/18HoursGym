import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { HTTP_STATUS } from '../config/constants.js';

export class UserController {
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await UserService.getProfile(req.user!.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await UserService.updateProfile(req.user!.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await UserService.getMembershipHistory(req.user!.id, page, limit);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.passes,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await UserService.getBookings(req.user!.id, page, limit);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.bookings,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

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
      const passes = await UserService.getMembershipHistory(req.user!.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: passes,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await UserService.getBookings(req.user!.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}

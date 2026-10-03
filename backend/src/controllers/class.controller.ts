import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service.js';
import { HTTP_STATUS } from '../config/constants.js';

export class ClassController {
  static async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainerId = req.query.trainerId as string | undefined;
      const classes = await ClassService.getClasses(trainerId);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: classes,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClassById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gymClass = await ClassService.getClassById(req.params.id as string);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: gymClass,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bookClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await ClassService.bookClass(req.params.id as string, req.user!.id);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          message: 'Class booked successfully!',
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClassService.cancelBooking(req.params.id as string, req.user!.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          message: 'Booking cancelled successfully.',
          booking: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';
import { HTTP_STATUS, ROLES } from '../config/constants.js';

export class CheckoutController {
  static async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const intent = await PaymentService.createIntent(req.user!.id, req.body.planId);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: intent,
      });
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.processPayment(req.body, req.user!.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === ROLES.ADMIN;
      const receipt = await PaymentService.getReceipt(req.params.paymentId as string, req.user!.id, isAdmin);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
}

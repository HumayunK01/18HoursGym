import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { NotFoundError, AppError } from '../types/api.types.js';
import { PASS_STATUSES, PAYMENT_STATUSES, HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { MockPayInput } from '../types/schemas/checkout.schema.js';

export interface PaymentGateway {
  createIntent(userId: string, planId: string): Promise<any>;
  processPayment(input: MockPayInput): Promise<any>;
}

export class PaymentService {
  /**
   * Initializes a pending payment and pass intent.
   */
  static async createIntent(userId: string, planId: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundError('Selected membership plan is inactive or does not exist.');
    }

    const transactionRef = `MOCK_TX_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Pass starts immediately or after current pass ends (if active)
    const now = new Date();
    const activePass = await prisma.passPurchase.findFirst({
      where: {
        userId,
        status: PASS_STATUSES.ACTIVE,
        endDate: { gte: now },
      },
      orderBy: { endDate: 'desc' },
    });

    const startDate = activePass ? new Date(activePass.endDate.getTime() + 1000) : now;
    const endDate = new Date(startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);

    return prisma.$transaction(async (tx) => {
      const passPurchase = await tx.passPurchase.create({
        data: {
          userId,
          planId: plan.id,
          startDate,
          endDate,
          status: PASS_STATUSES.PENDING,
          amountPaid: plan.price,
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId,
          passPurchaseId: passPurchase.id,
          amount: plan.price,
          currency: 'USD',
          status: PAYMENT_STATUSES.PENDING,
          paymentMethod: 'MOCK_CARD',
          transactionRef,
        },
      });

      return {
        paymentId: payment.id,
        transactionRef,
        amount: plan.price,
        currency: 'USD',
        plan: {
          id: plan.id,
          name: plan.name,
          durationInDays: plan.durationInDays,
        },
      };
    });
  }

  /**
   * Simulates processing payment with simulated latency and customizable outcome.
   */
  static async processPayment(input: MockPayInput, userId: string) {
    // Artificial latency for sandbox realism
    await new Promise((resolve) => setTimeout(resolve, env.MOCK_PAYMENT_LATENCY_MS));

    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: { passPurchase: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    if (payment.userId !== userId) {
      throw new AppError('Unauthorized access to payment.', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    }

    if (payment.status === PAYMENT_STATUSES.SUCCESS) {
      throw new AppError('This payment has already been successfully processed.', HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
    }

    const isSuccess = input.simulateOutcome === 'SUCCESS';

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? PAYMENT_STATUSES.SUCCESS : PAYMENT_STATUSES.FAILED,
          paymentMethod: input.paymentMethod,
          gatewayResponse: {
            mockProvider: 'GymSandboxGateway',
            processedAt: new Date().toISOString(),
            status: isSuccess ? 'succeeded' : 'declined',
            cardBrand: 'Visa (Mock)',
            last4: '4242',
          },
        },
      });

      if (isSuccess && payment.passPurchaseId) {
        await tx.passPurchase.update({
          where: { id: payment.passPurchaseId },
          data: {
            status: PASS_STATUSES.ACTIVE,
          },
        });
      }

      return {
        success: isSuccess,
        paymentId: updatedPayment.id,
        transactionRef: updatedPayment.transactionRef,
        status: updatedPayment.status,
        passActivated: isSuccess,
      };
    });
  }

  /**
   * Retrieves a verified receipt for a completed transaction.
   */
  static async getReceipt(paymentId: string, userId: string, isAdmin = false) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        passPurchase: {
          include: { plan: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Receipt not found.');
    }

    if (!isAdmin && payment.userId !== userId) {
      throw new AppError('Unauthorized access to receipt.', HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR);
    }

    return payment;
  }
}

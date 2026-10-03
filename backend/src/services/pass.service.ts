import { prisma } from '../config/db.js';
import { PASS_STATUSES } from '../config/constants.js';

export class PassService {
  /**
   * Evaluates and updates any expired passes for a user or globally.
   * Auto-transitions passes where end_date < now() and status == 'ACTIVE'.
   */
  static async syncPassStatuses(userId?: string) {
    const now = new Date();
    await prisma.passPurchase.updateMany({
      where: {
        ...(userId ? { userId } : {}),
        status: PASS_STATUSES.ACTIVE,
        endDate: { lt: now },
      },
      data: {
        status: PASS_STATUSES.EXPIRED,
      },
    });
  }

  /**
   * Retrieves the currently active pass for a user, if any.
   */
  static async getActivePass(userId: string) {
    await this.syncPassStatuses(userId);

    const now = new Date();
    return prisma.passPurchase.findFirst({
      where: {
        userId,
        status: PASS_STATUSES.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }
}

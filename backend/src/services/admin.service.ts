import { prisma } from '../config/db.js';
import { ROLES, PASS_STATUSES, PAYMENT_STATUSES, CLASS_STATUSES } from '../config/constants.js';
import { NotFoundError } from '../types/api.types.js';

export class AdminService {
  /**
   * Retrieves gym dashboard KPIs: member count, active passes, total revenue, upcoming classes.
   */
  static async getOverviewMetrics() {
    const now = new Date();

    const [
      totalMembers,
      activePassesCount,
      revenueResult,
      upcomingClassesCount,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: ROLES.MEMBER } }),
      prisma.passPurchase.count({
        where: {
          status: PASS_STATUSES.ACTIVE,
          endDate: { gte: now },
        },
      }),
      prisma.payment.aggregate({
        where: { status: PAYMENT_STATUSES.SUCCESS },
        _sum: { amount: true },
      }),
      prisma.class.count({
        where: {
          status: CLASS_STATUSES.SCHEDULED,
          startTime: { gte: now },
        },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          passPurchase: {
            include: { plan: true },
          },
        },
      }),
    ]);

    return {
      totalMembers,
      activeMembersWithPass: activePassesCount,
      totalRevenue: revenueResult._sum.amount || 0,
      upcomingClasses: upcomingClassesCount,
      recentTransactions: recentPayments,
    };
  }

  /**
   * Paginated member roster with search and pass status filter.
   */
  static async getMembers(query: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: ROLES.MEMBER };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          passes: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      members,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Modifies a user account status (e.g. SUSPENDED or ACTIVE).
   */
  static async updateMemberStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }

  /**
   * Retrieves all payments for the admin ledger.
   */
  static async getPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          passPurchase: {
            include: { plan: true },
          },
        },
      }),
      prisma.payment.count(),
    ]);

    return {
      payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

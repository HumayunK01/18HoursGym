import { prisma } from '../config/db.js';
import { NotFoundError } from '../types/api.types.js';
import { UpdateProfileInput } from '../types/schemas/auth.schema.js';
import { PassService } from './pass.service.js';

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        trainerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    const activePass = await PassService.getActivePass(userId);

    return {
      ...user,
      activePass,
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async getMembershipHistory(userId: string, page = 1, limit = 20) {
    await PassService.syncPassStatuses(userId);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [passes, total] = await Promise.all([
      prisma.passPurchase.findMany({
        where: { userId },
        skip,
        take: safeLimit,
        include: {
          plan: true,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              transactionRef: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.passPurchase.count({ where: { userId } }),
    ]);

    return {
      passes,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async getBookings(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        skip,
        take: safeLimit,
        include: {
          gymClass: {
            include: {
              trainer: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { bookedAt: 'desc' },
      }),
      prisma.booking.count({ where: { userId } }),
    ]);

    return {
      bookings,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}

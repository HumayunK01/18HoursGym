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

  static async getMembershipHistory(userId: string) {
    await PassService.syncPassStatuses(userId);

    const passes = await prisma.passPurchase.findMany({
      where: { userId },
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
    });

    return passes;
  }

  static async getBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
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
    });

    return bookings;
  }
}

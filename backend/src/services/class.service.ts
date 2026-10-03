import { prisma } from '../config/db.js';
import { NotFoundError, AppError, ConflictError } from '../types/api.types.js';
import { CLASS_STATUSES, BOOKING_STATUSES, HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { PassService } from './pass.service.js';
import { CreateClassInput } from '../types/schemas/class.schema.js';
import { logger } from '../utils/logger.js';

import { Prisma, ClassStatus } from '@prisma/client';

export interface ClassQueryFilter {
  trainerId?: string;
  status?: ClassStatus;
  startDate?: string;
  endDate?: string;
}

export class ClassService {
  /**
   * Lists upcoming scheduled classes with trainer info, filters, and remaining spots.
   */
  static async getClasses(filter?: ClassQueryFilter) {
    const now = new Date();
    const where: Prisma.ClassWhereInput = {};

    if (filter?.trainerId) {
      where.trainerId = filter.trainerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    } else {
      where.status = CLASS_STATUSES.SCHEDULED;
    }

    if (filter?.startDate || filter?.endDate) {
      where.startTime = {};
      if (filter.startDate) {
        where.startTime.gte = new Date(filter.startDate);
      } else {
        where.startTime.gte = now;
      }
      if (filter.endDate) {
        where.startTime.lte = new Date(filter.endDate);
      }
    } else {
      where.startTime = { gte: now };
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            bookings: {
              where: { status: BOOKING_STATUSES.CONFIRMED },
            },
          },
        },
      },
      take: 100,
      orderBy: { startTime: 'asc' },
    });

    return classes.map((c) => ({
      ...c,
      bookedSpots: c._count.bookings,
      availableSpots: Math.max(0, c.capacity - c._count.bookings),
    }));
  }

  static async getClassById(id: string) {
    const gymClass = await prisma.class.findUnique({
      where: { id },
      include: {
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            bookings: {
              where: { status: BOOKING_STATUSES.CONFIRMED },
            },
          },
        },
      },
    });

    if (!gymClass) {
      throw new NotFoundError('Class not found.');
    }

    return {
      ...gymClass,
      bookedSpots: gymClass._count.bookings,
      availableSpots: Math.max(0, gymClass.capacity - gymClass._count.bookings),
    };
  }

  /**
   * Atomically books a class slot for a member.
   * Guard: Requires an ACTIVE pass and available capacity.
   */
  static async bookClass(classId: string, userId: string) {
    // 1. Guard: Member must have an active pass
    const activePass = await PassService.getActivePass(userId);
    if (!activePass) {
      throw new AppError(
        'An active membership pass is required to book workout classes.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.AUTHORIZATION_ERROR
      );
    }

    // 2. Atomic Transaction: Check capacity and insert booking with row-level locking
    return prisma.$transaction(async (tx) => {
      // FOR UPDATE locks the class row exclusively in PostgreSQL.
      // Concurrent transactions attempting to book this class must wait, preventing overbooking.
      const lockedClass = await tx.$queryRaw<
        Array<{ id: string; capacity: number; status: string; start_time: Date }>
      >`SELECT id, capacity, status, start_time FROM classes WHERE id = ${classId}::uuid FOR UPDATE`;

      if (!lockedClass || lockedClass.length === 0) {
        throw new NotFoundError('Class not found.');
      }

      const targetClass = lockedClass[0];

      if (targetClass.status !== CLASS_STATUSES.SCHEDULED) {
        throw new AppError('This class is no longer open for registration.', HTTP_STATUS.BAD_REQUEST);
      }

      if (new Date() >= new Date(targetClass.start_time)) {
        throw new AppError('Cannot book a class that has already started.', HTTP_STATUS.BAD_REQUEST);
      }

      const confirmedCount = await tx.booking.count({
        where: { classId, status: BOOKING_STATUSES.CONFIRMED },
      });

      if (confirmedCount >= targetClass.capacity) {
        throw new ConflictError('This class is completely fully booked.');
      }

      // Check if user has an existing confirmed or cancelled booking
      const existing = await tx.booking.findUnique({
        where: {
          userId_classId: { userId, classId },
        },
      });

      let bookingRecord;
      if (existing) {
        if (existing.status === BOOKING_STATUSES.CONFIRMED) {
          throw new ConflictError('You have already booked a spot in this class.');
        }
        // Re-confirm if previously cancelled
        bookingRecord = await tx.booking.update({
          where: { id: existing.id },
          data: { status: BOOKING_STATUSES.CONFIRMED, bookedAt: new Date() },
        });
      } else {
        bookingRecord = await tx.booking.create({
          data: {
            userId,
            classId,
            status: BOOKING_STATUSES.CONFIRMED,
          },
        });
      }

      logger.info(`Class booking confirmed: ${classId} by user ${userId}`, {
        bookingId: bookingRecord.id,
        classId,
        userId,
      });

      return bookingRecord;
    });
  }

  /**
   * Cancels a member's class booking.
   */
  static async cancelBooking(classId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: {
        userId_classId: { userId, classId },
      },
    });

    if (!booking || booking.status !== BOOKING_STATUSES.CONFIRMED) {
      throw new NotFoundError('Active booking not found for this class.');
    }

    const cancelled = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUSES.CANCELLED },
    });

    logger.info(`Class booking cancelled: ${classId} by user ${userId}`, {
      bookingId: booking.id,
      classId,
      userId,
    });

    return cancelled;
  }

  /**
   * Administrative creation of a new gym class.
   */
  static async createClass(input: CreateClassInput) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: input.trainerId },
    });

    if (!trainer) {
      throw new NotFoundError('Trainer profile not found.');
    }

    const newClass = await prisma.class.create({
      data: {
        trainerId: input.trainerId,
        title: input.title,
        description: input.description,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        capacity: input.capacity,
      },
    });

    logger.info(`Admin created new class: ${newClass.id} (${newClass.title})`, {
      classId: newClass.id,
      trainerId: input.trainerId,
      title: input.title,
      capacity: input.capacity,
    });

    return newClass;
  }
}

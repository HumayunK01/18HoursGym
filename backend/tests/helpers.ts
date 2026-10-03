import { prisma } from '../src/config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

export async function cleanDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE payments, bookings, pass_purchases, sessions, classes, trainer_profiles, membership_plans, users RESTART IDENTITY CASCADE;'
  );
}

export async function createTestUser(params?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'MEMBER' | 'TRAINER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
}) {
  const email = params?.email ?? `user_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
  const password = params?.password ?? 'StrongPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName: params?.firstName ?? 'Test',
      lastName: params?.lastName ?? 'User',
      role: params?.role ?? 'MEMBER',
      status: params?.status ?? 'ACTIVE',
    },
  });
}

export async function createTestTrainer(params?: {
  email?: string;
  firstName?: string;
  lastName?: string;
  specialization?: string;
}) {
  const email = params?.email ?? `trainer_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'StrongPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      firstName: params?.firstName ?? 'Trainer',
      lastName: params?.lastName ?? 'Coach',
      role: 'TRAINER',
      status: 'ACTIVE',
      trainerProfile: {
        create: {
          specialization: params?.specialization ?? 'Strength & Conditioning',
          yearsExperience: 5,
        },
      },
    },
    include: {
      trainerProfile: true,
    },
  });

  return user;
}

export function generateTestTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  return { accessToken };
}

export function generateExpiredToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: -10 }
  );
}

export async function createTestPlan(params?: {
  name?: string;
  price?: number;
  durationInDays?: number;
}) {
  return prisma.membershipPlan.create({
    data: {
      name: params?.name ?? 'Standard Monthly Plan',
      description: 'Standard gym plan',
      price: params?.price ?? 49.99,
      durationInDays: params?.durationInDays ?? 30,
      isActive: true,
    },
  });
}

export async function createActivePassPurchase(userId: string, planId: string) {
  const startDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

  return prisma.passPurchase.create({
    data: {
      userId,
      planId,
      startDate,
      endDate,
      amountPaid: 49.99,
      status: 'ACTIVE',
    },
  });
}

export async function createTestClass(params: {
  trainerId: string;
  title?: string;
  capacity?: number;
  startTime?: Date;
  endTime?: Date;
}) {
  const startTime = params.startTime ?? new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in future
  const endTime = params.endTime ?? new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

  return prisma.class.create({
    data: {
      title: params.title ?? 'HIIT Training',
      description: 'High intensity class',
      trainerId: params.trainerId,
      capacity: params.capacity ?? 10,
      startTime,
      endTime,
      status: 'SCHEDULED',
    },
  });
}

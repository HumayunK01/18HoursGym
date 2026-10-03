import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL database connected successfully.');
  } catch (error) {
    console.error('❌ Database connection failure:', error);
    // Don't kill process in dev to allow migrations/docker setup
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌 Database connection closed.');
}

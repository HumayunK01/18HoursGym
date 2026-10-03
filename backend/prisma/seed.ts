import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding gym database with initial plans, admin, and trainers...');

  // 1. Seed Membership Plans
  const plans = [
    {
      name: '1-Month Starter Pass',
      description: 'Full access to gym facilities, lockers, and cardio zone for 30 days.',
      durationInDays: 30,
      price: 49.0,
      features: ['Full gym floor access', 'Locker & shower facilities', '1 Free fitness assessment'],
    },
    {
      name: '3-Months Pro Pass',
      description: 'Ideal for consistent routines. Includes unlimited group classes and recovery zone access.',
      durationInDays: 90,
      price: 129.0,
      features: ['All Starter features', 'Unlimited group workout classes', 'Sauna & recovery zone', 'Guest pass (1/month)'],
    },
    {
      name: '1-Year Elite VIP Pass',
      description: 'Maximum value annual pass with priority bookings and personalized training perks.',
      durationInDays: 365,
      price: 399.0,
      features: [
        'All Pro features',
        'Priority class reservation',
        '2 Complimentary 1-on-1 PT sessions',
        'Free gym swag pack',
        'Free freeze privilege up to 30 days',
      ],
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.membershipPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.membershipPlan.create({ data: plan });
    }
  }

  // 2. Seed Admin User
  const adminEmail = 'admin@gym.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        phone: '+15551234567',
        role: Role.ADMIN,
      },
    });
    console.log('👤 Admin user seeded: admin@gym.com / AdminPassword123!');
  }

  // 3. Seed Trainers
  const trainersData = [
    {
      email: 'marcus.pt@gym.com',
      firstName: 'Marcus',
      lastName: 'Vance',
      bio: 'Former collegiate athlete and certified Olympic lifting specialist with 8 years coaching experience.',
      specialization: 'Strength & Conditioning',
      yearsExperience: 8,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
    {
      email: 'elena.yoga@gym.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      bio: 'Vinyasa yoga instructor and mobility specialist focused on functional longevity and breathing.',
      specialization: 'Vinyasa Yoga & Mobility',
      yearsExperience: 6,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    },
  ];

  for (const t of trainersData) {
    let user = await prisma.user.findUnique({ where: { email: t.email } });
    if (!user) {
      const passwordHash = await bcrypt.hash('TrainerPass123!', 12);
      user = await prisma.user.create({
        data: {
          email: t.email,
          passwordHash,
          firstName: t.firstName,
          lastName: t.lastName,
          role: Role.TRAINER,
        },
      });

      await prisma.trainerProfile.create({
        data: {
          userId: user.id,
          bio: t.bio,
          specialization: t.specialization,
          yearsExperience: t.yearsExperience,
          avatarUrl: t.avatarUrl,
        },
      });
    }
  }

  // 4. Seed Upcoming Classes
  const trainerProfile = await prisma.trainerProfile.findFirst();
  if (trainerProfile) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(10, 0, 0, 0);

    const existingClass = await prisma.class.findFirst({
      where: { title: 'High Intensity Morning Blast' },
    });

    if (!existingClass) {
      await prisma.class.create({
        data: {
          trainerId: trainerProfile.id,
          title: 'High Intensity Morning Blast',
          description: 'Full-body metabolic conditioning with kettlebells, rowers, and bodyweight intervals.',
          startTime: tomorrow,
          endTime: tomorrowEnd,
          capacity: 15,
        },
      });
    }
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

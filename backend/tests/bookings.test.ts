import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import {
  cleanDatabase,
  createTestUser,
  createTestTrainer,
  createTestPlan,
  createActivePassPurchase,
  createTestClass,
  generateTestTokens,
} from './helpers.js';

describe('Bookings & Concurrency Management', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Booking Lifecycle', () => {
    it('should successfully book a class when user has an active pass', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
        capacity: 10,
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const res = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('CONFIRMED');

      const count = await prisma.booking.count({
        where: { classId: gymClass.id, status: 'CONFIRMED' },
      });
      expect(count).toBe(1);
    });

    it('should reject booking when user does not have an active pass', async () => {
      const trainer = await createTestTrainer();
      const member = await createTestUser(); // No active pass created
      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const res = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('active membership pass is required');
    });

    it('should reject duplicate booking for the same user and class', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // 1. First booking succeeds
      const firstRes = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(firstRes.status).toBe(201);

      // 2. Second booking attempt fails
      const duplicateRes = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.message).toContain('already booked a spot');
    });

    it('should allow user to cancel a confirmed booking', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // Book
      await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Cancel
      const cancelRes = await request(app)
        .delete(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);

      const bookingInDb = await prisma.booking.findUnique({
        where: { userId_classId: { userId: member.id, classId: gymClass.id } },
      });
      expect(bookingInDb?.status).toBe('CANCELLED');
    });

    it('should reactivate a previously cancelled booking when re-booked', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // Book -> Cancel
      await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);
      await request(app)
        .delete(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Re-book
      const rebookRes = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(rebookRes.status).toBe(201);
      expect(rebookRes.body.data.booking.status).toBe('CONFIRMED');

      const confirmedBookings = await prisma.booking.findMany({
        where: { userId: member.id, classId: gymClass.id },
      });
      expect(confirmedBookings.length).toBe(1);
      expect(confirmedBookings[0].status).toBe('CONFIRMED');
    });

    it('should reject booking a full class', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();

      // Class with capacity of 1
      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
        capacity: 1,
      });

      // Member 1 books the only spot
      const member1 = await createTestUser();
      await createActivePassPurchase(member1.id, plan.id);
      const tokens1 = generateTestTokens({ id: member1.id, email: member1.email, role: member1.role });
      await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${tokens1.accessToken}`);

      // Member 2 attempts to book
      const member2 = await createTestUser();
      await createActivePassPurchase(member2.id, plan.id);
      const tokens2 = generateTestTokens({ id: member2.id, email: member2.email, role: member2.role });

      const res = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${tokens2.accessToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('fully booked');
    });

    it('should reject booking a class that has already started', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      // Class started 1 hour ago
      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      });

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const res = await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already started');
    });

    it('should return 404 when booking a non-existent class', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      await createActivePassPurchase(member.id, plan.id);

      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const randomUuid = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/v1/classes/${randomUuid}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Concurrent Booking & Capacity Invariant', () => {
    it('guarantees confirmed bookings <= class capacity under race conditions', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();

      // STRICT CAPACITY: only 2 available spots
      const capacity = 2;
      const gymClass = await createTestClass({
        trainerId: trainer.trainerProfile!.id,
        capacity,
      });

      // 6 concurrent members trying to book simultaneously
      const memberCount = 6;
      const members = await Promise.all(
        Array.from({ length: memberCount }).map((_, i) =>
          createTestUser({ email: `concurrent_user_${Date.now()}_${i}@test.com` })
        )
      );

      // Give each member an active pass and generate access tokens
      const membersWithTokens = await Promise.all(
        members.map(async (m) => {
          await createActivePassPurchase(m.id, plan.id);
          return {
            member: m,
            token: generateTestTokens({ id: m.id, email: m.email, role: m.role }).accessToken,
          };
        })
      );

      // Fire all 6 booking requests simultaneously via Promise.all
      const responses = await Promise.all(
        membersWithTokens.map((item) =>
          request(app)
            .post(`/api/v1/classes/${gymClass.id}/book`)
            .set('Authorization', `Bearer ${item.token}`)
        )
      );

      // Verify responses
      const successfulBookings = responses.filter((r) => r.status === 201);
      const rejectedBookings = responses.filter((r) => r.status === 409);

      // Exactly capacity spots granted
      expect(successfulBookings.length).toBe(capacity);
      // All remaining were rejected with Conflict
      expect(rejectedBookings.length).toBe(memberCount - capacity);

      // Database level verification: confirmed bookings MUST equal capacity exactly, never exceed!
      const confirmedInDb = await prisma.booking.count({
        where: {
          classId: gymClass.id,
          status: 'CONFIRMED',
        },
      });

      expect(confirmedInDb).toBe(capacity);
    });
  });
});

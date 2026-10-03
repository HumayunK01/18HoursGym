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

describe('Phase 4: API Maturity & Polish Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Collection Pagination & User History', () => {
    it('GET /api/v1/users/me/membership should return paginated pass history with meta', async () => {
      const member = await createTestUser();
      const plan = await createTestPlan({ name: 'Annual Pass', price: 299.99, durationInDays: 365 });
      await createActivePassPurchase(member.id, plan.id);

      const { accessToken } = generateTestTokens(member);

      const res = await request(app)
        .get('/api/v1/users/me/membership?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
      });
    });

    it('GET /api/v1/users/me/bookings should return paginated booking history with meta', async () => {
      const member = await createTestUser();
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      await createActivePassPurchase(member.id, plan.id);
      const gymClass = await createTestClass({ trainerId: trainer.trainerProfile!.id });

      const { accessToken } = generateTestTokens(member);

      // Book class
      await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Query bookings
      const res = await request(app)
        .get('/api/v1/users/me/bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].classId).toBe(gymClass.id);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('2. Schedule Exploration with Multi-Attribute Filtering', () => {
    it('GET /api/v1/classes should filter classes by trainerId and status', async () => {
      const trainer1 = await createTestTrainer({ specialization: 'Crossfit' });
      const trainer2 = await createTestTrainer({ specialization: 'Pilates' });

      const class1 = await createTestClass({
        trainerId: trainer1.trainerProfile!.id,
        title: 'Crossfit WOD',
      });
      await createTestClass({
        trainerId: trainer2.trainerProfile!.id,
        title: 'Morning Pilates',
      });

      const res = await request(app).get(
        `/api/v1/classes?trainerId=${trainer1.trainerProfile!.id}&status=SCHEDULED`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(class1.id);
      expect(res.body.data[0].trainerId).toBe(trainer1.trainerProfile!.id);
      expect(res.body.data[0].status).toBe('SCHEDULED');
      expect(res.body.data[0].bookedSpots).toBe(0);
      expect(res.body.data[0].availableSpots).toBe(10);
    });
  });

  describe('3. Admin Revenue Ledger Filtering', () => {
    it('GET /api/v1/admin/payments should filter ledger transactions by status', async () => {
      const admin = await createTestUser({ role: 'ADMIN' });
      const member = await createTestUser();
      const plan = await createTestPlan();

      const pass = await createActivePassPurchase(member.id, plan.id);

      // Create 1 SUCCESS payment and 1 PENDING payment
      await prisma.payment.create({
        data: {
          userId: member.id,
          passPurchaseId: pass.id,
          amount: 49.99,
          status: 'SUCCESS',
          transactionRef: `TEST_SUCCESS_${Date.now()}`,
        },
      });

      await prisma.payment.create({
        data: {
          userId: member.id,
          passPurchaseId: pass.id,
          amount: 49.99,
          status: 'PENDING',
          transactionRef: `TEST_PENDING_${Date.now()}`,
        },
      });

      const { accessToken } = generateTestTokens(admin);

      const res = await request(app)
        .get('/api/v1/admin/payments?status=SUCCESS&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('SUCCESS');
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('4. Plan Invariant & Administration Lifecycle', () => {
    it('POST /api/v1/checkout/create-intent should reject purchase of inactive plan', async () => {
      const member = await createTestUser();
      const inactivePlan = await prisma.membershipPlan.create({
        data: {
          name: 'Retired Plan',
          description: 'No longer offered',
          price: 19.99,
          durationInDays: 30,
          isActive: false,
        },
      });

      const { accessToken } = generateTestTokens(member);

      const res = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: inactivePlan.id });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('POST /api/v1/admin/plans should allow admins to create a plan but reject non-admins', async () => {
      const member = await createTestUser({ role: 'MEMBER' });
      const admin = await createTestUser({ role: 'ADMIN' });

      const newPlanPayload = {
        name: 'Weekend Warrior',
        description: 'Saturday and Sunday access',
        price: 35.0,
        durationInDays: 30,
        features: ['Weekend gym access', 'Sauna access'],
      };

      // Member attempt -> 403 Forbidden
      const memberTokens = generateTestTokens(member);
      const forbiddenRes = await request(app)
        .post('/api/v1/admin/plans')
        .set('Authorization', `Bearer ${memberTokens.accessToken}`)
        .send(newPlanPayload);

      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.error.code).toBe('AUTHORIZATION_ERROR');

      // Admin attempt -> 201 Created
      const adminTokens = generateTestTokens(admin);
      const successRes = await request(app)
        .post('/api/v1/admin/plans')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send(newPlanPayload);

      expect(successRes.status).toBe(201);
      expect(successRes.body.success).toBe(true);
      expect(successRes.body.data.name).toBe('Weekend Warrior');
      expect(successRes.body.data.isActive).toBe(true);
    });

    it('PATCH /api/v1/admin/plans/:id should allow updating plan attributes', async () => {
      const admin = await createTestUser({ role: 'ADMIN' });
      const plan = await createTestPlan({ name: 'Summer Special', price: 99.0 });

      const { accessToken } = generateTestTokens(admin);

      const res = await request(app)
        .patch(`/api/v1/admin/plans/${plan.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 79.99, description: 'Discounted summer pass' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.price)).toBe(79.99);
      expect(res.body.data.description).toBe('Discounted summer pass');
    });
  });
});

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { PaymentService } from '../src/services/payment.service.js';
import {
  cleanDatabase,
  createTestUser,
  createTestPlan,
  generateTestTokens,
} from './helpers.js';

describe('Payment Processing & State Machine', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Payment Lifecycle & Pass Activation', () => {
    it('should successfully process payment and activate membership pass atomically', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // 1. Create checkout intent
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id });

      expect(intentRes.status).toBe(201);
      expect(intentRes.body.success).toBe(true);
      const { paymentId } = intentRes.body.data;
      expect(paymentId).toBeDefined();

      // Pass should be PENDING before payment
      const paymentBefore = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { passPurchase: true },
      });
      expect(paymentBefore?.status).toBe('PENDING');
      expect(paymentBefore?.passPurchase?.status).toBe('PENDING');

      // 2. Process mock payment with SUCCESS
      const payRes = await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentId,
          simulateOutcome: 'SUCCESS',
          paymentMethod: 'MOCK_CARD',
        });

      expect(payRes.status).toBe(200);
      expect(payRes.body.success).toBe(true);
      expect(payRes.body.data.status).toBe('SUCCESS');
      expect(payRes.body.data.passActivated).toBe(true);

      // Verify DB state: payment SUCCESS and pass ACTIVE
      const paymentAfter = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { passPurchase: true },
      });
      expect(paymentAfter?.status).toBe('SUCCESS');
      expect(paymentAfter?.passPurchase?.status).toBe('ACTIVE');
    });

    it('should handle failed payment and NOT activate membership pass', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // 1. Create intent
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id });

      const { paymentId } = intentRes.body.data;

      // 2. Process mock payment with FAILED
      const payRes = await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentId,
          simulateOutcome: 'FAILED',
          paymentMethod: 'MOCK_CARD',
        });

      expect(payRes.status).toBe(200);
      expect(payRes.body.data.status).toBe('FAILED');
      expect(payRes.body.data.passActivated).toBe(false);

      // Pass purchase must remain PENDING or inactive
      const paymentInDb = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { passPurchase: true },
      });
      expect(paymentInDb?.status).toBe('FAILED');
      expect(paymentInDb?.passPurchase?.status).not.toBe('ACTIVE');
    });
  });

  describe('Duplicate & Idempotency Protection', () => {
    it('should reject duplicate payment attempt on already processed payment', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // Create intent
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id });

      const { paymentId } = intentRes.body.data;

      // Process 1st time (Success)
      await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      // Process 2nd time (Duplicate attempt)
      const duplicateRes = await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.message).toContain('already been successfully processed');
    });
  });

  describe('Cross-User Authorization Boundary', () => {
    it('should forbid processing a payment belonging to another user', async () => {
      const plan = await createTestPlan();
      const userA = await createTestUser({ email: 'userA@example.com' });
      const userB = await createTestUser({ email: 'userB@example.com' });

      const tokensA = generateTestTokens({ id: userA.id, email: userA.email, role: userA.role });
      const tokensB = generateTestTokens({ id: userB.id, email: userB.email, role: userB.role });

      // User A creates intent
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${tokensA.accessToken}`)
        .send({ planId: plan.id });

      const { paymentId } = intentRes.body.data;

      // User B attempts to process User A's payment
      const unauthorizedRes = await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${tokensB.accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.success).toBe(false);
      expect(unauthorizedRes.body.error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('Payment State Transitions & Invariants', () => {
    it('should prevent transitioning FAILED payment to SUCCESS', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // 1. Create intent
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id });

      const { paymentId } = intentRes.body.data;

      // 2. Fail the payment
      await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentId, simulateOutcome: 'FAILED' });

      // 3. Attempt to transition FAILED to SUCCESS
      const invalidRes = await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      expect(invalidRes.status).toBe(409);
      expect(invalidRes.body.error.message).toContain('Cannot process payment already in FAILED status');
    });

    it('should allow refund only for SUCCESS payment and deactivate pass', async () => {
      const plan = await createTestPlan();
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      // 1. Create intent and pay successfully
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: plan.id });

      const { paymentId } = intentRes.body.data;

      await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      // 2. Perform refund
      const refundResult = await PaymentService.refundPayment(paymentId);
      expect(refundResult.status).toBe('REFUNDED');

      // 3. Verify pass is cancelled
      const paymentInDb = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { passPurchase: true },
      });
      expect(paymentInDb?.status).toBe('REFUNDED');
      expect(paymentInDb?.passPurchase?.status).toBe('CANCELLED');

      // 4. Repeated refund attempt should fail
      await expect(PaymentService.refundPayment(paymentId)).rejects.toThrow();
    });
  });
});

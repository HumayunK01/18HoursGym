import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import {
  cleanDatabase,
  createTestUser,
  createTestTrainer,
  createTestPlan,
  createTestClass,
  createActivePassPurchase,
  generateTestTokens,
  generateExpiredToken,
} from './helpers.js';

describe('Security Hardening & Vulnerability Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Content Security Policy & Security Headers (Objective 3)', () => {
    it('should include strict Content-Security-Policy header on API routes', async () => {
      const res = await request(app).get('/api/v1/plans');

      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should provide scoped Swagger-friendly CSP on /api/docs', async () => {
      const res = await request(app).get('/api/docs/');

      expect(res.headers['content-security-policy']).toBeDefined();
      // Swagger requires unsafe-inline for interactive rendering
      expect(res.headers['content-security-policy']).toContain("'unsafe-inline'");
    });
  });

  describe('JWT Algorithm Enforcement & Secret Handling (Objective 1)', () => {
    it('should reject tokens signed with an unexpected algorithm (e.g. none or RS256 spoof)', async () => {
      const user = await createTestUser();

      // Craft an unverified/none algorithm token
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ userId: user.id, email: user.email, role: user.role })).toString('base64url');
      const unsignedToken = `${header}.${payload}.`;

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${unsignedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject token signed with an invalid secret', async () => {
      const user = await createTestUser();
      const fakeSecretToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        'wrong_secret_key_that_does_not_match_env_at_all_12345',
        { algorithm: 'HS256', expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${fakeSecretToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Suspended User Session Termination (Objective 1 & 2)', () => {
    it('should immediately revoke active sessions when user is suspended by admin and block refreshes', async () => {
      const admin = await createTestUser({ role: 'ADMIN' });
      const member = await createTestUser({ role: 'MEMBER' });

      const adminTokens = generateTestTokens({ id: admin.id, email: admin.email, role: admin.role });

      // Member logs in and gets refresh cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: member.email, password: 'StrongPassword123!' });

      const cookieHeader = loginRes.headers['set-cookie'][0];
      const refreshToken = cookieHeader.split(';')[0].replace('refreshToken=', '');

      // Verify member currently has an active session
      const activeSessionsBefore = await prisma.session.findMany({
        where: { userId: member.id, revokedAt: null },
      });
      expect(activeSessionsBefore.length).toBe(1);

      // Admin suspends the member
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/members/${member.id}/status`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({ status: 'SUSPENDED' });

      expect(suspendRes.status).toBe(200);

      // Verify ALL member sessions were immediately revoked in DB
      const activeSessionsAfter = await prisma.session.findMany({
        where: { userId: member.id, revokedAt: null },
      });
      expect(activeSessionsAfter.length).toBe(0);

      // Member attempts to use refresh token -> must be rejected with 401/403
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshRes.status).toBeGreaterThanOrEqual(401);
      expect(refreshRes.body.success).toBe(false);
    });
  });

  describe('IDOR / BOLA Cross-User Authorization (Objective 2)', () => {
    it('should prevent User A from accessing User B receipt', async () => {
      const plan = await createTestPlan();
      const userA = await createTestUser({ email: 'victim@example.com' });
      const userB = await createTestUser({ email: 'attacker@example.com' });

      const tokensA = generateTestTokens({ id: userA.id, email: userA.email, role: userA.role });
      const tokensB = generateTestTokens({ id: userB.id, email: userB.email, role: userB.role });

      // User A creates intent and pays
      const intentRes = await request(app)
        .post('/api/v1/checkout/create-intent')
        .set('Authorization', `Bearer ${tokensA.accessToken}`)
        .send({ planId: plan.id });
      const { paymentId } = intentRes.body.data;

      await request(app)
        .post('/api/v1/checkout/mock-pay')
        .set('Authorization', `Bearer ${tokensA.accessToken}`)
        .send({ paymentId, simulateOutcome: 'SUCCESS' });

      // User B attempts to access User A's receipt
      const idorRes = await request(app)
        .get(`/api/v1/checkout/receipt/${paymentId}`)
        .set('Authorization', `Bearer ${tokensB.accessToken}`);

      expect(idorRes.status).toBe(403);
      expect(idorRes.body.success).toBe(false);
      expect(idorRes.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should prevent User B from cancelling User A booking', async () => {
      const trainer = await createTestTrainer();
      const plan = await createTestPlan();
      const userA = await createTestUser({ email: 'booker@example.com' });
      const userB = await createTestUser({ email: 'sneaky@example.com' });

      await createActivePassPurchase(userA.id, plan.id);
      const gymClass = await createTestClass({ trainerId: trainer.trainerProfile!.id });

      const tokensA = generateTestTokens({ id: userA.id, email: userA.email, role: userA.role });
      const tokensB = generateTestTokens({ id: userB.id, email: userB.email, role: userB.role });

      // User A books class
      await request(app)
        .post(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${tokensA.accessToken}`);

      // User B attempts to cancel User A's booking
      const cancelAttemptRes = await request(app)
        .delete(`/api/v1/classes/${gymClass.id}/book`)
        .set('Authorization', `Bearer ${tokensB.accessToken}`);

      // Should return 404 because User B has no active booking in that class
      expect(cancelAttemptRes.status).toBe(404);

      // Verify User A booking remains CONFIRMED
      const bookingInDb = await prisma.booking.findUnique({
        where: { userId_classId: { userId: userA.id, classId: gymClass.id } },
      });
      expect(bookingInDb?.status).toBe('CONFIRMED');
    });
  });

  describe('Input Validation & Boundary Testing (Objective 5)', () => {
    it('should reject malformed UUID in plan parameter with 400 Bad Request', async () => {
      const res = await request(app).get('/api/v1/plans/not-a-valid-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Invalid URL parameters');
    });

    it('should reject malformed UUID in class booking route with 400 Bad Request', async () => {
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({ id: member.id, email: member.email, role: member.role });

      const res = await request(app)
        .post('/api/v1/classes/malformed-id-123/book')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject malformed UUID in receipt lookup with 400 Bad Request', async () => {
      const member = await createTestUser();
      const { accessToken } = generateTestTokens({ id: member.id, email: member.email, role: member.role });

      const res = await request(app)
        .get('/api/v1/checkout/receipt/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unexpected / injected fields in profile update (mass assignment prevention)', async () => {
      const member = await createTestUser({ role: 'MEMBER' });
      const { accessToken } = generateTestTokens({ id: member.id, email: member.email, role: member.role });

      // Malicious payload attempting privilege escalation
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'ValidName',
          role: 'ADMIN', // Unrecognized key on strict schema
          status: 'ACTIVE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Verify role in DB remains MEMBER
      const userInDb = await prisma.user.findUnique({ where: { id: member.id } });
      expect(userInDb?.role).toBe('MEMBER');
    });
  });

  describe('Sensitive Information & Password Leakage Prevention (Objective 6 & 9)', () => {
    it('should never expose password_hash or internal secrets in login or profile responses', async () => {
      const member = await createTestUser();

      // Login response check
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: member.email, password: 'StrongPassword123!' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.passwordHash).toBeUndefined();
      expect(loginRes.body.data.user.password).toBeUndefined();
      expect(JSON.stringify(loginRes.body)).not.toContain('$2b$');

      // Profile endpoint check
      const { accessToken } = generateTestTokens({ id: member.id, email: member.email, role: member.role });
      const profileRes = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.passwordHash).toBeUndefined();
      expect(profileRes.body.data.password).toBeUndefined();
      expect(JSON.stringify(profileRes.body)).not.toContain('$2b$');
    });

    it('should not leak stack traces or internal paths on 404 or unhandled errors', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(res.body.stack).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('node_modules');
    });
  });

  describe('Cookie Security & Scoping (Objective 8)', () => {
    it('should set refresh cookie with httpOnly, sameSite strict, and path /api/v1/auth', async () => {
      const member = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: member.email, password: 'StrongPassword123!' });

      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const cookieStr = cookies[0];
      expect(cookieStr).toMatch(/HttpOnly/i);
      expect(cookieStr).toMatch(/SameSite=Strict/i);
      expect(cookieStr).toMatch(/Path=\/api\/v1\/auth/i);
    });
  });
});

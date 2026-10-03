import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import {
  cleanDatabase,
  createTestUser,
  generateTestTokens,
} from './helpers.js';

describe('Role-Based Access Control (RBAC)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Unauthenticated Access (Missing Auth)', () => {
    it('should reject request without token to protected member route with 401', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject request without token to protected admin route with 401', async () => {
      const res = await request(app).get('/api/v1/admin/analytics/overview');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Authorized Member Access', () => {
    it('should allow MEMBER to access member profile route', async () => {
      const member = await createTestUser({ role: 'MEMBER' });
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(member.email);
    });
  });

  describe('Role Restriction / Unauthorized Access', () => {
    it('should deny MEMBER access to admin-only analytics route with 403', async () => {
      const member = await createTestUser({ role: 'MEMBER' });
      const { accessToken } = generateTestTokens({
        id: member.id,
        email: member.email,
        role: member.role,
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should deny TRAINER access to admin-only analytics route with 403', async () => {
      const trainer = await createTestUser({ role: 'TRAINER' });
      const { accessToken } = generateTestTokens({
        id: trainer.id,
        email: trainer.email,
        role: trainer.role,
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('Admin-Only Route Access', () => {
    it('should allow ADMIN full access to admin analytics route', async () => {
      const admin = await createTestUser({ role: 'ADMIN' });
      const { accessToken } = generateTestTokens({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const res = await request(app)
        .get('/api/v1/admin/analytics/overview')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should allow ADMIN to retrieve members roster', async () => {
      const admin = await createTestUser({ role: 'ADMIN' });
      await createTestUser({ role: 'MEMBER', firstName: 'Alice' });

      const { accessToken } = generateTestTokens({
        id: admin.id,
        email: admin.email,
        role: admin.role,
      });

      const res = await request(app)
        .get('/api/v1/admin/members')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});

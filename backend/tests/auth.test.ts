import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import {
  cleanDatabase,
  createTestUser,
  generateExpiredToken,
} from './helpers.js';

describe('Authentication & Session Management', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should successfully signup a new member', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('MEMBER');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();

      const userInDb = await prisma.user.findUnique({
        where: { email: 'jane@example.com' },
      });
      expect(userInDb).not.toBeNull();
    });

    it('should reject duplicate signup with same email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Another',
          lastName: 'Name',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login and return access token + http-only refresh cookie', async () => {
      await createTestUser({
        email: 'member@example.com',
        password: 'ValidPassword123!',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'member@example.com',
          password: 'ValidPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('member@example.com');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);

      // Verify session was created in DB
      const sessions = await prisma.session.findMany();
      expect(sessions.length).toBe(1);
      expect(sessions[0].revokedAt).toBeNull();
    });

    it('should reject invalid password', async () => {
      await createTestUser({
        email: 'member@example.com',
        password: 'CorrectPassword123!',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'member@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject login for suspended account', async () => {
      await createTestUser({
        email: 'suspended@example.com',
        password: 'Password123!',
        status: 'SUSPENDED',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'suspended@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('JWT Access Token Validation', () => {
    it('should return 401 when access token is missing', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when access token is invalid / malformed', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should return 401 when access token is expired', async () => {
      const user = await createTestUser();
      const expiredToken = generateExpiredToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Refresh Token Rotation & Security', () => {
    it('should rotate refresh token and issue new access token', async () => {
      const user = await createTestUser({ email: 'refresh@example.com' });

      // 1. Initial Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'StrongPassword123!' });

      const cookieHeader = loginRes.headers['set-cookie'][0];
      const initialRefreshToken = cookieHeader.split(';')[0].replace('refreshToken=', '');

      // 2. Perform Refresh
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${initialRefreshToken}`);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const newCookieHeader = refreshRes.headers['set-cookie'][0];
      const newRefreshToken = newCookieHeader.split(';')[0].replace('refreshToken=', '');

      expect(newRefreshToken).not.toBe(initialRefreshToken);

      // Verify old session was marked revoked and replaced
      const sessions = await prisma.session.findMany({ where: { userId: user.id } });
      expect(sessions.length).toBe(2);

      const oldSession = sessions.find((s) => s.replacedBy !== null);
      const activeSession = sessions.find((s) => s.replacedBy === null);

      expect(oldSession).toBeDefined();
      expect(oldSession?.revokedAt).not.toBeNull();
      expect(activeSession?.revokedAt).toBeNull();
    });

    it('should detect token theft on reuse of old rotated refresh token and invalidate all sessions', async () => {
      const user = await createTestUser({ email: 'theft@example.com' });

      // 1. Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'StrongPassword123!' });

      const initialCookie = loginRes.headers['set-cookie'][0];
      const initialToken = initialCookie.split(';')[0].replace('refreshToken=', '');

      // 2. Legitimate Refresh (rotates token)
      const firstRefreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${initialToken}`);
      expect(firstRefreshRes.status).toBe(200);

      // 3. Attacker tries to use the old initialToken (reuse attack)
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${initialToken}`);

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('AUTHENTICATION_ERROR');

      // 4. Verify ALL sessions for this user have been revoked
      const remainingActiveSessions = await prisma.session.findMany({
        where: { userId: user.id, revokedAt: null },
      });
      expect(remainingActiveSessions.length).toBe(0);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke active session and clear refresh cookie on logout', async () => {
      const user = await createTestUser({ email: 'logout@example.com' });

      // Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'StrongPassword123!' });

      const cookieHeader = loginRes.headers['set-cookie'][0];
      const refreshToken = cookieHeader.split(';')[0].replace('refreshToken=', '');

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Session should be revoked in DB
      const sessionInDb = await prisma.session.findFirst({
        where: { userId: user.id },
      });
      expect(sessionInDb?.revokedAt).not.toBeNull();

      // Subsequent refresh with same token should fail
      const refreshAfterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(refreshAfterLogout.status).toBe(401);
    });
  });
});

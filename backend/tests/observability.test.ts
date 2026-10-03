import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { createShutdownHandler } from '../src/server.js';
import type { Server } from 'http';

describe('Phase 3: Reliability, Health, and Observability', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health Probes (Liveness & Readiness)', () => {
    it('GET /health/live should return 200 with status alive without database dependency', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
      expect(typeof res.body.uptime).toBe('number');
      expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
    });

    it('GET /health/ready should return 200 with database connected when PostgreSQL is healthy', async () => {
      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.uptime).toBe('number');
    });

    it('GET /health/ready should return 503 when PostgreSQL connection fails', async () => {
      const querySpy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection terminated'));

      const res = await request(app).get('/health/ready');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unready');
      expect(res.body.database).toBe('disconnected');
      expect(res.body.error).toBe('Database connection unavailable');

      querySpy.mockRestore();
    });

    it('GET /health should return 200 for backward compatibility when DB is healthy', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });

    it('GET /health should return 503 when DB is unreachable', async () => {
      const querySpy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('Connection timeout'));

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.database).toBe('disconnected');

      querySpy.mockRestore();
    });
  });

  describe('2. Request ID & Correlation Middleware', () => {
    it('should generate an X-Request-Id header when none is provided by the client', async () => {
      const res = await request(app).get('/api/v1/plans');

      expect(res.headers['x-request-id']).toBeDefined();
      // Valid UUID v4 pattern
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should preserve and propagate a valid client-supplied X-Request-Id header', async () => {
      const customTraceId = 'client-trace-12345-abcdef';
      const res = await request(app)
        .get('/api/v1/plans')
        .set('X-Request-Id', customTraceId);

      expect(res.headers['x-request-id']).toBe(customTraceId);
    });

    it('should sanitize and replace an invalid/unsafe client-supplied X-Request-Id header', async () => {
      const maliciousId = 'invalid id with spaces <script>alert(1)</script>';
      const res = await request(app)
        .get('/api/v1/plans')
        .set('X-Request-Id', maliciousId);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).not.toBe(maliciousId);
      expect(res.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('3. Error Observability & Response Formatting', () => {
    it('should include requestId in 404 Not Found error responses matching X-Request-Id header', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });

    it('should include requestId in 401 Unauthorized error responses', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });

    it('should include requestId and validation details in 400 Bad Request responses', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.requestId).toBe(res.headers['x-request-id']);
    });
  });

  describe('4. Graceful Shutdown Handler', () => {
    it('should gracefully close the server, disconnect database, and exit cleanly with code 0', async () => {
      let closeCalled = false;
      let closeIdleCalled = false;

      const mockServer = {
        closeIdleConnections: () => {
          closeIdleCalled = true;
        },
        close: (callback?: (err?: Error) => void) => {
          closeCalled = true;
          if (callback) callback();
          return mockServer;
        },
      } as unknown as Server;

      const exitMock = vi.fn();
      const shutdown = createShutdownHandler(mockServer, exitMock);

      await shutdown('SIGTERM');

      expect(closeIdleCalled).toBe(true);
      expect(closeCalled).toBe(true);
      expect(exitMock).toHaveBeenCalledWith(0);
    });

    it('should be idempotent and ignore secondary shutdown signals', async () => {
      let closeCallCount = 0;

      const mockServer = {
        closeIdleConnections: () => {},
        close: (callback?: (err?: Error) => void) => {
          closeCallCount++;
          if (callback) callback();
          return mockServer;
        },
      } as unknown as Server;

      const exitMock = vi.fn();
      const shutdown = createShutdownHandler(mockServer, exitMock);

      await Promise.all([
        shutdown('SIGINT'),
        shutdown('SIGTERM'),
        shutdown('SIGINT'),
      ]);

      expect(closeCallCount).toBe(1);
    });
  });
});

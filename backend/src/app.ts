import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './types/api.types.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.js';

import { prisma } from './config/db.js';

import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { requestLogger } from './middleware/request-logger.middleware.js';

export const app = express();

// 1. Request Correlation & Observability (Applied earliest in the chain)
app.use(requestIdMiddleware);
app.use(requestLogger);

// 2. Security Headers (Strict CSP on all API routes, customized for Swagger on /api/docs)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
  })
);

// 3. CORS Whitelisting
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// 4. Body Parsing with Safe Bounds (DoS mitigation)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Global Rate Limiter
app.use(globalLimiter);

// 6. Health & Observability Probes
// Liveness: Process is alive (no dependency check)
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness: Application can serve traffic requiring external dependencies (PostgreSQL)
app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: 'Database connection unavailable',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
});

// Overall Health (Backward compatibility)
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
});

// 6. Interactive Swagger Documentation (Scoped CSP override for UI assets)
app.use(
  '/api/docs',
  (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: validator.swagger.io; font-src 'self' https: data:;"
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);
app.get('/docs', (_req, res) => res.redirect('/api/docs'));
app.get('/', (_req, res) => res.redirect('/api/docs'));

// 7. Mount API v1 Routes
app.use('/api/v1', apiRouter);

// 7. 404 Catch-All Handler
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
});

// 8. Centralized Exception & Error Handler
app.use(errorHandler);

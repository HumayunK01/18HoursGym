import express from 'express';
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

export const app = express();

// 1. Security Headers (Disable CSP on /api/docs so Swagger UI assets load cleanly)
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
  })
);

// 2. CORS Whitelisting
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsing with Safe Bounds (DoS mitigation)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Global Rate Limiter
app.use(globalLimiter);

// 5. Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 6. Interactive Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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

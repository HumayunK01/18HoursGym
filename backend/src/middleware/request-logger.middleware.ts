import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    // Avoid noisy logging on health probes
    if (req.originalUrl.startsWith('/health')) {
      return;
    }

    const durationMs = Number((process.hrtime.bigint() - start) / 1000000n);
    const statusCode = res.statusCode;

    const logMeta = {
      requestId: req.id,
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode,
      durationMs,
      userId: req.user?.id,
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${req.originalUrl} failed with ${statusCode}`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${req.originalUrl} responded with ${statusCode}`, logMeta);
    } else {
      logger.info(`HTTP ${req.method} ${req.originalUrl} completed with ${statusCode}`, logMeta);
    }
  });

  next();
}

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../types/api.types.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  // 1. Handled Operational Errors (Expected client errors, validation, auth, conflicts)
  if (err instanceof AppError) {
    logger.warn(`Operational error [${err.errorCode}]: ${err.message}`, {
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode: err.statusCode,
      error: { code: err.errorCode, message: err.message },
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        requestId,
        details: err.details,
      },
    });
    return;
  }

  // 2. Prisma Database Specific Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'field';
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: `A record with this ${target} already exists.`,
          requestId,
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Requested record was not found.',
          requestId,
        },
      });
      return;
    }
    if (err.code === 'P2023') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid identifier format.',
          requestId,
        },
      });
      return;
    }
  }

  // 3. Unhandled Server Errors (Unexpected exceptions)
  logger.error(`Unhandled Exception: ${err.message}`, {
    requestId,
    method: req.method,
    route: req.originalUrl,
    error: {
      message: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        env.NODE_ENV === 'production'
          ? 'An internal server error occurred.'
          : err.message || 'An internal server error occurred.',
      requestId,
    },
  });
}

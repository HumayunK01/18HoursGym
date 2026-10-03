import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const REQUEST_ID_HEADER = 'X-Request-Id';
const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = (req.headers['x-request-id'] || req.headers['x-correlation-id']) as string | undefined;

  const requestId =
    incomingId && typeof incomingId === 'string' && VALID_ID_REGEX.test(incomingId.trim())
      ? incomingId.trim()
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}

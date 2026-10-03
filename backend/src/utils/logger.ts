import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'cookie',
  'authorization',
  'jwt_access_secret',
  'jwt_refresh_secret',
  'secret',
  'cardnumber',
  'cvv',
]);

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface StructuredLogMeta {
  requestId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  error?: string | Record<string, unknown>;
  [key: string]: unknown;
}

class Logger {
  private isTest = env.NODE_ENV === 'test' && !process.env.DEBUG;

  private formatMessage(level: LogLevel, message: string, meta?: StructuredLogMeta): void {
    if (this.isTest) return;

    const timestamp = new Date().toISOString();
    const cleanMeta = meta ? (sanitizeData(meta) as Record<string, unknown>) : {};

    const entry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...cleanMeta,
    };

    const serialized = JSON.stringify(entry);

    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  info(message: string, meta?: StructuredLogMeta): void {
    this.formatMessage('info', message, meta);
  }

  warn(message: string, meta?: StructuredLogMeta): void {
    this.formatMessage('warn', message, meta);
  }

  error(message: string, meta?: StructuredLogMeta): void {
    this.formatMessage('error', message, meta);
  }

  debug(message: string, meta?: StructuredLogMeta): void {
    if (env.NODE_ENV === 'development' || process.env.DEBUG) {
      this.formatMessage('debug', message, meta);
    }
  }
}

export const logger = new Logger();

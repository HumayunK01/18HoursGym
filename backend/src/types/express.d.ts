import { AuthUser } from './auth.types.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthUser;
    }
  }
}

export {};

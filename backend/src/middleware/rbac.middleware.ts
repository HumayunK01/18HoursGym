import { Request, Response, NextFunction } from 'express';
import { RoleType } from '../config/constants.js';
import { ForbiddenError, UnauthorizedError } from '../types/api.types.js';

export function requireRole(allowedRoles: RoleType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required before role check.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}.`));
      return;
    }

    next();
  };
}

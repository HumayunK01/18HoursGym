import { RoleType } from '../config/constants.js';

export interface AuthUser {
  id: string;
  email: string;
  role: RoleType;
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: RoleType;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
}

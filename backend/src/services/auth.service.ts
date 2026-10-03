import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ConflictError } from '../types/api.types.js';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/auth.types.js';
import { SignupInput, LoginInput } from '../types/schemas/auth.schema.js';
import { ROLES, RoleType } from '../config/constants.js';

const BCRYPT_SALT_ROUNDS = 12;

export class AuthService {
  static async signup(input: SignupInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: ROLES.MEMBER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role as RoleType);

    return { user, tokens };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Timing-attack prevention: compare dummy hash if user doesn't exist
    if (!user) {
      await bcrypt.compare(input.password, '$2b$12$e8xH14y3e4xH14y3e4xH1.dummyhashforconsistenttiming00');
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('This account has been suspended. Please contact gym administration.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokens = this.generateTokens(user.id, user.email, user.role as RoleType);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  static async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('User account not found or suspended.');
      }

      return this.generateTokens(user.id, user.email, user.role as RoleType);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }
  }

  static generateTokens(userId: string, email: string, role: RoleType) {
    const accessPayload: AccessTokenPayload = { userId, email, role };
    const refreshPayload: RefreshTokenPayload = { userId };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ConflictError, ForbiddenError } from '../types/api.types.js';
import { AccessTokenPayload } from '../types/auth.types.js';
import { SignupInput, LoginInput } from '../types/schemas/auth.schema.js';
import { ROLES, RoleType } from '../config/constants.js';

const BCRYPT_SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  /**
   * Hashes raw refresh token using SHA-256 for secure, deterministic lookup.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a short-lived JWT Access Token.
   */
  static generateAccessToken(userId: string, email: string, role: RoleType): string {
    const payload: AccessTokenPayload = { userId, email, role };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });
  }

  /**
   * Creates a new session record with a hashed refresh token.
   */
  static async createSession(userId: string): Promise<{ refreshToken: string; sessionId: string }> {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { refreshToken, sessionId: session.id };
  }

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

    const { refreshToken } = await this.createSession(user.id);
    const accessToken = this.generateAccessToken(user.id, user.email, user.role as RoleType);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Constant-time check to prevent user enumeration
    if (!user) {
      await bcrypt.compare(input.password, '$2b$12$e8xH14y3e4xH14y3e4xH1.dummyhashforconsistenttiming00');
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('This account has been suspended. Please contact gym administration.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const { refreshToken } = await this.createSession(user.id);
    const accessToken = this.generateAccessToken(user.id, user.email, user.role as RoleType);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Validates refresh token against sessions table, rotates token, and detects reuse.
   */
  static async refreshTokens(rawRefreshToken: string) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedError('Invalid or missing refresh token.');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
      },
    });

    // 1. Session not found
    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }

    // 2. Token reuse / theft detection:
    // If a session has already been revoked and replaced by another session,
    // it indicates a replay attack (stolen token). Invalidate all user sessions!
    if (session.revokedAt !== null) {
      if (session.replacedBy !== null) {
        await prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedError('Invalid or expired refresh token. Please log in again.');
    }

    // 3. Expiration check
    if (session.expiresAt <= new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    // 4. User account status check
    if (session.user.status !== 'ACTIVE') {
      await prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new ForbiddenError('This account has been suspended. Please contact gym administration.');
    }

    // 5. Rotate: Issue new refresh token, create new session, and revoke old session atomically
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      const newSession = await tx.session.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
        },
      });

      await tx.session.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          replacedBy: newSession.id,
        },
      });
    });

    const accessToken = this.generateAccessToken(
      session.user.id,
      session.user.email,
      session.user.role as RoleType
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revokes the session associated with the provided refresh token.
   */
  static async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return;
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { UserRole } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Verify password
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate Access & Refresh tokens
  static async generateTokens(user: {
    id: string;
    email: string;
    role: UserRole;
    employeeId?: string | null;
  }): Promise<TokenPair> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');

    // 7 days expiration for refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  // Login handler
  static async login(email: string, password: string, clientMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            designation: true,
            branchId: true,
            departmentId: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    if (!user.isActive) {
      throw new AppError('This user account has been deactivated. Please contact your school administrator.', 403);
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        employee: user.employee,
      },
      tokens,
    };
  }

  // Refresh token rotation
  static async refresh(refreshTokenString: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    // Check if token was already revoked (possible replay attack)
    if (storedToken.isRevoked) {
      // Invalidate all tokens for this user for security
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true },
      });
      throw new AppError('Revoked refresh token reused. Session invalidated for security.', 403);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AppError('Refresh token has expired. Please log in again.', 401);
    }

    if (!storedToken.user.isActive) {
      throw new AppError('User account is deactivated.', 403);
    }

    // Revoke old token and issue new token pair
    const newTokens = await this.generateTokens(storedToken.user);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        isRevoked: true,
        replacedByToken: newTokens.refreshToken,
      },
    });

    return newTokens;
  }

  // Logout - revoke refresh token
  static async logout(refreshTokenString?: string) {
    if (!refreshTokenString) return;
    const tokenHash = crypto.createHash('sha256').update(refreshTokenString).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  // Change password
  static async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found.', 404);

    const isMatch = await this.verifyPassword(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password does not match.', 400);
    }

    const newHash = await this.hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        isFirstLogin: false,
      },
    });

    // Invalidate prior refresh tokens on password change
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { message: 'Password changed successfully.' };
  }
}


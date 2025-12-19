import jwt from 'jsonwebtoken';
import env from '../config/env';
import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  id: string;
  email?: string | null;
  nip?: string | null;
  nis?: string | null;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  tokenVersion: number;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export class JWTService {
  /**
   * Generate access token (short-lived, 15 minutes)
   */
  static generateAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES,
    });
  }

  /**
   * Generate refresh token (long-lived, 7 days)
   */
  static generateRefreshToken(userId: string, tokenVersion: number): string {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      id: userId,
      tokenVersion,
      type: 'refresh',
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES,
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}


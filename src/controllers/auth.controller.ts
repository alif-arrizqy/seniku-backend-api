import { FastifyRequest, FastifyReply } from 'fastify';
import authService from '../services/auth.service';
import { ResponseFormatter } from '../utils/response';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { handleError } from '../utils/error-handler';
import { ErrorMessages, ErrorStatusCodes } from '../constants/error-messages';
import logger from '../utils/logger';
import { JWTService } from '../utils/jwt';

export class AuthController {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = registerSchema.parse(request.body);
      
      // Convert birthdate string to Date if needed
      const registerData = {
        ...validated,
        birthdate: validated.birthdate instanceof Date 
          ? validated.birthdate 
          : validated.birthdate 
            ? new Date(validated.birthdate) 
            : undefined,
      };
      
      const user = await authService.register(registerData);

      logger.info({ userId: user.id, role: user.role }, 'User registered successfully');
      return ResponseFormatter.success(reply, { user }, 'User registered successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Registration error', {
        body: request.body,
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = loginSchema.parse(request.body);
      const user = await authService.login(validated);

      // Generate JWT tokens
      const accessToken = JWTService.generateAccessToken({
        id: user.id,
        email: user.email,
        nip: user.nip,
        nis: user.nis,
        name: user.name,
        role: user.role,
      });

      const refreshToken = JWTService.generateRefreshToken(user.id, user.tokenVersion);

      logger.info({ userId: user.id, role: user.role }, 'User logged in successfully');
      return ResponseFormatter.success(
        reply,
        {
          user: {
            id: user.id,
            email: user.email,
            nip: user.nip,
            nis: user.nis,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          },
          accessToken,
          refreshToken,
        },
        'Login successful'
      );
    } catch (error: any) {
      return handleError(reply, error, 'Login error', {
        identifier: (request.body as any)?.identifier,
      });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(
          reply,
          ErrorMessages.AUTH.UNAUTHORIZED,
          ErrorStatusCodes.UNAUTHORIZED
        );
      }

      // Increment tokenVersion to invalidate all refresh tokens
      await authService.incrementTokenVersion(request.user.id);

      logger.info({ userId: request.user.id }, 'User logged out successfully');
      return ResponseFormatter.success(reply, null, 'Logout successful');
    } catch (error: any) {
      return handleError(reply, error, 'Logout error');
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { refreshToken?: string };
      const refreshToken = body.refreshToken;

      if (!refreshToken) {
        return ResponseFormatter.error(
          reply,
          'Refresh token is required',
          ErrorStatusCodes.BAD_REQUEST
        );
      }

      // Verify refresh token
      const decoded = JWTService.verifyRefreshToken(refreshToken);

      // Get user with current tokenVersion
      const user = await authService.getUserWithTokenVersion(decoded.id);

      if (!user.isActive) {
        return ResponseFormatter.error(
          reply,
          'Account is inactive',
          ErrorStatusCodes.UNAUTHORIZED
        );
      }

      // Check if tokenVersion matches (token not invalidated)
      if (user.tokenVersion !== decoded.tokenVersion) {
        return ResponseFormatter.error(
          reply,
          'Refresh token has been invalidated',
          ErrorStatusCodes.UNAUTHORIZED
        );
      }

      // Generate new access token
      const accessToken = JWTService.generateAccessToken({
        id: user.id,
        email: user.email,
        nip: user.nip,
        nis: user.nis,
        name: user.name,
        role: user.role,
      });

      logger.info({ userId: user.id }, 'Token refreshed successfully');
      return ResponseFormatter.success(
        reply,
        { accessToken },
        'Token refreshed successfully'
      );
    } catch (error: any) {
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        return ResponseFormatter.error(
          reply,
          error.message || 'Invalid refresh token',
          ErrorStatusCodes.UNAUTHORIZED
        );
      }
      return handleError(reply, error, 'Refresh token error');
    }
  }

  async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(
          reply,
          ErrorMessages.AUTH.UNAUTHORIZED,
          ErrorStatusCodes.UNAUTHORIZED
        );
      }

      const user = await authService.getUserById(request.user.id);
      return ResponseFormatter.success(reply, { user }, 'User retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get current user error', {
        userId: request.user?.id,
      });
    }
  }
}

export default new AuthController();


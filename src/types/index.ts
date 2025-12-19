import { FastifyRequest } from 'fastify';
import { UserRole } from '@prisma/client';

export interface SessionData {
  userId: string;
  role: UserRole;
  nip?: string;
  nis?: string;
  email?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    session: {
      get(key: string): any;
      set(key: string, value: any): void;
      delete(): void;
      sessionId: string;
    };
    user?: {
      id: string;
      email?: string | null;
      nip?: string | null;
      nis?: string | null;
      name: string;
      role: UserRole;
      avatar?: string | null;
    };
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email?: string | null;
    nip?: string | null;
    nis?: string | null;
    name: string;
    role: UserRole;
    avatar?: string | null;
  };
}


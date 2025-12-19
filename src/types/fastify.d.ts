import 'fastify';
import { UserRole } from '@prisma/client';

declare module 'fastify' {
  interface FastifyRequest {
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


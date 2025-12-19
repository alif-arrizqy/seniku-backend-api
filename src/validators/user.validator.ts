import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z
  .object({
    email: z.string().email().optional(),
    nip: z.string().min(1).optional(), // For TEACHER
    nis: z.string().min(1).optional(), // For STUDENT
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.nativeEnum(UserRole),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    birthdate: z.string().datetime().or(z.date()).optional(),
    classId: z.string().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.role === UserRole.STUDENT) {
        return !!data.nis;
      }
      if (data.role === UserRole.TEACHER) {
        return !!data.nip;
      }
      return true;
    },
    {
      message: 'Student must have NIS. Teacher must have NIP.',
      path: ['nip'],
    }
  );

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  nip: z.string().min(1).optional(),
  nis: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  birthdate: z.string().datetime().or(z.date()).optional(),
  classId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const queryUsersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
});


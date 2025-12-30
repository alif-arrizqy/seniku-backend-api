import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z
  .object({
    email: z.string().email().optional(),
    nip: z.string().min(1).optional(), // For TEACHER
    nis: z.string().min(1).optional(), // For STUDENT
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.nativeEnum(UserRole).default(UserRole.STUDENT),
    phone: z.string().optional(),
    address: z.string().optional(),
    bio: z.string().optional(),
    birthdate: z.string().datetime().or(z.date()).optional(),
    classId: z.string().uuid().optional(), // For STUDENT (required)
    classIds: z.array(z.string().uuid()).optional(), // For TEACHER (optional)
  })
  .refine(
    (data) => {
      // Student must have NIS
      if (data.role === UserRole.STUDENT) {
        return !!data.nis;
      }
      // Teacher must have NIP
      if (data.role === UserRole.TEACHER) {
        return !!data.nip;
      }
      return true;
    },
    {
      message: 'Student must have NIS. Teacher must have NIP.',
      path: ['nip'],
    }
  )
  .refine(
    (data) => {
      // Student must have classId
      if (data.role === UserRole.STUDENT) {
        return !!data.classId;
      }
      return true;
    },
    {
      message: 'Student must have classId',
      path: ['classId'],
    }
  )
  .refine(
    (data) => {
      // NIS only for students
      if (data.nis && data.role !== UserRole.STUDENT) {
        return false;
      }
      return true;
    },
    {
      message: 'NIS is only allowed for students',
      path: ['nis'],
    }
  )
  .refine(
    (data) => {
      // NIP only for teachers
      if (data.nip && data.role !== UserRole.TEACHER) {
        return false;
      }
      return true;
    },
    {
      message: 'NIP is only allowed for teachers',
      path: ['nip'],
    }
  )
  .refine(
    (data) => {
      // classId only for students
      if (data.classId && data.role !== UserRole.STUDENT) {
        return false;
      }
      return true;
    },
    {
      message: 'classId is only allowed for students',
      path: ['classId'],
    }
  )
  .refine(
    (data) => {
      // classIds only for teachers
      if (data.classIds && data.role !== UserRole.TEACHER) {
        return false;
      }
      return true;
    },
    {
      message: 'classIds is only allowed for teachers',
      path: ['classIds'],
    }
  );

export const loginSchema = z.object({
  identifier: z.string().min(1, 'NIP or NIS is required'),
  password: z.string().min(1, 'Password is required'),
});


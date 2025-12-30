import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';
import bcrypt from 'bcrypt';

export interface UserFilters {
  role?: UserRole;
  search?: string;
  classId?: string;
}

// Helper function to format date to YYYY-MM-DD
function formatDateToYYYYMMDD(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to format user object with formatted birthdate
function formatUserResponse(user: any): any {
  if (!user) return user;
  return {
    ...user,
    birthdate: formatDateToYYYYMMDD(user.birthdate),
  };
}

export class UserService {
  async findUsers(filters: UserFilters, pagination: PaginationResult) {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.classId) {
      where.classId = filters.classId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { nip: { contains: filters.search, mode: 'insensitive' } },
        { nis: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        className: true,
        classId: true,
        isActive: true,
        birthdate: true
      },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Format birthdate for all users
    const formattedUsers = users.map(formatUserResponse);

    return { users: formattedUsers, total };
  }

  async findUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        bio: true,
        birthdate: true,
        className: true,
        classId: true,
        isActive: true
      }
    });

    if (!user) {
      throw new Error(ErrorMessages.RESOURCE.USER_NOT_FOUND);
    }

    return formatUserResponse(user);
  }

  async createUser(data: {
    email?: string;
    nip?: string;
    nis?: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    address?: string;
    bio?: string;
    birthdate?: Date;
    classId?: string;
    classIds?: string[];
  }) {
    // Validate: Student must have NIS
    if (data.role === UserRole.STUDENT && !data.nis) {
      throw new Error('Student must have NIS');
    }

    // Validate: Teacher must have NIP
    if (data.role === UserRole.TEACHER && !data.nip) {
      throw new Error('Teacher must have NIP');
    }

    // Validate: Student must have classId
    if (data.role === UserRole.STUDENT && !data.classId) {
      throw new Error('Student must have classId');
    }

    // Check if NIP already exists
    if (data.nip) {
      const existingNIP = await prisma.user.findUnique({
        where: { nip: data.nip },
      });
      if (existingNIP) {
        throw new Error('NIP already exists');
      }
    }

    // Check if NIS already exists
    if (data.nis) {
      const existingNIS = await prisma.user.findUnique({
        where: { nis: data.nis },
      });
      if (existingNIS) {
        throw new Error('NIS already exists');
      }
    }

    // Check if email already exists (optional)
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Validate classId for STUDENT
    if (data.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: data.classId },
      });
      if (!classExists) {
        throw new Error('Class not found');
      }
    }

    // Validate classIds for TEACHER (if provided)
    if (data.classIds && data.classIds.length > 0) {
      const classes = await prisma.class.findMany({
        where: { id: { in: data.classIds } },
      });
      if (classes.length !== data.classIds.length) {
        throw new Error('One or more classes not found');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nip: data.nip,
        nis: data.nis,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone,
        address: data.address,
        bio: data.bio,
        birthdate: data.birthdate,
        classId: data.classId,
      },
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        bio: true,
        birthdate: true,
        className: true,
        classId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create TeacherClass relations if teacher has classIds
    if (data.role === UserRole.TEACHER && data.classIds && data.classIds.length > 0) {
      await prisma.teacherClass.createMany({
        data: data.classIds.map((classId) => ({
          teacherId: user.id,
          classId,
        })),
        skipDuplicates: true,
      });
    }

    return formatUserResponse(user);
  }

  async updateUser(userId: string, data: any) {
    // Get existing user to check role
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!existingUser) {
      throw new Error(ErrorMessages.RESOURCE.USER_NOT_FOUND);
    }

    // Handle classIds for TEACHER
    const { classIds, ...updateData } = data;

    // Validate classId for STUDENT if provided
    if (updateData.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: updateData.classId },
      });
      if (!classExists) {
        throw new Error('Class not found');
      }
    }

    // Validate classIds for TEACHER if provided
    if (classIds && classIds.length > 0) {
      if (existingUser.role !== UserRole.TEACHER) {
        throw new Error('classIds can only be updated for teachers');
      }
      const classes = await prisma.class.findMany({
        where: { id: { in: classIds } },
      });
      if (classes.length !== classIds.length) {
        throw new Error('One or more classes not found');
      }
    }

    // Ensure birthdate is a Date object if provided (fallback if validator is bypassed)
    if (updateData.birthdate && typeof updateData.birthdate === 'string') {
      // If it's a string in YYYY-MM-DD format, convert to Date
      if (/^\d{4}-\d{2}-\d{2}$/.test(updateData.birthdate)) {
        updateData.birthdate = new Date(updateData.birthdate);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nip: true,
        nis: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        address: true,
        bio: true,
        birthdate: true,
        className: true,
        classId: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Update TeacherClass relations if classIds provided for TEACHER
    if (existingUser.role === UserRole.TEACHER && classIds !== undefined) {
      // Delete existing relations
      await prisma.teacherClass.deleteMany({
        where: { teacherId: userId },
      });

      // Create new relations
      if (classIds.length > 0) {
        await prisma.teacherClass.createMany({
          data: classIds.map((classId: string) => ({
            teacherId: userId,
            classId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return formatUserResponse(user);
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export default new UserService();


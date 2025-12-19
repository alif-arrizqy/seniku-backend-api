import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { parsePagination, PaginationResult } from '../utils/pagination';

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
        createdAt: true,
      },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        class: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(userId: string, data: any) {
    // Ensure birthdate is a Date object if provided (fallback if validator is bypassed)
    const updateData = { ...data };
    if (updateData.birthdate && typeof updateData.birthdate === 'string') {
      // If it's a string in YYYY-MM-DD format, convert to Date
      if (/^\d{4}-\d{2}-\d{2}$/.test(updateData.birthdate)) {
        updateData.birthdate = new Date(updateData.birthdate);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
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

    return user;
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export default new UserService();


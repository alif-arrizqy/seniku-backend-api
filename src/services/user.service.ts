import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { parsePagination, PaginationResult } from '../utils/pagination';

export interface UserFilters {
  role?: UserRole;
  search?: string;
  classId?: string;
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


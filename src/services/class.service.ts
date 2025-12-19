import prisma from '../config/database';
import { parsePagination, PaginationResult } from '../utils/pagination';

export interface ClassFilters {
  search?: string;
}

export class ClassService {
  async findClasses(filters: ClassFilters, pagination: PaginationResult) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, total };
  }

  async findClassById(classId: string) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true,
            nis: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    return classData;
  }

  async createClass(data: { name: string; description?: string }) {
    const classData = await prisma.class.create({
      data,
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return classData;
  }

  async updateClass(classId: string, data: { name?: string; description?: string }) {
    const classData = await prisma.class.update({
      where: { id: classId },
      data,
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return classData;
  }

  async deleteClass(classId: string) {
    await prisma.class.delete({
      where: { id: classId },
    });
  }
}

export default new ClassService();


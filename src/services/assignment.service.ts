import prisma from '../config/database';
import { AssignmentStatus } from '@prisma/client';
import { parsePagination, PaginationResult } from '../utils/pagination';

export interface AssignmentFilters {
  status?: AssignmentStatus;
  category?: string;
  classId?: string;
  search?: string;
  createdById?: string;
}

export class AssignmentService {
  async findAssignments(filters: AssignmentFilters, pagination: PaginationResult) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.classId) {
      where.classes = {
        some: {
          classId: filters.classId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          classes: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assignment.count({ where }),
    ]);

    return { assignments, total };
  }

  async findAssignmentById(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                nis: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return assignment;
  }

  async createAssignment(
    data: {
      title: string;
      description: string;
      category: string;
      deadline: Date;
      status: AssignmentStatus;
      createdById: string;
      classIds: string[];
    }
  ) {
    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        deadline: data.deadline,
        status: data.status,
        createdById: data.createdById,
        classes: {
          create: data.classIds.map((classId) => ({
            classId,
          })),
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return assignment;
  }

  async updateAssignment(
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      deadline?: Date;
      status?: AssignmentStatus;
      classIds?: string[];
    }
  ) {
    // If classIds provided, update the classes
    if (data.classIds) {
      // Delete existing class assignments
      await prisma.assignmentClass.deleteMany({
        where: { assignmentId },
      });

      // Create new class assignments
      await prisma.assignmentClass.createMany({
        data: data.classIds.map((classId) => ({
          assignmentId,
          classId,
        })),
      });
    }

    const { classIds, ...updateData } = data;

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return assignment;
  }

  async deleteAssignment(assignmentId: string) {
    await prisma.assignment.delete({
      where: { id: assignmentId },
    });
  }

  async bulkUpdateStatus(assignmentIds: string[], status: AssignmentStatus) {
    await prisma.assignment.updateMany({
      where: {
        id: {
          in: assignmentIds,
        },
      },
      data: {
        status,
      },
    });
  }

  async bulkDelete(assignmentIds: string[]) {
    await prisma.assignment.deleteMany({
      where: {
        id: {
          in: assignmentIds,
        },
      },
    });
  }
}

export default new AssignmentService();


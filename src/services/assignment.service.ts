import prisma from '../config/database';
import { AssignmentStatus, Prisma, NotificationType } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';
import notificationService from './notification.service';

export interface AssignmentFilters {
  status?: AssignmentStatus;
  categoryId?: string;
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

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
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
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
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
    try {
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
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
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
        throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
      }

      return assignment;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async createAssignment(
    data: {
      title: string;
      description: string;
      categoryId: string;
      deadline: Date;
      status: AssignmentStatus;
      createdById: string;
      classIds: string[];
    }
  ) {
    try {
      // Verify that category exists
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      // Verify that all classes exist
      const classes = await prisma.class.findMany({
        where: { id: { in: data.classIds } },
      });

      if (classes.length !== data.classIds.length) {
        throw new Error(ErrorMessages.RESOURCE.CLASS_NOT_FOUND);
      }

      const assignment = await prisma.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
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
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
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

    // Create notifications for all students in assigned classes (only if status is ACTIVE)
    if (data.status === AssignmentStatus.ACTIVE) {
      // Get all students from assigned classes
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          classId: {
            in: data.classIds,
          },
        },
        select: {
          id: true,
        },
      });

      // Create notification for each student
      const notificationPromises = students.map((student) =>
        notificationService.createNotification({
          userId: student.id,
          type: NotificationType.ASSIGNMENT_CREATED,
          title: 'Tugas Baru',
          message: `Tugas baru '${data.title}' telah dibuat. Deadline: ${new Date(data.deadline).toLocaleDateString('id-ID')}`,
          link: `/assignments/${assignment.id}`,
        })
      );

      // Create notifications in parallel (don't wait for completion to avoid blocking)
      Promise.all(notificationPromises).catch((error) => {
        console.error('Error creating assignment notifications:', error);
      });
    }

    return assignment;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error(ErrorMessages.RESOURCE.CLASS_NOT_FOUND);
        }
        if (error.code === 'P2002') {
          const target = (error.meta as any)?.target;
          const field = Array.isArray(target) ? target[0] : 'field';
          throw new Error(`${field} ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
        }
      }
      throw error;
    }
  }

  async updateAssignment(
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      categoryId?: string;
      deadline?: Date;
      status?: AssignmentStatus;
      classIds?: string[];
    }
  ) {
    try {
      // Check if assignment exists
      const existingAssignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });

      if (!existingAssignment) {
        throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
      }

      // Verify that category exists if categoryId is provided
      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
      }

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
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
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
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async deleteAssignment(assignmentId: string) {
    try {
      // Check if assignment exists first
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
      }

      await prisma.assignment.delete({
        where: { id: assignmentId },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
        }
      }
      throw error;
    }
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


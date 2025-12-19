import prisma from '../config/database';
import { SubmissionStatus, Prisma, NotificationType } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';
import notificationService from './notification.service';

export interface SubmissionFilters {
  assignmentId?: string;
  studentId?: string;
  status?: SubmissionStatus;
  search?: string;
}

export class SubmissionService {
  async findSubmissions(filters: SubmissionFilters, pagination: PaginationResult) {
    const where: any = {};

    if (filters.assignmentId) {
      where.assignmentId = filters.assignmentId;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              category: true,
              deadline: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              email: true,
              avatar: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.submission.count({ where }),
    ]);

    return { submissions, total };
  }

  async findSubmissionById(submissionId: string) {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          assignment: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              email: true,
              avatar: true,
              className: true,
            },
          },
          revisions: {
            orderBy: { submittedAt: 'desc' },
          },
        },
      });

      if (!submission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      return submission;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async createSubmission(data: {
    assignmentId: string;
    studentId: string;
    title: string;
    description?: string;
    imageUrl: string;
    imageThumbnail?: string;
    imageMedium?: string;
  }) {
    try {
      // Verify assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: data.assignmentId },
      });

      if (!assignment) {
        throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
      }

      // Check if assignment deadline has passed
      if (assignment.deadline < new Date()) {
        throw new Error('Assignment deadline has passed');
      }

      const submission = await prisma.submission.create({
        data: {
          ...data,
          status: SubmissionStatus.PENDING,
          submittedAt: new Date(),
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
              avatar: true,
            },
          },
        },
      });

      return submission;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new Error(ErrorMessages.RESOURCE.ASSIGNMENT_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async updateSubmission(
    submissionId: string,
    data: {
      title?: string;
      description?: string;
      imageUrl?: string;
      imageThumbnail?: string;
      imageMedium?: string;
    }
  ) {
    try {
      // Check if submission exists
      const existingSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!existingSubmission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      // Only allow update if status is PENDING or REVISION
      if (existingSubmission.status !== SubmissionStatus.PENDING && existingSubmission.status !== SubmissionStatus.REVISION) {
        throw new Error('Cannot update submission: Already graded');
      }

      // If status is REVISION, change it back to PENDING after update
      const updatePayload: any = { ...data };
      if (existingSubmission.status === SubmissionStatus.REVISION) {
        updatePayload.status = SubmissionStatus.PENDING;
        updatePayload.submittedAt = new Date();
      }

      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: updatePayload,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              nis: true,
            },
          },
        },
      });

      return submission;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async gradeSubmission(submissionId: string, grade: number, feedback?: string) {
    try {
      // Check if submission exists
      const existingSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!existingSubmission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback,
          status: SubmissionStatus.GRADED,
          gradedAt: new Date(),
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              nis: true,
            },
          },
        },
      });

      // Create notification for student
      const gradeLetter = grade >= 90 ? 'A' : grade >= 80 ? 'B' : grade >= 70 ? 'C' : grade >= 60 ? 'D' : 'E';
      await notificationService.createNotification({
        userId: submission.student.id,
        type: NotificationType.SUBMISSION_GRADED,
        title: 'Karya Dinilai',
        message: `Karya '${submission.title}' telah dinilai dengan nilai ${gradeLetter} (${grade})`,
        link: `/submissions/${submissionId}`,
      });

      return submission;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async returnForRevision(submissionId: string, revisionNote: string, imageUrl: string) {
    try {
      // Check if submission exists
      const existingSubmission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!existingSubmission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      // Create revision record
      await prisma.submissionRevision.create({
        data: {
          submissionId,
          revisionNote,
          imageUrl,
        },
      });

      // Update submission
      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.REVISION,
          revisionCount: {
            increment: 1,
          },
        },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              nis: true,
            },
          },
          revisions: {
            orderBy: { submittedAt: 'desc' },
          },
        },
      });

      // Create notification for student
      await notificationService.createNotification({
        userId: submission.student.id,
        type: NotificationType.SUBMISSION_REVISION,
        title: 'Karya Perlu Direvisi',
        message: `Karya '${submission.title}' perlu direvisi. ${revisionNote.substring(0, 100)}${revisionNote.length > 100 ? '...' : ''}`,
        link: `/submissions/${submissionId}`,
      });

      return submission;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async deleteSubmission(submissionId: string) {
    try {
      // Check if submission exists first
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      // Only allow delete if status is PENDING
      if (submission.status !== SubmissionStatus.PENDING) {
        throw new Error('Cannot delete submission: Already graded or in revision');
      }

      await prisma.submission.delete({
        where: { id: submissionId },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
        }
      }
      throw error;
    }
  }
}

export default new SubmissionService();


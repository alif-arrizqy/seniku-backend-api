import prisma from '../config/database';
import { SubmissionStatus } from '@prisma/client';
import { parsePagination, PaginationResult } from '../utils/pagination';

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
      throw new Error('Submission not found');
    }

    return submission;
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
    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data,
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
  }

  async gradeSubmission(submissionId: string, grade: number, feedback?: string) {
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

    return submission;
  }

  async returnForRevision(submissionId: string, revisionNote: string, imageUrl: string) {
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

    return submission;
  }

  async deleteSubmission(submissionId: string) {
    await prisma.submission.delete({
      where: { id: submissionId },
    });
  }
}

export default new SubmissionService();


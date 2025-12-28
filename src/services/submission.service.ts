import prisma from '../config/database';
import { SubmissionStatus, Prisma, NotificationType } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';
import notificationService from './notification.service';
import achievementCheckerService from './achievement-checker.service';

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
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
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
          revisions: {
            orderBy: { version: 'asc' },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.submission.count({ where }),
    ]);

    // Transform submissions to include imageHistory
    const submissionsWithHistory = submissions.map((submission) => {
      const imageHistory = [
        // Include all revisions
        ...submission.revisions.map((rev) => ({
          image: rev.imageUrl,
          submittedAt: rev.submittedAt.toISOString(),
          version: rev.version,
        })),
        // Include current image as latest version
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: submission.revisionCount + 1,
        },
      ].sort((a, b) => a.version - b.version);

      return {
        ...submission,
        imageHistory,
      };
    });

    return { submissions: submissionsWithHistory, total };
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
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
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
            orderBy: { version: 'asc' },
          },
        },
      });

      if (!submission) {
        throw new Error(ErrorMessages.RESOURCE.SUBMISSION_NOT_FOUND);
      }

      // Transform to include imageHistory
      const imageHistory = [
        // Include all revisions
        ...submission.revisions.map((rev) => ({
          image: rev.imageUrl,
          submittedAt: rev.submittedAt.toISOString(),
          version: rev.version,
        })),
        // Include current image as latest version
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: submission.revisionCount + 1,
        },
      ].sort((a, b) => a.version - b.version);

      return {
        ...submission,
        imageHistory,
      };
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
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                },
              },
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

      // Save first version to history
      await prisma.submissionRevision.create({
        data: {
          submissionId: submission.id,
          revisionNote: null, // No revision note for initial submission
          imageUrl: data.imageUrl,
          version: 1,
          submittedAt: submission.submittedAt || new Date(),
        },
      });

      // Transform to include imageHistory
      const imageHistory = [
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: 1,
        },
      ];

      return {
        ...submission,
        imageHistory,
      };
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

      // If image is being updated, save current image to history before updating
      if (data.imageUrl && data.imageUrl !== existingSubmission.imageUrl) {
        const nextVersion = existingSubmission.revisionCount + 2; // +2 because version 1 is initial submission
        
        await prisma.submissionRevision.create({
          data: {
            submissionId: submissionId,
            revisionNote: null, // No revision note for student's own update
            imageUrl: existingSubmission.imageUrl, // Save old image
            version: nextVersion,
            submittedAt: new Date(),
          },
        });
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
          revisions: {
            orderBy: { version: 'asc' },
          },
        },
      });

      // Transform to include imageHistory
      const imageHistory = [
        // Include all revisions
        ...submission.revisions.map((rev) => ({
          image: rev.imageUrl,
          submittedAt: rev.submittedAt.toISOString(),
          version: rev.version,
        })),
        // Include current image as latest version
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: submission.revisionCount + 1,
        },
      ].sort((a, b) => a.version - b.version);

      return {
        ...submission,
        imageHistory,
      };
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
          revisions: {
            orderBy: { version: 'asc' },
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

      // Check and unlock achievements (async, don't wait)
      achievementCheckerService.checkAndUnlockAchievements(submission.student.id).catch((error) => {
        console.error('Error checking achievements:', error);
      });

      // Transform to include imageHistory
      const imageHistory = [
        // Include all revisions
        ...submission.revisions.map((rev) => ({
          image: rev.imageUrl,
          submittedAt: rev.submittedAt.toISOString(),
          version: rev.version,
        })),
        // Include current image as latest version
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: submission.revisionCount + 1,
        },
      ].sort((a, b) => a.version - b.version);

      return {
        ...submission,
        imageHistory,
      };
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

      // Save current image to history before returning for revision
      // This ensures we have a record of the image that was returned
      const nextVersion = existingSubmission.revisionCount + 2; // +2 because version 1 is initial submission
      
      await prisma.submissionRevision.create({
        data: {
          submissionId,
          revisionNote, // Save revision note from teacher
          imageUrl: existingSubmission.imageUrl, // Save current image before revision
          version: nextVersion,
          submittedAt: new Date(),
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
            orderBy: { version: 'asc' },
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

      // Transform to include imageHistory
      const imageHistory = [
        // Include all revisions
        ...submission.revisions.map((rev) => ({
          image: rev.imageUrl,
          submittedAt: rev.submittedAt.toISOString(),
          version: rev.version,
        })),
        // Include current image as latest version
        {
          image: submission.imageUrl,
          submittedAt: (submission.submittedAt || submission.createdAt).toISOString(),
          version: submission.revisionCount + 1,
        },
      ].sort((a, b) => a.version - b.version);

      return {
        ...submission,
        imageHistory,
      };
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


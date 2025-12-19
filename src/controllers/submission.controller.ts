import { FastifyRequest, FastifyReply } from 'fastify';
import submissionService from '../services/submission.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import storageService from '../services/storage.service';
import imageService from '../services/image.service';
import env from '../config/env';
import {
  updateSubmissionSchema,
  querySubmissionsSchema,
  returnForRevisionSchema,
} from '../validators/submission.validator';
import { gradeSubmissionSchema } from '../validators/assignment.validator';
import { idParamSchema } from '../validators/common.validator';
import { generateFileName, validateFileType, validateFileSize } from '../utils/file';
import { handleError } from '../utils/error-handler';

export class SubmissionController {
  async getSubmissions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = querySubmissionsSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        assignmentId: query.assignmentId,
        studentId: query.studentId || (request.user?.role === 'STUDENT' ? request.user.id : undefined),
        status: query.status,
        search: query.search,
      };

      const { submissions, total } = await submissionService.findSubmissions(filters, pagination);

      return ResponseFormatter.paginated(
        reply,
        submissions,
        {
          page: pagination.page,
          limit: pagination.limit,
          total,
        },
        'Submissions retrieved successfully'
      );
    } catch (error: any) {
      return handleError(reply, error, 'Get submissions error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getSubmissionById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const submission = await submissionService.findSubmissionById(id);

      return ResponseFormatter.success(reply, { submission }, 'Submission retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get submission by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async createSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const data = await request.file();
      if (!data) {
        return ResponseFormatter.error(reply, 'Image file is required', 400);
      }

      // Validate file type
      const fileTypeValidation = validateFileType(data.mimetype);
      if (!fileTypeValidation.valid) {
        return ResponseFormatter.error(reply, fileTypeValidation.error || 'Invalid file type', 400);
      }

      // Validate file size
      const buffer = await data.toBuffer();
      const fileSizeValidation = validateFileSize(buffer.length);
      if (!fileSizeValidation.valid) {
        return ResponseFormatter.error(reply, fileSizeValidation.error || 'File too large', 400);
      }

      // Validate and process image
      const imageValidation = await imageService.validateImage(buffer);
      if (!imageValidation.valid) {
        return ResponseFormatter.error(reply, imageValidation.error || 'Invalid image', 400);
      }

      // Process image (generate thumbnails)
      const processed = await imageService.processImage(buffer, true);

      // Parse form fields
      const body = data.fields as any;
      const assignmentId = body.assignmentId?.value;
      const title = body.title?.value;
      const description = body.description?.value;

      if (!assignmentId || !title) {
        return ResponseFormatter.error(reply, 'Assignment ID and title are required', 400);
      }

      // Upload images to MinIO
      const fileName = generateFileName(data.filename, 'submission');
      const imageUrl = await storageService.uploadFile(
        env.MINIO_BUCKET_SUBMISSIONS,
        fileName,
        processed.full,
        'image/jpeg',
        processed.full.length
      );

      let imageThumbnail: string | undefined;
      let imageMedium: string | undefined;

      if (processed.thumbnail) {
        const thumbName = `thumb-${fileName}`;
        imageThumbnail = await storageService.uploadFile(
          env.MINIO_BUCKET_SUBMISSIONS,
          thumbName,
          processed.thumbnail,
          'image/jpeg',
          processed.thumbnail.length
        );
      }

      if (processed.medium) {
        const mediumName = `medium-${fileName}`;
        imageMedium = await storageService.uploadFile(
          env.MINIO_BUCKET_SUBMISSIONS,
          mediumName,
          processed.medium,
          'image/jpeg',
          processed.medium.length
        );
      }

      // Create submission
      const submission = await submissionService.createSubmission({
        assignmentId,
        studentId: request.user.id,
        title,
        description,
        imageUrl,
        imageThumbnail,
        imageMedium,
      });

      return ResponseFormatter.success(reply, { submission }, 'Submission created successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Create submission error', {
        userId: request.user?.id,
      });
    }
  }

  async updateSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return ResponseFormatter.error(reply, 'Unauthorized', 401);
      }

      const { id } = idParamSchema.parse(request.params);

      // Check if request has file (multipart/form-data)
      const data = await request.file();
      
      let updateData: {
        title?: string;
        description?: string;
        imageUrl?: string;
        imageThumbnail?: string;
        imageMedium?: string;
      } = {};

      if (data) {
        // Handle file upload (multipart/form-data)
        // Validate file type
        const fileTypeValidation = validateFileType(data.mimetype);
        if (!fileTypeValidation.valid) {
          return ResponseFormatter.error(reply, fileTypeValidation.error || 'Invalid file type', 400);
        }

        // Validate file size
        const buffer = await data.toBuffer();
        const fileSizeValidation = validateFileSize(buffer.length);
        if (!fileSizeValidation.valid) {
          return ResponseFormatter.error(reply, fileSizeValidation.error || 'File too large', 400);
        }

        // Validate and process image
        const imageValidation = await imageService.validateImage(buffer);
        if (!imageValidation.valid) {
          return ResponseFormatter.error(reply, imageValidation.error || 'Invalid image', 400);
        }

        // Process image (generate thumbnails)
        const processed = await imageService.processImage(buffer, true);

        // Parse form fields
        const body = data.fields as any;
        const title = body.title?.value;
        const description = body.description?.value;

        // Upload images to MinIO
        const fileName = generateFileName(data.filename, 'submission');
        const imageUrl = await storageService.uploadFile(
          env.MINIO_BUCKET_SUBMISSIONS,
          fileName,
          processed.full,
          'image/jpeg',
          processed.full.length
        );

        let imageThumbnail: string | undefined;
        let imageMedium: string | undefined;

        if (processed.thumbnail) {
          const thumbName = `thumb-${fileName}`;
          imageThumbnail = await storageService.uploadFile(
            env.MINIO_BUCKET_SUBMISSIONS,
            thumbName,
            processed.thumbnail,
            'image/jpeg',
            processed.thumbnail.length
          );
        }

        if (processed.medium) {
          const mediumName = `medium-${fileName}`;
          imageMedium = await storageService.uploadFile(
            env.MINIO_BUCKET_SUBMISSIONS,
            mediumName,
            processed.medium,
            'image/jpeg',
            processed.medium.length
          );
        }

        updateData = {
          title,
          description,
          imageUrl,
          imageThumbnail,
          imageMedium,
        };
      } else {
        // Handle JSON body (no file upload)
        const validated = updateSubmissionSchema.parse(request.body);
        updateData = validated;
      }

      const submission = await submissionService.updateSubmission(id, updateData);

      return ResponseFormatter.success(reply, { submission }, 'Submission updated successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Update submission error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async gradeSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = gradeSubmissionSchema.parse(request.body);

      const submission = await submissionService.gradeSubmission(id, validated.grade, validated.feedback);

      return ResponseFormatter.success(reply, { submission }, 'Submission graded successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Grade submission error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async returnForRevision(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const validated = returnForRevisionSchema.parse(request.body);

      // TODO: Handle image upload for revision
      // For now, using the same image URL
      const submission = await submissionService.returnForRevision(id, validated.revisionNote, '');

      return ResponseFormatter.success(reply, { submission }, 'Submission returned for revision');
    } catch (error: any) {
      return handleError(reply, error, 'Return submission for revision error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async deleteSubmission(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await submissionService.deleteSubmission(id);

      return ResponseFormatter.success(reply, null, 'Submission deleted successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Delete submission error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }
}

export default new SubmissionController();


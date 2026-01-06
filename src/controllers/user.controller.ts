import { FastifyRequest, FastifyReply } from 'fastify';
import userService from '../services/user.service';
import { ResponseFormatter } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { queryUsersSchema, updateUserSchema, createUserSchema } from '../validators/user.validator';
import { idParamSchema } from '../validators/common.validator';
import { handleError } from '../utils/error-handler';
import storageService from '../services/storage.service';
import imageService from '../services/image.service';
import env from '../config/env';
import { generateFileName, validateFileType, validateFileSize } from '../utils/file';

export class UserController {
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = queryUsersSchema.parse(request.query);
      const pagination = parsePagination({ page: query.page, limit: query.limit });

      const filters = {
        role: query.role,
        search: query.search,
        classId: query.classId,
      };

      const { users, total } = await userService.findUsers(filters, pagination);

      return ResponseFormatter.paginated(reply, users, { ...pagination, total }, 'Users retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get users error', {
        query: request.query,
        userId: request.user?.id,
      });
    }
  }

  async getUserById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      const user = await userService.findUserById(id);

      return ResponseFormatter.success(reply, { user }, 'User retrieved successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Get user by ID error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = createUserSchema.parse(request.body);
      
      // Convert birthdate string to Date if needed
      const createData = {
        ...validated,
        birthdate: validated.birthdate instanceof Date 
          ? validated.birthdate 
          : validated.birthdate 
            ? new Date(validated.birthdate) 
            : undefined,
      };
      
      const user = await userService.createUser(createData);

      return ResponseFormatter.success(reply, { user }, 'User created successfully', 201);
    } catch (error: any) {
      return handleError(reply, error, 'Create user error', {
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);

      // Check if user is updating their own profile or is a teacher
      if (request.user?.id !== id && request.user?.role !== 'TEACHER') {
        return ResponseFormatter.error(reply, 'You can only update your own profile', 403);
      }

      // Try to get file from multipart request (for avatar upload)
      let updateData: any = {};

      try {
        // Check if request is multipart/form-data
        const contentType = request.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
          // Handle multipart/form-data with file upload
          const parts = request.parts();
          const fields: any = {};
          let avatarData: any = null;

          // Parse all parts
          for await (const part of parts) {
            if (part.type === 'file') {
              // This is the avatar file
              if (part.fieldname === 'avatar') {
                avatarData = part;
              }
            } else {
              // This is a form field
              fields[part.fieldname] = part.value;
            }
          }

          // If avatar file is provided, process and upload it
          if (avatarData) {
            // Validate file type
            const fileTypeValidation = validateFileType(avatarData.mimetype);
            if (!fileTypeValidation.valid) {
              return ResponseFormatter.error(reply, fileTypeValidation.error || 'Invalid file type', 400);
            }

            // Validate file size
            const buffer = await avatarData.toBuffer();
            const fileSizeValidation = validateFileSize(buffer.length);
            if (!fileSizeValidation.valid) {
              return ResponseFormatter.error(reply, fileSizeValidation.error || 'File too large', 400);
            }

            // Validate and process image
            const imageValidation = await imageService.validateImage(buffer);
            if (!imageValidation.valid) {
              return ResponseFormatter.error(reply, imageValidation.error || 'Invalid image', 400);
            }

            // Process image (resize for avatar)
            const processed = await imageService.processImage(buffer, false); // No thumbnails for avatar

            // Upload avatar to Supabase Storage
            const fileName = generateFileName(avatarData.filename || 'avatar.jpg', 'avatar');
            const avatarUrl = await storageService.uploadFile(
              env.SUPABASE_STORAGE_BUCKET_AVATARS,
              fileName,
              processed.full,
              'image/jpeg'
            );

            updateData.avatar = avatarUrl;
          }

          // Add other fields to updateData (only if they exist)
          if (fields.name !== undefined) updateData.name = fields.name;
          if (fields.phone !== undefined) updateData.phone = fields.phone || null;
          if (fields.address !== undefined) updateData.address = fields.address || null;
          if (fields.bio !== undefined) updateData.bio = fields.bio || null;
          if (fields.birthdate !== undefined) updateData.birthdate = fields.birthdate || null;
          if (fields.classId !== undefined) updateData.classId = fields.classId || null;
          
          // Handle classIds array if provided (for teachers)
          if (fields['classIds[]'] !== undefined) {
            const classIdsArray = Array.isArray(fields['classIds[]']) 
              ? fields['classIds[]'] 
              : [fields['classIds[]']];
            updateData.classIds = classIdsArray;
          }

          // Validate updateData with schema (excluding avatar which is already validated)
          const { avatar, ...dataToValidate } = updateData;
          if (Object.keys(dataToValidate).length > 0 || avatar) {
            if (Object.keys(dataToValidate).length > 0) {
              const validated = updateUserSchema.parse(dataToValidate);
              updateData = { ...validated, ...(avatar ? { avatar } : {}) };
            } else if (avatar) {
              updateData = { avatar };
            }
          }
        } else {
          // Handle JSON body (no file upload)
          const validated = updateUserSchema.parse(request.body);
          updateData = validated;
        }
      } catch (error: any) {
        // If multipart parsing fails, try JSON body
        if (error.code === 'FST_ERR_MULTIPART_INVALID_CONTENT_TYPE' || error.message?.includes('multipart')) {
          const validated = updateUserSchema.parse(request.body);
          updateData = validated;
        } else {
          throw error;
        }
      }

      const user = await userService.updateUser(id, updateData);

      return ResponseFormatter.success(reply, { user }, 'User updated successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Update user error', {
        params: request.params,
        body: request.body,
        userId: request.user?.id,
      });
    }
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = idParamSchema.parse(request.params);
      await userService.deleteUser(id);

      return ResponseFormatter.success(reply, null, 'User deleted successfully');
    } catch (error: any) {
      return handleError(reply, error, 'Delete user error', {
        params: request.params,
        userId: request.user?.id,
      });
    }
  }
}

export default new UserController();


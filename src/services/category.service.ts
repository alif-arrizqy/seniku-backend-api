import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
}

export class CategoryService {
  async findCategories(filters: CategoryFilters, pagination: PaginationResult) {
    const where: Prisma.CategoryWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);

    // Transform to include assignmentCount
    const categoriesWithCount = categories.map((category) => ({
      ...category,
      assignmentCount: category._count.assignments,
      _count: undefined,
    }));

    return { categories: categoriesWithCount, total };
  }

  async findCategoryById(categoryId: string) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      return {
        ...category,
        assignmentCount: category._count.assignments,
        _count: undefined,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
      }
      throw error;
    }
  }

  async createCategory(data: { name: string; description?: string; icon?: string }) {
    try {
      // Check if category already exists
      const categoryExists = await prisma.category.findUnique({
        where: { name: data.name },
      });

      if (categoryExists) {
        throw new Error(`Category name ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
      }

      // Sanitize icon - remove null bytes and trim
      const sanitizedIcon = data.icon
        ? data.icon.replace(/\0/g, '').trim().substring(0, 10)
        : undefined;

      const category = await prisma.category.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim(),
          icon: sanitizedIcon || undefined,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      });

      return {
        ...category,
        assignmentCount: category._count.assignments,
        _count: undefined,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta as any)?.target;
          const field = Array.isArray(target) ? target[0] : 'name';
          throw new Error(`${field} ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
        }
        if (error.code === 'P2003') {
          throw new Error('Invalid reference: Related record not found');
        }
        // Log Prisma errors for debugging
        console.error('Prisma error creating category:', {
          code: error.code,
          meta: error.meta,
          message: error.message,
        });
        throw new Error(`Database error: ${error.message || 'Failed to create category'}`);
      }
      // Re-throw custom errors
      if (error.message?.includes(ErrorMessages.RESOURCE.ALREADY_EXISTS)) {
        throw error;
      }
      // Log and re-throw with original message if it's already an Error
      if (error instanceof Error) {
        console.error('Error creating category:', error.message, error.stack);
        throw error;
      }
      // Generic error fallback
      console.error('Unknown error creating category:', error);
      throw new Error(`Failed to create category: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateCategory(
    categoryId: string,
    data: { name?: string; description?: string; icon?: string; isActive?: boolean }
  ) {
    try {
      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!existingCategory) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      // Check if new name already exists (if name is being updated)
      if (data.name && data.name !== existingCategory.name) {
        const categoryExists = await prisma.category.findUnique({
          where: { name: data.name },
        });
        if (categoryExists) {
          throw new Error(`Category name ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
        }
      }

      // Sanitize icon if provided
      const updateData: any = { ...data };
      if (updateData.icon !== undefined) {
        updateData.icon = updateData.icon
          ? updateData.icon.replace(/\0/g, '').trim().substring(0, 10)
          : null;
      }
      if (updateData.name !== undefined) {
        updateData.name = updateData.name.trim();
      }
      if (updateData.description !== undefined && updateData.description !== null) {
        updateData.description = updateData.description.trim();
      }

      const category = await prisma.category.update({
        where: { id: categoryId },
        data: updateData,
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      });

      return {
        ...category,
        assignmentCount: category._count.assignments,
        _count: undefined,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
        if (error.code === 'P2002') {
          const target = (error.meta as any)?.target;
          const field = Array.isArray(target) ? target[0] : 'name';
          throw new Error(`${field} ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
        }
      }
      // Re-throw custom errors
      if (
        error.message === ErrorMessages.RESOURCE.NOT_FOUND ||
        error.message?.includes(ErrorMessages.RESOURCE.ALREADY_EXISTS)
      ) {
        throw error;
      }
      throw new Error('Failed to update category');
    }
  }

  async deleteCategory(categoryId: string, force: boolean = false) {
    try {
      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      });

      if (!category) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      // Check if category has assignments
      if (category._count.assignments > 0 && !force) {
        throw new Error(
          'Cannot delete category: Has assignments. Use force=true to force delete.'
        );
      }

      await prisma.category.delete({
        where: { id: categoryId },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
        if (error.code === 'P2003') {
          throw new Error('Cannot delete category: Has assignments');
        }
      }
      // Re-throw custom errors
      if (
        error.message === ErrorMessages.RESOURCE.NOT_FOUND ||
        error.message?.includes('Cannot delete category')
      ) {
        throw error;
      }
      throw error;
    }
  }
}

export default new CategoryService();


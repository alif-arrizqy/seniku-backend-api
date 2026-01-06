import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { PaginationResult } from '../utils/pagination';
import { ErrorMessages } from '../constants/error-messages';

export interface AchievementFilters {
  search?: string;
}

export class AchievementService {
  async findAchievements(filters: AchievementFilters, pagination: PaginationResult) {
    const where: Prisma.AchievementWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [achievements, total] = await Promise.all([
      prisma.achievement.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          criteria: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.achievement.count({ where }),
    ]);

    const achievementsWithCount = achievements.map((achievement) => ({
      ...achievement,
      userCount: achievement._count.users,
      _count: undefined,
    }));

    return { achievements: achievementsWithCount, total };
  }

  async findAchievementById(achievementId: string) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!achievement) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      return {
        ...achievement,
        userCount: achievement._count.users,
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

  async createAchievement(data: { name: string; description: string; icon: string; criteria?: any }) {
    try {
      const achievementExists = await prisma.achievement.findUnique({
        where: { name: data.name },
      });

      if (achievementExists) {
        throw new Error(`Achievement name ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
      }

      const sanitizedIcon = data.icon.replace(/\0/g, '').trim().substring(0, 10);

      const achievement = await prisma.achievement.create({
        data: {
          name: data.name.trim(),
          description: data.description.trim(),
          icon: sanitizedIcon,
          criteria: data.criteria || null,
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return {
        ...achievement,
        userCount: achievement._count.users,
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
        console.error('Prisma error creating achievement:', {
          code: error.code,
          meta: error.meta,
          message: error.message,
        });
        throw new Error(`Database error: ${error.message || 'Failed to create achievement'}`);
      }
      if (error.message?.includes(ErrorMessages.RESOURCE.ALREADY_EXISTS)) {
        throw error;
      }
      if (error instanceof Error) {
        console.error('Error creating achievement:', error.message, error.stack);
        throw error;
      }
      console.error('Unknown error creating achievement:', error);
      throw new Error(`Failed to create achievement: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateAchievement(
    achievementId: string,
    data: { name?: string; description?: string; icon?: string; criteria?: any }
  ) {
    try {
      const existingAchievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!existingAchievement) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      if (data.name && data.name !== existingAchievement.name) {
        const achievementExists = await prisma.achievement.findUnique({
          where: { name: data.name },
        });
        if (achievementExists) {
          throw new Error(`Achievement name ${ErrorMessages.RESOURCE.ALREADY_EXISTS}`);
        }
      }

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

      const achievement = await prisma.achievement.update({
        where: { id: achievementId },
        data: updateData,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      return {
        ...achievement,
        userCount: achievement._count.users,
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
      if (
        error.message === ErrorMessages.RESOURCE.NOT_FOUND ||
        error.message?.includes(ErrorMessages.RESOURCE.ALREADY_EXISTS)
      ) {
        throw error;
      }
      throw new Error(`Failed to update achievement: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteAchievement(achievementId: string, force: boolean = false) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      if (!achievement) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      if (achievement._count.users > 0 && !force) {
        throw new Error(
          'Cannot delete achievement: Has users. Use force=true to force delete.'
        );
      }

      await prisma.achievement.delete({
        where: { id: achievementId },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
        if (error.code === 'P2003') {
          throw new Error('Cannot delete achievement: Has users');
        }
      }
      // Re-throw custom errors
      if (
        error.message === ErrorMessages.RESOURCE.NOT_FOUND ||
        error.message?.includes('Cannot delete achievement')
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getUserAchievements(userId: string) {
    try {
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              criteria: true,
            },
          },
        },
        orderBy: { unlockedAt: 'desc' },
      });

      return userAchievements.map((ua) => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        criteria: ua.achievement.criteria,
        unlockedAt: ua.unlockedAt,
      }));
    } catch (error: any) {
      throw error;
    }
  }

  async unlockAchievement(userId: string, achievementId: string) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId },
      });

      if (!achievement) {
        throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
      }

      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
        },
        include: {
          achievement: true,
        },
      });

      return userAchievement;
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error(ErrorMessages.RESOURCE.NOT_FOUND);
        }
        if (error.code === 'P2002') {
          const existing = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId,
                achievementId,
              },
            },
          });
          return existing;
        }
      }
      throw error;
    }
  }
}

export default new AchievementService();


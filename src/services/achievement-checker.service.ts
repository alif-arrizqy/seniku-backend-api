import prisma from '../config/database';
import achievementService from './achievement.service';
import notificationService from './notification.service';
import { NotificationType } from '@prisma/client';

/**
 * Service untuk check dan unlock achievement secara otomatis
 */
export class AchievementCheckerService {
  /**
   * Check dan unlock achievement setelah submission di-grade
   */
  async checkAndUnlockAchievements(userId: string) {
    try {
      // Get all achievements that user hasn't unlocked yet
      const allAchievements = await prisma.achievement.findMany({
        include: {
          users: {
            where: { userId },
          },
        },
      });

      // Filter achievements that user hasn't unlocked
      const unlockedAchievementIds = allAchievements
        .filter((a) => a.users.length > 0)
        .map((a) => a.id);

      const availableAchievements = await prisma.achievement.findMany({
        where: {
          id: {
            notIn: unlockedAchievementIds,
          },
        },
      });

      // Get user statistics for criteria checking
      const userStats = await this.getUserStatistics(userId);

      // Check each achievement
      const unlockedAchievements = [];
      for (const achievement of availableAchievements) {
        const shouldUnlock = this.checkCriteria(achievement.criteria as any, userStats);
        if (shouldUnlock) {
          try {
            const userAchievement = await achievementService.unlockAchievement(userId, achievement.id);
            unlockedAchievements.push(userAchievement);

            // Create notification
            await notificationService.createNotification({
              userId,
              type: NotificationType.ACHIEVEMENT_UNLOCKED,
              title: 'Achievement Terbuka!',
              message: `Selamat! Anda mendapatkan achievement "${achievement.name}"`,
              link: `/achievements/${achievement.id}`,
            });
          } catch (error: any) {
            // Log error but continue checking other achievements
            console.error(`Error unlocking achievement ${achievement.id}:`, error);
          }
        }
      }

      return unlockedAchievements;
    } catch (error: any) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get user statistics for criteria checking
   */
  private async getUserStatistics(userId: string) {
    const [submissions, assignments] = await Promise.all([
      prisma.submission.findMany({
        where: {
          studentId: userId,
          status: 'GRADED',
        },
        include: {
          assignment: {
            select: {
              categoryId: true,
            },
          },
        },
      }),
      prisma.assignment.findMany({
        where: {
          classes: {
            some: {
              class: {
                students: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const grades = submissions.map((s) => s.grade || 0).filter((g) => g > 0);
    const totalGraded = submissions.length;
    const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
    const categoryIds = submissions.map((s) => s.assignment.categoryId).filter((id) => id !== null);
    const uniqueCategories = [...new Set(categoryIds)];

    return {
      totalGradedSubmissions: totalGraded,
      averageGrade,
      highestGrade,
      totalAssignments: assignments.length,
      completedCategories: uniqueCategories.length,
      categoryIds: uniqueCategories,
      gradeCount: {
        A: grades.filter((g) => g >= 90).length,
        B: grades.filter((g) => g >= 80 && g < 90).length,
        C: grades.filter((g) => g >= 70 && g < 80).length,
      },
    };
  }

  /**
   * Check if criteria is met
   */
  private checkCriteria(criteria: any, stats: any): boolean {
    if (!criteria || typeof criteria !== 'object') {
      return false;
    }

    const { type, value, operator = '>=' } = criteria;

    switch (type) {
      case 'total_graded_submissions':
        return this.compare(stats.totalGradedSubmissions, value, operator);

      case 'average_grade':
        return this.compare(stats.averageGrade, value, operator);

      case 'highest_grade':
        return this.compare(stats.highestGrade, value, operator);

      case 'grade_count':
        const minGrade = criteria.minGrade || 90;
        const gradeCount = stats.gradeCount.A || 0;
        return this.compare(gradeCount, value, operator);

      case 'category_completion':
        const requiredCategories = criteria.categories || [];
        const completedCategories = stats.categoryIds || [];
        if (criteria.operator === 'all') {
          return requiredCategories.every((cat: string) => completedCategories.includes(cat));
        }
        return completedCategories.length >= value;

      default:
        return false;
    }
  }

  /**
   * Compare values based on operator
   */
  private compare(actual: number, target: number, operator: string): boolean {
    switch (operator) {
      case '>=':
        return actual >= target;
      case '<=':
        return actual <= target;
      case '>':
        return actual > target;
      case '<':
        return actual < target;
      case '==':
      case '===':
        return actual === target;
      default:
        return false;
    }
  }
}

export default new AchievementCheckerService();


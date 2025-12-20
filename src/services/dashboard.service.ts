import prisma from '../config/database';
import { UserRole } from '@prisma/client';
import { ErrorMessages } from '../constants/error-messages';

export class DashboardService {
  async getTeacherDashboard(teacherId: string) {
    // Get total students
    const totalStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        isActive: true,
      },
    });

    // Get total classes
    const totalClasses = await prisma.class.count();

    // Get active assignments
    const activeAssignments = await prisma.assignment.count({
      where: {
        status: 'ACTIVE',
        createdById: teacherId,
      },
    });

    // Get pending submissions
    const pendingSubmissions = await prisma.submission.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get graded submissions
    const gradedSubmissions = await prisma.submission.count({
      where: {
        status: 'GRADED',
      },
    });

    // Get average score
    const avgScoreResult = await prisma.submission.aggregate({
      where: {
        status: 'GRADED',
        grade: { not: null },
      },
      _avg: {
        grade: true,
      },
    });
    const averageScore = avgScoreResult._avg.grade || 0;

    // Get recent submissions (last 5)
    const recentSubmissions = await prisma.submission.findMany({
      where: {
        status: { in: ['PENDING', 'GRADED'] },
      },
      select: {
        id: true,
        grade: true,
        status: true,
        submittedAt: true,
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    // Get top students (by average score)
    const topStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nis: true,
        className: true,
        submissions: {
          where: {
            status: 'GRADED',
            grade: { not: null },
          },
          select: {
            grade: true,
          },
        },
      },
      take: 5,
    });

    // Calculate average score for each student
    const topStudentsWithScore = topStudents
      .map((student) => {
        const grades = student.submissions.map((s) => s.grade!).filter((g) => g !== null);
        const avgScore = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        return {
          id: student.id,
          name: student.name,
          nis: student.nis,
          className: student.className,
          avgScore: Math.round(avgScore * 10) / 10,
          portfolioCount: grades.length,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Get upcoming deadlines (next 5)
    const upcomingDeadlines = await prisma.assignment.findMany({
      where: {
        status: 'ACTIVE',
        deadline: { gte: new Date() },
        createdById: teacherId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
        classes: {
          include: {
            class: {
              include: {
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
    });

    const upcomingDeadlinesWithCount = upcomingDeadlines.map((assignment) => {
      const totalStudents = assignment.classes.reduce(
        (sum, ac) => sum + (ac.class._count.students || 0),
        0
      );
      return {
        id: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        submissionCount: assignment._count.submissions,
        totalStudents,
      };
    });

    return {
      role: 'TEACHER' as UserRole,
      statistics: {
        totalStudents,
        totalClasses,
        activeAssignments,
        pendingSubmissions,
        gradedSubmissions,
        averageScore: Math.round(averageScore * 10) / 10,
      },
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        studentName: s.student.name,
        studentNis: s.student.nis,
        assignmentTitle: s.assignment.title,
        grade: s.grade,
        status: s.status,
        submittedAt: s.submittedAt,
      })),
      topStudents: topStudentsWithScore,
      upcomingDeadlines: upcomingDeadlinesWithCount,
    };
  }

  async getStudentDashboard(studentId: string) {
    // Get portfolio count (graded submissions)
    const portfolioCount = await prisma.submission.count({
      where: {
        studentId,
        status: 'GRADED',
      },
    });

    // Get completed assignments (submissions with status GRADED)
    const completedAssignments = await prisma.submission.count({
      where: {
        studentId,
        status: 'GRADED',
      },
    });

    // Get total assignments (active assignments for student's class)
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        classId: true,
      },
    });

    if (!student || !student.classId) {
      throw new Error(ErrorMessages.RESOURCE.USER_NOT_FOUND);
    }

    const totalAssignments = await prisma.assignment.count({
      where: {
        status: 'ACTIVE',
        classes: {
          some: {
            classId: student.classId,
          },
        },
      },
    });

    // Get pending assignments (assignments without submission or with PENDING submission)
    const pendingAssignments = await prisma.assignment.findMany({
      where: {
        status: 'ACTIVE',
        classes: {
          some: {
            classId: student.classId,
          },
        },
        deadline: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        deadline: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        submissions: {
          where: {
            studentId,
          },
          select: {
            id: true,
            status: true,
          },
          take: 1,
        },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
    });

    const pendingAssignmentsWithProgress = pendingAssignments.map((assignment) => {
      const submission = assignment.submissions[0];
      const daysRemaining = Math.ceil(
        (new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline,
        category: assignment.category,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        mySubmission: submission
          ? {
              id: submission.id,
              status: submission.status,
            }
          : null,
      };
    });

    // Get average score
    const avgScoreResult = await prisma.submission.aggregate({
      where: {
        studentId,
        status: 'GRADED',
        grade: { not: null },
      },
      _avg: {
        grade: true,
      },
    });
    const averageScore = avgScoreResult._avg.grade || 0;

    // Get highest score
    const highestScoreResult = await prisma.submission.findFirst({
      where: {
        studentId,
        status: 'GRADED',
        grade: { not: null },
      },
      orderBy: { grade: 'desc' },
      select: {
        grade: true,
      },
    });
    const highestScore = highestScoreResult?.grade || 0;

    // Get total submissions
    const totalSubmissions = await prisma.submission.count({
      where: {
        studentId,
      },
    });

    // Get recent works (last 5 graded submissions)
    const recentWorks = await prisma.submission.findMany({
      where: {
        studentId,
        status: 'GRADED',
      },
      select: {
        id: true,
        title: true,
        grade: true,
        status: true,
        submittedAt: true,
        assignment: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    const recentWorksFormatted = recentWorks.map((work) => ({
      id: work.id,
      title: work.title,
      category: work.assignment.category?.name || 'Unknown',
      grade: work.grade,
      status: work.status,
      submittedAt: work.submittedAt,
    }));

    // Get achievements (placeholder - will be implemented later)
    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId: studentId,
      },
      select: {
        id: true,
        unlockedAt: true,
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
    });

    const achievementsFormatted = achievements.map((ua) => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      unlockedAt: ua.unlockedAt,
    }));

    return {
      role: 'STUDENT' as UserRole,
      statistics: {
        portfolioCount,
        completedAssignments,
        totalAssignments,
        pendingAssignments: pendingAssignments.length,
        averageScore: Math.round(averageScore * 10) / 10,
        highestScore,
        totalSubmissions,
      },
      recentWorks: recentWorksFormatted,
      pendingAssignments: pendingAssignmentsWithProgress,
      achievements: achievementsFormatted,
    };
  }
}

export default new DashboardService();


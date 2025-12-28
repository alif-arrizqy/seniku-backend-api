import prisma from '../src/config/database';
import { UserRole, AssignmentStatus, SubmissionStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Create Classes
  console.log('📚 Creating classes...');
  const classes = await Promise.all([
    prisma.class.upsert({
      where: { name: '1A' },
      update: {},
      create: { name: '1A', description: null },
    }),
    prisma.class.upsert({
      where: { name: '1B' },
      update: {},
      create: { name: '1B', description: null },
    }),
    prisma.class.upsert({
      where: { name: '1C' },
      update: {},
      create: { name: '1C', description: null },
    }),
    prisma.class.upsert({
      where: { name: '2A' },
      update: {},
      create: { name: '2A', description: null },
    }),
    prisma.class.upsert({
      where: { name: '2B' },
      update: {},
      create: { name: '2B', description: null },
    }),
    prisma.class.upsert({
      where: { name: '2C' },
      update: {},
      create: { name: '2C', description: null },
    }),
  ]);

  console.log(`✅ Created ${classes.length} classes`);

  // Create Teachers
  console.log('👨‍🏫 Creating teachers...');
  const teachers = await Promise.all([
    prisma.user.upsert({
      where: { nip: '918291812121' },
      update: {},
      create: {
        nip: '918291812121',
        nis: null,
        email: null,
        password: hashedPassword,
        name: 'Budi Arie',
        role: UserRole.TEACHER,
        phone: '081234567890',
        address: 'Jl. Sudirman No. 1',
        birthdate: new Date('1990-01-01'),
        avatar: null,
        className: null,
        classId: null,
        isActive: true,
        createdAt: new Date('2021-01-01'),
        updatedAt: new Date('2021-01-01'),
      },
    }),
    prisma.user.upsert({
      where: { nip: '918219212' },
      update: {},
      create: {
        nip: '918219212',
        nis: null,
        email: null,
        password: hashedPassword,
        name: 'Wanda Oke',
        role: UserRole.TEACHER,
        phone: '081234567890',
        address: 'Jl. Sudirman No. 1',
        birthdate: new Date('1990-01-01'),
        avatar: null,
        className: null,
        classId: null,
        isActive: true,
        createdAt: new Date('2021-01-01'),
        updatedAt: new Date('2021-01-01'),
      },
    }),
  ]);

  console.log(`✅ Created ${teachers.length} teachers`);

  // Create Students (10 per class)
  console.log('👨‍🎓 Creating students...');
  const studentNames = [
    'Wahyu Dwi',
    'Ahmad Fauzi',
    'Siti Nurhaliza',
    'Budi Santoso',
    'Dewi Lestari',
    'Eko Prasetyo',
    'Fitri Handayani',
    'Gunawan Wijaya',
    'Hani Kartika',
    'Indra Permana',
  ];

  const students: any[] = [];
  let nisCounter = 2025123456789;

  for (const classData of classes) {
    for (let i = 0; i < 10; i++) {
      const studentName = studentNames[i];
      const nis = nisCounter.toString();
      nisCounter++;

      const student = await prisma.user.upsert({
        where: { nis },
        update: {},
        create: {
          nip: null,
          nis,
          email: null,
          password: hashedPassword,
          name: studentName,
          role: UserRole.STUDENT,
          phone: '081234567890',
          address: 'Jl. Sudirman No. 1',
          birthdate: new Date('2000-01-01'),
          avatar: null,
          className: classData.name,
          classId: classData.id,
          isActive: true,
          createdAt: new Date('2021-01-01'),
          updatedAt: new Date('2021-01-01'),
        },
      });

      students.push(student);
    }
  }

  console.log(`✅ Created ${students.length} students`);

  // Category
  const categoryData = [
    {
      'name': 'Lukisan',
      'description': '',
      'icon': '🎨',
      'isActive': true,
    },
    {
      'name': 'Digital Art',
      'description': '',
      'icon': '🖼️',
      'isActive': true,
    },
    {
      'name': 'Seni Rupa',
      'description': '',
      'icon': '📍',
      'isActive': true,
    },
  ];

  const categories = await Promise.all(categoryData.map(async (category) => {
    return await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }));

  console.log(`✅ Created ${categories.length} categories`);

  // Create Achievements
  console.log('🏆 Creating achievements...');
  const achievementData = [
    {
      name: 'Pemula Seni',
      description: 'Menyelesaikan tugas pertama dengan baik',
      icon: '🎨',
      criteria: {
        type: 'total_graded_submissions',
        value: 1,
        operator: '>=',
      },
    },
    {
      name: 'Pelukis Berbakat',
      description: 'Menyelesaikan 5 tugas yang sudah dinilai',
      icon: '🖌️',
      criteria: {
        type: 'total_graded_submissions',
        value: 5,
        operator: '>=',
      },
    },
    {
      name: 'Seniman Handal',
      description: 'Menyelesaikan 10 tugas yang sudah dinilai',
      icon: '🎭',
      criteria: {
        type: 'total_graded_submissions',
        value: 10,
        operator: '>=',
      },
    },
    {
      name: 'Bintang Kelas',
      description: 'Mendapatkan nilai rata-rata minimal 85',
      icon: '⭐',
      criteria: {
        type: 'average_grade',
        value: 85,
        operator: '>=',
      },
    },
    {
      name: 'Juara Sekolah',
      description: 'Mendapatkan nilai tertinggi 95 atau lebih',
      icon: '🥇',
      criteria: {
        type: 'highest_grade',
        value: 95,
        operator: '>=',
      },
    },
    {
      name: 'Semua Kategori',
      description: 'Menyelesaikan tugas dari semua kategori',
      icon: '🎪',
      criteria: {
        type: 'category_completion',
        value: 3,
        operator: '>=',
      },
    },
    {
      name: 'Sempurna',
      description: 'Mendapatkan nilai A (90+) sebanyak 3 kali',
      icon: '💯',
      criteria: {
        type: 'grade_count',
        value: 3,
        operator: '>=',
      },
    },
  ];

  const achievements = await Promise.all(
    achievementData.map(async (achievement) => {
      return await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: {},
        create: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          criteria: achievement.criteria,
        },
      });
    })
  );

  console.log(`✅ Created ${achievements.length} achievements`);

  // Create Assignments
  console.log('📝 Creating assignments...');
  const now = new Date();
  type AssignmentData = {
    title: string;
    description: string;
    categoryId: string;
    deadline: Date;
    status: AssignmentStatus;
    createdById: string;
    classIds: string[];
  };
  
  const assignmentData: AssignmentData[] = [
    {
      title: 'Lukisan Pemandangan Alam',
      description: 'Buatlah lukisan pemandangan alam menggunakan cat air. Pilih tema gunung, pantai, atau hutan.',
      categoryId: categories[0].id, // Lukisan
      deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: AssignmentStatus.ACTIVE,
      createdById: teachers[0].id,
      classIds: [classes[0].id, classes[1].id], // 1A, 1B
    },
    {
      title: 'Digital Art: Karakter Fantasi',
      description: 'Buatlah karakter fantasi menggunakan software digital art (Photoshop, Procreate, dll).',
      categoryId: categories[1].id, // Digital Art
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: AssignmentStatus.ACTIVE,
      createdById: teachers[0].id,
      classIds: [classes[2].id, classes[3].id], // 1C, 2A
    },
    {
      title: 'Karya Seni Rupa 3D',
      description: 'Buatlah karya seni rupa 3D menggunakan bahan bekas. Foto dan unggah hasil karyanya.',
      categoryId: categories[2].id, // Seni Rupa
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: AssignmentStatus.ACTIVE,
      createdById: teachers[1].id,
      classIds: [classes[0].id, classes[3].id], // 1A, 2A
    },
    {
      title: 'Lukisan Abstrak Modern',
      description: 'Buatlah lukisan abstrak dengan tema modern menggunakan teknik bebas.',
      categoryId: categories[0].id, // Lukisan
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (completed)
      status: AssignmentStatus.COMPLETED,
      createdById: teachers[0].id,
      classIds: [classes[1].id], // 1B
    },
    {
      title: 'Digital Art: Poster Event',
      description: 'Buatlah poster untuk event sekolah menggunakan digital art.',
      categoryId: categories[1].id, // Digital Art
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: AssignmentStatus.DRAFT,
      createdById: teachers[1].id,
      classIds: [classes[4].id, classes[5].id], // 2B, 2C
    },
  ];

  const assignments: Array<{
    id: string;
    title: string;
    createdAt: Date;
    categoryId: string;
    deadline: Date;
    status: AssignmentStatus;
    createdById: string;
  }> = [];
  for (const assignmentInfo of assignmentData) {
    const assignment = await prisma.assignment.create({
      data: {
        title: assignmentInfo.title,
        description: assignmentInfo.description,
        categoryId: assignmentInfo.categoryId,
        deadline: assignmentInfo.deadline,
        status: assignmentInfo.status,
        createdById: assignmentInfo.createdById,
        classes: {
          create: assignmentInfo.classIds.map((classId) => ({
            classId,
          })),
        },
      },
    });
    assignments.push(assignment);
  }

  console.log(`✅ Created ${assignments.length} assignments`);

  // Create Submissions with various statuses
  console.log('📤 Creating submissions...');
  let submissionCount = 0;

  // For each assignment, create submissions for some students
  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { assignmentId: assignment.id },
      include: { class: true },
    });

    // Get all students in classes assigned to this assignment
    const eligibleStudents: Array<{
      id: string;
      name: string;
      classId: string | null;
    }> = [];
    for (const ac of assignmentClasses) {
      const classStudents = students.filter((s) => s.classId === ac.classId);
      eligibleStudents.push(...classStudents);
    }

    // Create submissions for 60% of eligible students (to have variety)
    const studentsToSubmit = eligibleStudents.slice(0, Math.floor(eligibleStudents.length * 0.6));

    for (let j = 0; j < studentsToSubmit.length; j++) {
      const student = studentsToSubmit[j];
      let status: SubmissionStatus;
      let grade: number | null = null;
      let submittedAt: Date | null = null;
      let gradedAt: Date | null = null;
      let feedback: string | null = null;

      // Distribute statuses: 30% GRADED, 20% PENDING, 10% REVISION, 40% NOT_SUBMITTED
      const statusRand = j % 10;
      if (statusRand < 3) {
        // 30% GRADED
        status = SubmissionStatus.GRADED;
        grade = 70 + Math.floor(Math.random() * 30); // Random grade 70-100
        submittedAt = new Date(assignment.createdAt.getTime() + Math.random() * (now.getTime() - assignment.createdAt.getTime()));
        gradedAt = new Date(submittedAt.getTime() + Math.random() * (now.getTime() - submittedAt.getTime()));
        feedback = grade >= 85
          ? 'Karya yang sangat bagus! Kreativitas dan teknik yang ditunjukkan sangat memuaskan.'
          : grade >= 75
          ? 'Karya bagus, ada beberapa aspek yang bisa ditingkatkan lagi.'
          : 'Perlu lebih banyak latihan dan perbaikan pada teknik dasar.';
      } else if (statusRand < 5) {
        // 20% PENDING
        status = SubmissionStatus.PENDING;
        submittedAt = new Date(assignment.createdAt.getTime() + Math.random() * (now.getTime() - assignment.createdAt.getTime()));
      } else if (statusRand < 6) {
        // 10% REVISION
        status = SubmissionStatus.REVISION;
        submittedAt = new Date(assignment.createdAt.getTime() + Math.random() * (now.getTime() - assignment.createdAt.getTime()));
        feedback = 'Perlu revisi pada beberapa bagian. Silakan perbaiki dan kirim ulang.';
      } else {
        // 40% NOT_SUBMITTED
        status = SubmissionStatus.NOT_SUBMITTED;
      }

      if (status !== SubmissionStatus.NOT_SUBMITTED) {
        // Generate random image URLs from Picsum Photos
        // Using different random seeds to get different images for each submission
        const randomSeed = Math.floor(Math.random() * 1000);
        const imageUrl = `https://picsum.photos/800/600?random=${randomSeed}`;
        const imageThumbnail = `https://picsum.photos/300/300?random=${randomSeed}`;
        const imageMedium = `https://picsum.photos/800/600?random=${randomSeed}`;

        const submission = await prisma.submission.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            title: `${assignment.title} - ${student.name}`,
            description: 'Ini adalah submission untuk tugas ini.',
            imageUrl,
            imageThumbnail,
            imageMedium,
            status,
            grade,
            feedback,
            submittedAt,
            gradedAt,
            revisionCount: status === SubmissionStatus.REVISION ? 1 : 0,
          },
        });

        // Create initial version in SubmissionRevision (version 1)
        // This matches the behavior in createSubmission() service
        // Note: Prisma client needs to be regenerated after schema changes
        await prisma.submissionRevision.create({
          data: {
            submissionId: submission.id,
            // revisionNote is optional (nullable), omit it for initial submission
            imageUrl: imageUrl,
            version: 1,
            submittedAt: submittedAt || submission.createdAt,
          } as any, // Type assertion needed until Prisma client is regenerated
        });

        // If status is REVISION, create a revision record with the revision note
        if (status === SubmissionStatus.REVISION && feedback) {
          await prisma.submissionRevision.create({
            data: {
              submissionId: submission.id,
              revisionNote: feedback, // Use feedback as revision note
              imageUrl: imageUrl, // Same image, but this is the version that was returned for revision
              version: 2, // Version 2 is the revision
              submittedAt: new Date(submittedAt!.getTime() + 1000), // Slightly after submission
            } as any, // Type assertion needed until Prisma client is regenerated
          });
        }

        submissionCount++;
      }
    }
  }

  console.log(`✅ Created ${submissionCount} submissions`);

  // Create UserAchievements (for students who meet criteria)
  console.log('🎖️ Creating user achievements...');
  let userAchievementCount = 0;

  // Award "Pemula Seni" to students with at least 1 graded submission
  const studentsWithSubmissions = await prisma.user.findMany({
    where: {
      role: UserRole.STUDENT,
      submissions: {
        some: {
          status: SubmissionStatus.GRADED,
        },
      },
    },
    take: 20, // Award to first 20 students
  });

  const pemulaAchievement = achievements.find((a) => a.name === 'Pemula Seni');
  if (pemulaAchievement) {
    // Use createMany with skipDuplicates to avoid unique constraint errors
    const userAchievementData = studentsWithSubmissions.map((student) => ({
      userId: student.id,
      achievementId: pemulaAchievement.id,
    }));

    try {
      const result = await prisma.userAchievement.createMany({
        data: userAchievementData,
        skipDuplicates: true, // Skip if already exists
      });
      userAchievementCount = result.count;
    } catch (error) {
      // Log error but continue
      console.error('Error creating user achievements:', error);
    }
  }

  console.log(`✅ Created ${userAchievementCount} user achievements`);

  // Create Notifications
  console.log('🔔 Creating notifications...');
  let notificationCount = 0;

  // Create assignment created notifications for some students
  for (const assignment of assignments.slice(0, 2)) {
    // Get students assigned to this assignment
    const assignmentClasses = await prisma.assignmentClass.findMany({
      where: { assignmentId: assignment.id },
    });
    const classIds = assignmentClasses.map((ac) => ac.classId);
    const eligibleStudents = students.filter((s) => classIds.includes(s.classId));

    for (const student of eligibleStudents.slice(0, 5)) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: NotificationType.ASSIGNMENT_CREATED,
          title: 'Tugas Baru!',
          message: `Tugas baru: "${assignment.title}" telah dibuat. Jangan lupa dikerjakan sebelum ${assignment.deadline.toLocaleDateString('id-ID')}`,
          link: `/assignments/${assignment.id}`,
          isRead: false,
        },
      });
      notificationCount++;
    }
  }

  // Create submission graded notifications
  const gradedSubmissions = await prisma.submission.findMany({
    where: {
      status: SubmissionStatus.GRADED,
    },
    include: {
      assignment: true,
    },
    take: 10,
  });

  for (const submission of gradedSubmissions) {
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        type: NotificationType.SUBMISSION_GRADED,
        title: 'Submission Dinilai!',
        message: `Submission Anda untuk "${submission.assignment.title}" telah dinilai. Nilai: ${submission.grade}`,
        link: `/submissions/${submission.id}`,
        isRead: Math.random() > 0.5, // Random read/unread
      },
    });
    notificationCount++;
  }

  console.log(`✅ Created ${notificationCount} notifications`);

  // Seed Summary
  console.log('\n📊 Seed Summary:');
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Achievements: ${achievements.length}`);
  console.log(`   - Assignments: ${assignments.length}`);
  console.log(`   - Submissions: ${submissionCount}`);
  console.log(`   - User Achievements: ${userAchievementCount}`);
  console.log(`   - Notifications: ${notificationCount}`);
  console.log('\n✅ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


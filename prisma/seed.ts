import prisma from '../src/config/database';
import { UserRole } from '@prisma/client';
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



  console.log('\n📊 Seed Summary:');
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Categories: ${categories.length}`);
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


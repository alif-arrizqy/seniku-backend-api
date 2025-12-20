# Database Schema - Seniku Backend API

## Tech Stack
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Framework**: Fastify
- **Language**: TypeScript
- **Logging**: Pino

## Entity Relationship Diagram (ERD)

```
Users (Teachers & Students)
  ├── Classes (Many-to-One)
  ├── Assignments (One-to-Many, created_by)
  ├── Submissions (One-to-Many, student_id)
  ├── Notifications (One-to-Many)
  └── Achievements (Many-to-Many)

Assignments
  ├── Users (Many-to-One, created_by)
  ├── Category (Many-to-One)
  ├── Submissions (One-to-Many)
  └── Classes (Many-to-Many)

Submissions
  ├── Users (Many-to-One, student_id)
  ├── Assignments (Many-to-One)
  └── SubmissionRevisions (One-to-Many)

Classes
  └── Users (One-to-Many)

Categories
  └── Assignments (One-to-Many)

Notifications
  └── Users (Many-to-One)

Achievements
  └── Users (Many-to-Many)
```

## Database Tables

### 1. Users
Tabel untuk menyimpan data pengguna (Guru dan Siswa).

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique // Optional, bisa null untuk student yang hanya pakai NIS
  nip           String?   @unique // Nomor Induk Pegawai, untuk TEACHER, unique
  nis           String?   @unique // Nomor Induk Siswa, hanya untuk STUDENT, unique
  password      String    // hashed password
  name          String
  role          UserRole  @default(STUDENT)
  phone         String?
  address       String?
  bio           String?
  birthdate     DateTime? @db.Date
  avatar        String?   // URL to avatar image
  className     String?   @map("class_name") // Only for students
  classId       String?   @map("class_id") // Foreign key to Class
  isActive      Boolean   @default(true) @map("is_active")
  tokenVersion  Int       @default(0) @map("token_version") // Untuk invalidate refresh tokens
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  class         Class?            @relation(fields: [classId], references: [id])
  createdAssignments Assignment[]  @relation("AssignmentCreator")
  submissions   Submission[]
  notifications Notification[]
  achievements  UserAchievement[]

  @@index([email])
  @@index([nip])
  @@index([nis])
  @@index([role])
  @@index([classId])
  @@map("users")
  
  // Constraint: Student harus punya NIS atau email (minimal salah satu)
  // Constraint: NIS hanya untuk STUDENT
  // Constraint: NIP hanya untuk TEACHER
}
```

### 2. Classes
Tabel untuk menyimpan data kelas.

```prisma
model Class {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., "XII IPA 1"
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  students    User[]
  assignments AssignmentClass[]

  @@index([name])
  @@map("classes")
}
```

### 3. Categories
Tabel untuk menyimpan kategori tugas/karya seni.

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  icon        String?  // Optional icon/emoji untuk category
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  assignments Assignment[]

  @@index([name])
  @@index([isActive])
  @@map("categories")
}
```

### 4. Assignments
Tabel untuk menyimpan data tugas yang dibuat oleh guru.

```prisma
model Assignment {
  id          String            @id @default(uuid())
  title       String
  description String
  categoryId  String            @map("category_id") // Foreign key to Category
  deadline    DateTime
  status      AssignmentStatus @default(DRAFT)
  createdById String            @map("created_by_id")
  createdAt   DateTime          @default(now()) @map("created_at")
  updatedAt   DateTime          @updatedAt @map("updated_at")

  // Relations
  createdBy   User              @relation("AssignmentCreator", fields: [createdById], references: [id])
  category    Category          @relation(fields: [categoryId], references: [id])
  submissions Submission[]
  classes     AssignmentClass[]

  @@index([createdById])
  @@index([status])
  @@index([deadline])
  @@index([categoryId])
  @@map("assignments")
}
```

### 5. AssignmentClass
Junction table untuk many-to-many relationship antara Assignment dan Class.

```prisma
model AssignmentClass {
  id           String     @id @default(uuid())
  assignmentId String     @map("assignment_id")
  classId      String     @map("class_id")
  createdAt    DateTime   @default(now()) @map("created_at")

  // Relations
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  class        Class      @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, classId])
  @@index([assignmentId])
  @@index([classId])
  @@map("assignment_classes")
}
```

### 6. Submissions
Tabel untuk menyimpan data pengumpulan tugas dari siswa.

```prisma
model Submission {
  id            String            @id @default(uuid())
  assignmentId String             @map("assignment_id")
  studentId     String             @map("student_id")
  title         String            // Judul karya
  description   String?           // Catatan dari siswa
  imageUrl      String             @map("image_url") // URL to full resolution artwork image (min 1200x800px untuk zoom)
  imageThumbnail String?           @map("image_thumbnail") // URL to thumbnail (300x300px) - Optional, untuk optimasi
  imageMedium    String?           @map("image_medium") // URL to medium size (800x600px) - Optional, untuk optimasi
  status        SubmissionStatus  @default(NOT_SUBMITTED)
  grade         Int?              // Nilai 0-100 (number, bukan string)
  feedback      String?           // Feedback dari guru
  revisionCount Int               @default(0) @map("revision_count")
  submittedAt   DateTime?         @map("submitted_at")
  gradedAt      DateTime?         @map("graded_at")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  // Relations
  assignment    Assignment         @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student       User               @relation(fields: [studentId], references: [id], onDelete: Cascade)
  revisions     SubmissionRevision[]

  @@unique([assignmentId, studentId]) // One submission per student per assignment
  @@index([assignmentId])
  @@index([studentId])
  @@index([status])
  @@index([submittedAt])
  @@map("submissions")
}
```

### 7. SubmissionRevision
Tabel untuk menyimpan history revisi submission.

```prisma
model SubmissionRevision {
  id           String   @id @default(uuid())
  submissionId String   @map("submission_id")
  revisionNote String   @map("revision_note") // Catatan revisi dari guru
  imageUrl     String   @map("image_url") // URL to revised artwork
  submittedAt  DateTime @default(now()) @map("submitted_at")

  // Relations
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@map("submission_revisions")
}
```

### 8. Notifications
Tabel untuk menyimpan notifikasi untuk pengguna.

```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  message   String
  link      String?          // URL to related resource
  isRead    Boolean          @default(false) @map("is_read")
  createdAt DateTime         @default(now()) @map("created_at")

  // Relations
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### 9. Achievements
Tabel untuk menyimpan data achievement/badge.

```prisma
model Achievement {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  icon        String   // Emoji or icon URL (required)
  criteria    Json?    // Criteria untuk unlock achievement (optional)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  users       UserAchievement[]

  @@index([name])
  @@map("achievements")
}
```

### 10. UserAchievement
Junction table untuk many-to-many relationship antara User dan Achievement.

```prisma
model UserAchievement {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  achievementId String      @map("achievement_id")
  unlockedAt    DateTime    @default(now()) @map("unlocked_at")

  // Relations
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@map("user_achievements")
}
```

## Enums

```prisma
enum UserRole {
  TEACHER
  STUDENT
  ADMIN // Optional, for future use
}

enum AssignmentStatus {
  DRAFT
  ACTIVE
  COMPLETED
}

enum SubmissionStatus {
  NOT_SUBMITTED
  PENDING
  REVISION
  GRADED
}

enum NotificationType {
  ASSIGNMENT_CREATED
  ASSIGNMENT_DEADLINE
  SUBMISSION_GRADED
  SUBMISSION_REVISION
  ACHIEVEMENT_UNLOCKED
  GENERAL
}
```

## Indexes

### Performance Optimization
- Index pada `email`, `nip`, `nis` di User untuk fast lookup
- Index pada `role` di User untuk filtering
- Index pada `status` di Assignment dan Submission
- Index pada `deadline` di Assignment untuk query tugas yang akan berakhir
- Index pada `submittedAt` di Submission untuk sorting
- Index pada `isRead` dan `createdAt` di Notification untuk unread count
- Index pada `name` dan `isActive` di Category untuk filtering

## Constraints

1. **Unique Constraints**:
   - Email harus unique
   - NIP harus unique (untuk TEACHER)
   - NIS harus unique (untuk STUDENT)
   - Class name harus unique
   - Category name harus unique
   - Achievement name harus unique
   - One submission per student per assignment
   - One user achievement per achievement (user tidak bisa unlock achievement yang sama dua kali)

2. **Foreign Key Constraints**:
   - Cascade delete untuk menjaga data integrity
   - Submission akan dihapus jika Assignment dihapus
   - SubmissionRevision akan dihapus jika Submission dihapus
   - Notification akan dihapus jika User dihapus
   - UserAchievement akan dihapus jika User atau Achievement dihapus
   - AssignmentClass akan dihapus jika Assignment atau Class dihapus
   - Assignment harus memiliki Category yang valid

## Additional Considerations

### Database Naming Convention
- Semua table names menggunakan snake_case di database (dengan `@@map`)
- Field names menggunakan camelCase di Prisma model, tetapi snake_case di database (dengan `@map`)
- Contoh: `createdAt` di model → `created_at` di database

### File Storage
- Image files (artwork, avatar) disimpan di cloud storage (S3, MinIO, Cloudinary, dll)
- Simpan URL di database, bukan file binary
- Image processing: thumbnail (300x300px), medium (800x600px), full resolution (min 1200x800px)

### Soft Delete (Optional)
- Tambahkan field `deletedAt` untuk soft delete jika diperlukan
- Berguna untuk audit trail

### Audit Trail (Optional)
- Tambahkan table `AuditLog` untuk tracking perubahan data
- Berguna untuk compliance dan debugging


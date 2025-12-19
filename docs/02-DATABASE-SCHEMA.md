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
  ├── Submissions (One-to-Many)
  └── Classes (Many-to-Many)

Submissions
  ├── Users (Many-to-One, student_id)
  ├── Assignments (Many-to-One)
  └── SubmissionRevisions (One-to-Many)

Classes
  └── Users (One-to-Many)

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
  nis           String?   @unique // Nomor Induk Siswa, hanya untuk STUDENT, unique
  password      String    // hashed password
  name          String
  role          UserRole  @default(STUDENT)
  phone         String?
  address       String?
  bio           String?
  birthdate     DateTime?
  avatar        String?   // URL to avatar image
  className     String?   // Only for students
  classId       String?   // Foreign key to Class
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  class         Class?            @relation(fields: [classId], references: [id])
  createdAssignments Assignment[]  @relation("AssignmentCreator")
  submissions   Submission[]
  notifications Notification[]
  achievements  UserAchievement[]

  @@index([email])
  @@index([nis])
  @@index([role])
  @@index([classId])
  
  // Constraint: Student harus punya NIS atau email (minimal salah satu)
  // Constraint: NIS hanya untuk STUDENT
}
```

### 2. Classes
Tabel untuk menyimpan data kelas.

```prisma
model Class {
  id          String   @id @default(uuid())
  name        String   @unique // e.g., "XII IPA 1"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  students    User[]
  assignments AssignmentClass[]

  @@index([name])
}
```

### 3. Assignments
Tabel untuk menyimpan data tugas yang dibuat oleh guru.

```prisma
model Assignment {
  id          String            @id @default(uuid())
  title       String
  description String
  category    String            // Kategori karya: Lukisan, Sketsa, Kolase, Digital, Patung, Fotografi, Desain, dll
  deadline    DateTime
  status      AssignmentStatus @default(DRAFT)
  createdById String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  // Relations
  createdBy   User              @relation("AssignmentCreator", fields: [createdById], references: [id])
  submissions Submission[]
  classes     AssignmentClass[]

  @@index([createdById])
  @@index([status])
  @@index([deadline])
  @@index([category])
}
```

### 4. AssignmentClass
Junction table untuk many-to-many relationship antara Assignment dan Class.

```prisma
model AssignmentClass {
  id           String     @id @default(uuid())
  assignmentId String
  classId      String
  createdAt    DateTime   @default(now())

  // Relations
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  class        Class      @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, classId])
  @@index([assignmentId])
  @@index([classId])
}
```

### 5. Submissions
Tabel untuk menyimpan data pengumpulan tugas dari siswa.

```prisma
model Submission {
  id            String            @id @default(uuid())
  assignmentId String
  studentId     String
  title         String            // Judul karya
  description   String?           // Catatan dari siswa
  imageUrl      String            // URL to full resolution artwork image (min 1200x800px untuk zoom)
  imageThumbnail String?          // URL to thumbnail (300x300px) - Optional, untuk optimasi
  imageMedium    String?          // URL to medium size (800x600px) - Optional, untuk optimasi
  status        SubmissionStatus  @default(NOT_SUBMITTED)
  grade         Int?              // Nilai 0-100 (number, bukan string)
  feedback      String?           // Feedback dari guru
  revisionCount Int               @default(0)
  submittedAt   DateTime?
  gradedAt      DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // Relations
  assignment    Assignment         @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  student       User               @relation(fields: [studentId], references: [id], onDelete: Cascade)
  revisions     SubmissionRevision[]

  @@unique([assignmentId, studentId]) // One submission per student per assignment
  @@index([assignmentId])
  @@index([studentId])
  @@index([status])
  @@index([submittedAt])
}
```

### 6. SubmissionRevision
Tabel untuk menyimpan history revisi submission.

```prisma
model SubmissionRevision {
  id           String   @id @default(uuid())
  submissionId String
  revisionNote String   // Catatan revisi dari guru
  imageUrl     String   // URL to revised artwork
  submittedAt  DateTime @default(now())

  // Relations
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId])
}
```

### 7. Notifications
Tabel untuk menyimpan notifikasi untuk pengguna.

```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  link      String?          // URL to related resource
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  // Relations
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

### 8. Achievements
Tabel untuk menyimpan data achievement/badge.

```prisma
model Achievement {
  id          String   @id @default(uuid())
  name        String   @unique
  description String
  icon        String   // Emoji or icon URL
  criteria    Json?    // Criteria untuk unlock achievement (optional)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       UserAchievement[]

  @@index([name])
}
```

### 9. UserAchievement
Junction table untuk many-to-many relationship antara User dan Achievement.

```prisma
model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  achievementId String
  unlockedAt    DateTime    @default(now())

  // Relations
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
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
- Index pada `email` di User untuk fast lookup
- Index pada `role` di User untuk filtering
- Index pada `status` di Assignment dan Submission
- Index pada `deadline` di Assignment untuk query tugas yang akan berakhir
- Index pada `submittedAt` di Submission untuk sorting
- Index pada `isRead` dan `createdAt` di Notification untuk unread count

## Constraints

1. **Unique Constraints**:
   - Email harus unique
   - Class name harus unique
   - One submission per student per assignment
   - One user achievement per achievement

2. **Foreign Key Constraints**:
   - Cascade delete untuk menjaga data integrity
   - Submission akan dihapus jika Assignment dihapus
   - Notification akan dihapus jika User dihapus

## Additional Considerations

### File Storage
- Image files (artwork, avatar) disimpan di cloud storage (S3, Cloudinary, dll)
- Simpan URL di database, bukan file binary

### Soft Delete (Optional)
- Tambahkan field `deletedAt` untuk soft delete jika diperlukan
- Berguna untuk audit trail

### Audit Trail (Optional)
- Tambahkan table `AuditLog` untuk tracking perubahan data
- Berguna untuk compliance dan debugging


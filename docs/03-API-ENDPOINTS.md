# API Endpoints - Seniku Backend API

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Sistem menggunakan **Session-based Authentication** (bukan JWT). Setelah login berhasil, session akan disimpan di server dan cookie akan dikirim ke client.

**Semua endpoint (kecuali auth) memerlukan session cookie:**
- Cookie akan otomatis dikirim oleh browser
- Session akan diverifikasi di server
- Jika session tidak valid atau expired, akan return 401 Unauthorized

---

## 1. Authentication Endpoints

### 1.1 Register
**POST** `/auth/register`

**Body:**
```json
{
  "email": "student@mail.com",  // Optional untuk STUDENT, required untuk TEACHER
  "nis": "12345",               // Required untuk STUDENT, unique
  "password": "password123",
  "name": "Rina Dewi",
  "role": "STUDENT",
  "phone": "081234567890",
  "classId": "uuid"             // Required untuk STUDENT
}
```

**Validation:**
- Untuk `STUDENT`: `nis` required dan unique, `email` optional
- Untuk `TEACHER`: `email` required dan unique, `nis` tidak digunakan
- `password`: minimum 3 karakter
- `name`: required

**Response Success (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@mail.com",
      "nis": "12345",
      "name": "Rina Dewi",
      "role": "STUDENT",
      "className": "XII IPA 1",
      "class": {
        "id": "uuid",
        "name": "XII IPA 1"
      }
    }
  }
}
```

**Response Error - NIS Already Exists (409):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "nis": "NIS already exists"
  }
}
```

**Response Error - Email Already Exists (409):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Email already exists"
  }
}
```

**Response Error - Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "nis": "NIS is required for STUDENT",
    "password": "Password must be at least 8 characters",
    "classId": "Class ID is required for STUDENT"
  }
}
```

---

### 1.2 Login
**POST** `/auth/login`

**Body:**
```json
{
  "identifier": "student@mail.com",  // Bisa email atau NIS
  "password": "password123"
}
```

**Login Logic:**
1. Jika `identifier` adalah email format → cari user by email
2. Jika `identifier` bukan email format → cari user by NIS (hanya untuk STUDENT)
3. Verify password
4. Create session dan set cookie

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@mail.com",
      "nis": "12345",
      "name": "Rina Dewi",
      "role": "STUDENT",
      "className": "XII IPA 1",
      "class": {
        "id": "uuid",
        "name": "XII IPA 1"
      },
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

**Response Error - Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response Error - User Not Found (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 1.3 Logout
**POST** `/auth/logout`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 1.4 Get Current Session
**GET** `/auth/me`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@mail.com",
      "nis": "12345",
      "name": "Rina Dewi",
      "role": "STUDENT",
      "className": "XII IPA 1",
      "class": {
        "id": "uuid",
        "name": "XII IPA 1"
      }
    }
  }
}
```

**Response Error - Unauthorized (401):**
```json
{
  "success": false,
  "message": "Unauthorized: Session expired or invalid"
}
```

---

## 2. User Endpoints

### 2.1 Get Current User Profile
**GET** `/users/me`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@mail.com",
    "nis": "12345",
    "name": "Rina Dewi",
    "role": "STUDENT",
    "phone": "081234567890",
    "address": "Jakarta, Indonesia",
    "bio": "Seorang pelajar yang gemar berkarya seni",
    "birthdate": "2008-05-15T00:00:00.000Z",
    "avatar": "https://example.com/avatar.jpg",
    "className": "XII IPA 1",
    "class": {
      "id": "uuid",
      "name": "XII IPA 1"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2.2 Update Profile
**PUT** `/users/me`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "Rina Dewi Updated",
  "phone": "081234567891",
  "address": "Bandung, Indonesia",
  "bio": "Updated bio",
  "birthdate": "2008-05-15",
  "email": "newemail@mail.com"  // Optional, jika ingin update email
}
```

**Note:** 
- `nis` tidak bisa diubah setelah dibuat
- `role` tidak bisa diubah
- `classId` hanya bisa diubah oleh teacher/admin

**Response Success (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "name": "Rina Dewi Updated",
    "email": "newemail@mail.com",
    "phone": "081234567891",
    "address": "Bandung, Indonesia",
    "bio": "Updated bio",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 2.3 Upload Avatar
**POST** `/users/me/avatar`

**Headers:**
- Session cookie (automatic)
- Content-Type: `multipart/form-data`

**Body:**
```
avatar: <file>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatar": "https://example.com/avatars/uuid.jpg"
  }
}
```

---

### 2.4 Change Password
**PUT** `/users/me/password`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## 3. Class Endpoints

### 3.1 Get All Classes
**GET** `/classes`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "uuid",
        "name": "XII IPA 1",
        "description": "Kelas 12 IPA 1",
        "studentCount": 32,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 3.2 Get Class by ID
**GET** `/classes/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "XII IPA 1",
    "description": "Kelas 12 IPA 1",
    "students": [
      {
        "id": "uuid",
        "name": "Rina Dewi",
        "nis": "12345",
        "email": "student@mail.com"
      }
    ],
    "studentCount": 32,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.3 Create Class (Teacher only)
**POST** `/classes`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "XII IPA 2",
  "description": "Kelas 12 IPA 2"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "id": "uuid",
    "name": "XII IPA 2",
    "description": "Kelas 12 IPA 2",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3.4 Update Class (Teacher only)
**PUT** `/classes/:id`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "XII IPA 2 Updated",
  "description": "Updated description"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "id": "uuid",
    "name": "XII IPA 2 Updated",
    "description": "Updated description",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 3.5 Delete Class (Teacher only)
**DELETE** `/classes/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```

---

## 4. Student Endpoints

### 4.1 Get All Students (Teacher only)
**GET** `/students`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search by name, NIS, or email
- `classId` (optional): Filter by class
- `className` (optional): Filter by class name

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "uuid",
        "name": "Rina Dewi",
        "nis": "12345",
        "email": "student@mail.com",
        "phone": "081234567890",
        "className": "XII IPA 1",
        "class": {
          "id": "uuid",
          "name": "XII IPA 1"
        },
        "portfolioCount": 12,
        "avgScore": 88.5,
        "avatar": "https://example.com/avatar.jpg",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 32,
      "totalPages": 4
    }
  }
}
```

---

### 4.2 Get Student by ID
**GET** `/students/:id`

**Headers:**
- Session cookie (automatic)
- Teacher: bisa akses semua siswa
- Student: hanya bisa akses profil sendiri

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Rina Dewi",
    "nis": "12345",
    "email": "student@mail.com",
    "phone": "081234567890",
    "className": "XII IPA 1",
    "class": {
      "id": "uuid",
      "name": "XII IPA 1"
    },
    "portfolioCount": 12,
    "avgScore": 88.5,
    "submissions": [
      {
        "id": "uuid",
        "assignmentTitle": "Lukisan Tema Alam",
        "grade": 95,
        "status": "GRADED",
        "submittedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4.3 Create Student (Teacher only)
**POST** `/students`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "nis": "12346",
  "email": "newstudent@mail.com",  // Optional
  "password": "password123",
  "name": "Budi Santoso",
  "phone": "081234567891",
  "classId": "uuid"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "id": "uuid",
    "name": "Budi Santoso",
    "nis": "12346",
    "email": "newstudent@mail.com",
    "className": "XII IPA 1",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4.4 Update Student (Teacher only)
**PUT** `/students/:id`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "Budi Santoso Updated",
  "phone": "081234567892",
  "email": "updated@mail.com",  // Optional
  "classId": "uuid"
}
```

**Note:** `nis` tidak bisa diubah setelah dibuat.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "id": "uuid",
    "name": "Budi Santoso Updated",
    "nis": "12346",
    "email": "updated@mail.com",
    "phone": "081234567892",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 4.5 Delete Student (Teacher only)
**DELETE** `/students/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

---

### 4.6 Import Students from Excel (Teacher only)
**POST** `/students/import`

**Headers:**
- Session cookie (automatic)
- Content-Type: `multipart/form-data`

**Body:**
```
file: <excel_file>
```

**Excel Format:**
- Kolom A: NIS (required, unique)
- Kolom B: Nama Lengkap (required)
- Kolom C: Email (optional)
- Kolom D: No. Telepon (optional)
- Kolom E: Kelas (required, harus match dengan class name yang ada)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Import completed",
  "data": {
    "total": 10,
    "success": 8,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "nis": "12345",
        "error": "NIS already exists"
      },
      {
        "row": 7,
        "nis": "12350",
        "error": "Class not found: XII IPA 3"
      }
    ]
  }
}
```

---

## 5. Assignment Endpoints

### 5.1 Get All Assignments
**GET** `/assignments`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (DRAFT, ACTIVE, COMPLETED)
- `search` (optional): Search by title
- `studentId` (optional): Get assignments for specific student (Student only, default: current user)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "uuid",
        "title": "Lukisan Tema Alam",
        "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
        "category": "Lukisan",
        "deadline": "2024-01-20T23:59:59.000Z",
        "status": "ACTIVE",
        "createdBy": {
          "id": "uuid",
          "name": "Pak Budi"
        },
        "classes": [
          {
            "id": "uuid",
            "name": "XII IPA 1"
          }
        ],
        "submissionCount": 24,
        "totalStudents": 32,
        "mySubmission": {  // Only for student
          "id": "uuid",
          "status": "PENDING",
          "grade": null,
          "submittedAt": "2024-01-15T00:00:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 5.2 Get Assignment by ID
**GET** `/assignments/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lukisan Tema Alam",
    "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
    "deadline": "2024-01-20T23:59:59.000Z",
    "status": "ACTIVE",
    "createdBy": {
      "id": "uuid",
      "name": "Pak Budi"
    },
    "classes": [
      {
        "id": "uuid",
        "name": "XII IPA 1"
      }
    ],
    "submissions": [  // Only for teacher
      {
        "id": "uuid",
        "student": {
          "id": "uuid",
          "name": "Rina Dewi",
          "nis": "12345",
          "className": "XII IPA 1"
        },
        "status": "PENDING",
        "submittedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "submissionCount": 24,
    "totalStudents": 32,
    "mySubmission": {  // Only for student
      "id": "uuid",
      "status": "PENDING",
      "grade": null,
      "submittedAt": "2024-01-15T00:00:00.000Z"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5.3 Create Assignment (Teacher only)
**POST** `/assignments`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "title": "Lukisan Tema Alam",
  "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
  "category": "Lukisan",
  "deadline": "2024-01-20T23:59:59.000Z",
  "classIds": ["uuid1", "uuid2"]
}
```

**Validation:**
- `title`: required
- `description`: required
- `category`: required (Lukisan, Sketsa, Kolase, Digital, Patung, Fotografi, Desain, atau custom)
- `deadline`: required, must be in the future
- `classIds`: required, at least one class

**Response Success (201):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "uuid",
    "title": "Lukisan Tema Alam",
    "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
    "category": "Lukisan",
    "deadline": "2024-01-20T23:59:59.000Z",
    "status": "DRAFT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5.4 Update Assignment (Teacher only)
**PUT** `/assignments/:id`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "title": "Lukisan Tema Alam Updated",
  "description": "Updated description",
  "category": "Lukisan",
  "deadline": "2024-01-25T23:59:59.000Z",
  "classIds": ["uuid1"]
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "data": {
    "id": "uuid",
    "title": "Lukisan Tema Alam Updated",
    "description": "Updated description",
    "deadline": "2024-01-25T23:59:59.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 5.5 Publish Assignment (Teacher only)
**POST** `/assignments/:id/publish`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment published successfully",
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot publish assignment: No classes assigned"
}
```

---

### 5.6 Delete Assignment (Teacher only)
**DELETE** `/assignments/:id`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `action` (optional): `delete` | `draft` (default: `delete`)
  - `delete`: Hapus permanen
  - `draft`: Ubah status menjadi DRAFT

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot delete assignment: Has submissions"
}
```

---

### 5.7 Bulk Delete Assignments (Teacher only)
**POST** `/assignments/bulk-delete`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "assignmentIds": ["uuid1", "uuid2", "uuid3"],
  "action": "delete"  // "delete" atau "draft"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": {
    "total": 3,
    "success": 2,
    "failed": 1,
    "errors": [
      {
        "assignmentId": "uuid3",
        "error": "Cannot delete: Has submissions"
      }
    ]
  }
}
```

---

## 6. Submission Endpoints

### 6.1 Get Submissions
**GET** `/submissions`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `assignmentId` (optional): Filter by assignment
- `studentId` (optional): Filter by student (Student can only see their own)
- `status` (optional): Filter by status

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "uuid",
        "assignment": {
          "id": "uuid",
          "title": "Lukisan Tema Alam",
          "deadline": "2024-01-20T23:59:59.000Z"
        },
        "student": {
          "id": "uuid",
          "name": "Rina Dewi",
          "nis": "12345",
          "className": "XII IPA 1"
        },
        "title": "Lukisan Sunset Pantai",
        "description": "Karya tentang sunset di pantai",
        "imageUrl": "https://example.com/artwork/uuid-full.jpg",
        "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
        "imageMedium": "https://example.com/artwork/uuid-medium.jpg",
        "status": "PENDING",
        "grade": null,
        "feedback": null,
        "revisionCount": 0,
        "submittedAt": "2024-01-15T00:00:00.000Z",
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3
    }
  }
}
```

---

### 6.2 Get Submission by ID
**GET** `/submissions/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Alam",
      "deadline": "2024-01-20T23:59:59.000Z"
    },
    "student": {
      "id": "uuid",
      "name": "Rina Dewi",
      "nis": "12345",
      "className": "XII IPA 1"
    },
    "title": "Lukisan Sunset Pantai",
    "description": "Karya tentang sunset di pantai",
    "imageUrl": "https://example.com/artwork/uuid-full.jpg",
    "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
    "imageMedium": "https://example.com/artwork/uuid-medium.jpg",
    "status": "GRADED",
    "grade": 95,
    "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
    "revisionCount": 0,
    "revisions": [],
    "submittedAt": "2024-01-15T00:00:00.000Z",
    "gradedAt": "2024-01-16T00:00:00.000Z",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**Note:** `imageUrl` harus memiliki resolusi tinggi (min 1200x800px) untuk mendukung fitur zoom hingga 300% di frontend.

---

### 6.3 Submit Assignment (Student only)
**POST** `/submissions`

**Headers:**
- Session cookie (automatic)
- Content-Type: `multipart/form-data`

**Body:**
```
assignmentId: uuid
title: Lukisan Sunset Pantai
description: Karya tentang sunset di pantai
image: <file>
```

**File Validation:**
- File type: `image/jpeg`, `image/png`, `image/webp`
- Max file size: `10MB`
- Min dimensions: `800x600px` (recommended: `1200x800px` untuk zoom support)
- Max dimensions: `5000x5000px`

**Response Success (201):**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "id": "uuid",
    "assignmentId": "uuid",
    "studentId": "uuid",
    "title": "Lukisan Sunset Pantai",
    "description": "Karya tentang sunset di pantai",
    "imageUrl": "https://example.com/artwork/uuid-full.jpg",
    "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
    "imageMedium": "https://example.com/artwork/uuid-medium.jpg",
    "status": "PENDING",
    "revisionCount": 0,
    "submittedAt": "2024-01-15T00:00:00.000Z",
    "createdAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Assignment deadline has passed"
}
```

**Response Error - Image Validation (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "image": "Image dimensions must be at least 800x600 pixels. Current: 600x400 pixels"
  }
}
```

---

### 6.4 Update Submission (Student only)
**PUT** `/submissions/:id`

**Headers:**
- Session cookie (automatic)
- Content-Type: `multipart/form-data`

**Body:**
```
title: Lukisan Sunset Pantai (Revisi)
description: Updated description
image: <file>
```

**Note:** 
- Bisa update jika status = `PENDING` (edit sebelum dinilai)
- Bisa update jika status = `REVISION` (upload revisi)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission updated successfully",
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "revisionCount": 1,
    "updatedAt": "2024-01-18T00:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot update submission: Already graded"
}
```

---

### 6.5 Cancel Submission (Student only)
**DELETE** `/submissions/:id`

**Headers:**
- Session cookie (automatic)

**Note:** 
- Hanya bisa cancel jika status = `PENDING`
- Setelah cancel, status menjadi `NOT_SUBMITTED`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission cancelled successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot cancel submission: Already graded or in revision"
}
```

---

### 6.6 Grade Submission (Teacher only)
**POST** `/submissions/:id/grade`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "grade": 95,
  "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis."
}
```

**Validation:**
- `grade`: required, number between 0-100
- `feedback`: optional, string

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "id": "uuid",
    "status": "GRADED",
    "grade": 95,
    "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
    "gradedAt": "2024-01-16T00:00:00.000Z",
    "updatedAt": "2024-01-16T00:00:00.000Z"
  }
}
```

---

### 6.7 Return for Revision (Teacher only)
**POST** `/submissions/:id/revision`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "revisionNote": "Warna kurang kontras, tolong perbaiki bagian langit"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission returned for revision",
  "data": {
    "id": "uuid",
    "status": "REVISION",
    "revisionCount": 1,
    "updatedAt": "2024-01-16T00:00:00.000Z"
  }
}
```

---

## 7. Portfolio Endpoints

### 7.1 Get Portfolio Items
**GET** `/portfolio`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Filter by category
- `search` (optional): Search by title or student name
- `studentId` (optional): Filter by student

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Lukisan Sunset Pantai",
        "imageUrl": "https://example.com/artwork/uuid-full.jpg",
        "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
        "category": "Lukisan",
        "student": {
          "id": "uuid",
          "name": "Rina Dewi",
          "nis": "12345",
          "className": "XII IPA 1",
          "avatar": "https://example.com/avatar.jpg"
        },
        "assignment": {
          "id": "uuid",
          "title": "Lukisan Tema Alam"
        },
    "grade": 95,
    "feedback": "Karya yang sangat bagus!",
        "submittedAt": "2024-01-15T00:00:00.000Z",
        "gradedAt": "2024-01-16T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 7.2 Get Portfolio Item by ID
**GET** `/portfolio/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Lukisan Sunset Pantai",
    "description": "Karya tentang sunset di pantai",
    "imageUrl": "https://example.com/artwork/uuid-full.jpg",
    "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
    "imageMedium": "https://example.com/artwork/uuid-medium.jpg",
    "category": "Lukisan",
    "student": {
      "id": "uuid",
      "name": "Rina Dewi",
      "nis": "12345",
      "className": "XII IPA 1",
      "avatar": "https://example.com/avatar.jpg"
    },
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Alam"
    },
    "grade": 95,
    "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
    "submittedAt": "2024-01-15T00:00:00.000Z",
    "gradedAt": "2024-01-16T00:00:00.000Z"
  }
}
```

---

## 8. Notification Endpoints

### 8.1 Get Notifications
**GET** `/notifications`

**Headers:**
- Session cookie (automatic)

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isRead` (optional): Filter by read status

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "SUBMISSION_GRADED",
        "title": "Karya Dinilai",
        "message": "Karya 'Lukisan Sunset Pantai' telah dinilai dengan nilai A",
        "link": "/submissions/uuid",
        "isRead": false,
        "createdAt": "2024-01-16T00:00:00.000Z"
      }
    ],
    "unreadCount": 5,
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

---

### 8.2 Mark Notification as Read
**PUT** `/notifications/:id/read`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 8.3 Mark All Notifications as Read
**PUT** `/notifications/read-all`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 9. Dashboard Endpoints

### 9.1 Get Teacher Dashboard Stats
**GET** `/dashboard/teacher`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "totalStudents": 32,
    "activeAssignments": 5,
    "newPortfolios": 18,
    "averageScore": 85.5,
    "recentSubmissions": [
      {
        "id": "uuid",
        "studentName": "Rina Dewi",
        "studentNis": "12345",
        "assignmentTitle": "Lukisan Pemandangan",
        "grade": 95,
        "submittedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "topStudents": [
      {
        "id": "uuid",
        "name": "Rina Dewi",
        "nis": "12345",
        "avgScore": 95
      }
    ]
  }
}
```

---

### 9.2 Get Student Dashboard Stats
**GET** `/dashboard/student`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "portfolioCount": 12,
    "completedAssignments": 8,
    "totalAssignments": 10,
    "averageScore": 88.5,
    "achievements": [
      {
        "id": "uuid",
        "name": "Seniman Pemula",
        "icon": "🎨",
        "unlockedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "recentWorks": [
      {
        "id": "uuid",
        "title": "Lukisan Sunset",
        "category": "Lukisan",
        "grade": 95,
        "submittedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "pendingAssignments": [
      {
        "id": "uuid",
        "title": "Lukisan Tema Alam",
        "deadline": "2024-01-20T23:59:59.000Z",
        "progress": 60
      }
    ]
  }
}
```

---

## 10. Category Endpoints

### 10.1 Get All Categories
**GET** `/categories`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Lukisan",
        "description": "Karya seni lukis",
        "usageCount": 15,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "name": "Sketsa",
        "description": "Karya seni sketsa",
        "usageCount": 8,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 10.2 Create Category (Teacher only)
**POST** `/categories`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "Fotografi",
  "description": "Karya seni fotografi"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Fotografi",
    "description": "Karya seni fotografi",
    "usageCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 10.3 Update Category (Teacher only)
**PUT** `/categories/:id`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "name": "Fotografi Updated",
  "description": "Updated description"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "uuid",
    "name": "Fotografi Updated",
    "description": "Updated description",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 10.4 Delete Category (Teacher only)
**DELETE** `/categories/:id`

**Headers:**
- Session cookie (automatic)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot delete category: Still in use by assignments"
}
```

---

## 11. Export Endpoints

### 11.1 Export Data to Excel
**POST** `/export/excel`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "classIds": ["uuid1", "uuid2"],
  "assignmentIds": ["uuid1"],
  "statuses": ["GRADED", "PENDING"],
  "studentIds": ["uuid1", "uuid2"]
}
```

**Response Success (200):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="export.xlsx"

<binary file data>
```

---

### 11.2 Export Data to PDF
**POST** `/export/pdf`

**Headers:**
- Session cookie (automatic)

**Body:**
```json
{
  "classIds": ["uuid1", "uuid2"],
  "assignmentIds": ["uuid1"],
  "statuses": ["GRADED"],
  "studentIds": ["uuid1", "uuid2"]
}
```

**Response Success (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="export.pdf"

<binary file data>
```

---

## Error Response Format

Semua error response mengikuti format berikut:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (Session expired/invalid)
- `403` - Forbidden (No permission)
- `404` - Not Found
- `409` - Conflict (Duplicate data)
- `422` - Validation Error
- `500` - Internal Server Error

## Session Management

- Session disimpan di server (database atau memory store)
- Session cookie dikirim otomatis oleh browser
- Session expired setelah periode tertentu (default: 7 hari)
- Logout akan menghapus session dari server

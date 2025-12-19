# Request & Response Examples - Seniku Backend API

Dokumen ini berisi contoh lengkap request dan response untuk setiap endpoint, termasuk success dan error cases.

**Note**: Semua endpoint (kecuali auth) memerlukan session cookie yang dikirim otomatis oleh browser setelah login.

---

## 1. Authentication Endpoints

### 1.1 Register

#### Success Request (Student)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "nis": "12345",
  "email": "student@mail.com",
  "password": "password123",
  "name": "Rina Dewi",
  "role": "STUDENT",
  "phone": "081234567890",
  "classId": "550e8400-e29b-41d4-a716-446655440010"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nis": "12345",
      "email": "student@mail.com",
      "name": "Rina Dewi",
      "role": "STUDENT",
      "phone": "081234567890",
      "className": "XII IPA 1",
      "class": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "XII IPA 1"
      },
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

#### Success Request (Teacher)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "teacher@mail.com",
  "password": "password123",
  "name": "Pak Budi",
  "role": "TEACHER",
  "phone": "081234567891"
}
```

#### Error Response - NIS Already Exists (409)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "nis": "NIS already exists"
  }
}
```

#### Error Response - Email Already Exists (409)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": "Email student@mail.com is already registered"
  }
}
```

#### Error Response - Validation Error (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "nis": "NIS is required for STUDENT",
    "password": "Password must be at least 8 characters",
    "name": "Name is required",
    "classId": "Class ID is required for STUDENT"
  }
}
```

---

### 1.2 Login

#### Success Request (Login with Email)
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "teacher@mail.com",
  "password": "password123"
}
```

#### Success Request (Login with NIS - Student only)
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "identifier": "12345",
  "password": "password123"
}
```

#### Success Response (200)
```http
HTTP/1.1 200 OK
Set-Cookie: sessionId=550e8400-e29b-41d4-a716-446655440099; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
Content-Type: application/json

{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "teacher@mail.com",
      "nis": null,
      "name": "Pak Budi",
      "role": "TEACHER",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

#### Success Response (200) - Student with NIS
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "student@mail.com",
      "nis": "12345",
      "name": "Rina Dewi",
      "role": "STUDENT",
      "className": "XII IPA 1",
      "class": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "XII IPA 1"
      }
    }
  }
}
```

#### Error Response - Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Error Response - User Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## 2. User Endpoints

### 2.1 Get Current User Profile

#### Success Request
```http
GET /api/v1/users/me
Cookie: sessionId=550e8400-e29b-41d4-a716-446655440099
```

**Note**: Cookie dikirim otomatis oleh browser, tidak perlu ditulis manual di request.

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
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
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "XII IPA 1"
    },
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### Error Response - Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized: Session expired or invalid"
}
```

---

### 2.2 Update Profile

#### Success Request
```http
PUT /api/v1/users/me
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Rina Dewi Updated",
  "phone": "081234567891",
  "address": "Bandung, Indonesia",
  "bio": "Updated bio",
  "birthdate": "2008-05-15"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Rina Dewi Updated",
    "email": "student@mail.com",
    "phone": "081234567891",
    "address": "Bandung, Indonesia",
    "bio": "Updated bio",
    "updatedAt": "2024-01-02T10:00:00.000Z"
  }
}
```

#### Error Response - Validation Error (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "phone": "Invalid phone number format",
    "birthdate": "Birthdate must be a valid date"
  }
}
```

---

## 3. Assignment Endpoints

### 3.1 Create Assignment

#### Success Request
```http
POST /api/v1/assignments
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Lukisan Tema Alam",
  "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
  "deadline": "2024-01-20T23:59:59.000Z",
  "classIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ]
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "title": "Lukisan Tema Alam",
    "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
    "deadline": "2024-01-20T23:59:59.000Z",
    "status": "DRAFT",
    "createdBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Pak Budi"
    },
    "classes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "name": "XII IPA 1"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "name": "XII IPA 2"
      }
    ],
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### Error Response - Forbidden (403)
```json
{
  "success": false,
  "message": "Forbidden: Only teachers can create assignments"
}
```

#### Error Response - Validation Error (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "title": "Title is required",
    "deadline": "Deadline must be in the future",
    "classIds": "At least one class must be selected"
  }
}
```

---

### 3.2 Get All Assignments

#### Success Request
```http
GET /api/v1/assignments?page=1&limit=10&status=ACTIVE
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "title": "Lukisan Tema Alam",
        "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
        "deadline": "2024-01-20T23:59:59.000Z",
        "status": "ACTIVE",
        "createdBy": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Pak Budi"
        },
        "classes": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "name": "XII IPA 1"
          }
        ],
        "submissionCount": 24,
        "totalStudents": 32,
        "createdAt": "2024-01-01T10:00:00.000Z"
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

## 4. Submission Endpoints

### 4.1 Submit Assignment

#### Success Request
```http
POST /api/v1/submissions
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

assignmentId: 550e8400-e29b-41d4-a716-446655440020
title: Lukisan Sunset Pantai
description: Karya tentang sunset di pantai
image: <binary file data>
```

**File Requirements:**
- Type: JPEG, PNG, or WebP
- Max size: 10MB
- Min dimensions: 800x600px (recommended: 1200x800px untuk zoom support)
- Max dimensions: 5000x5000px

#### Success Response (201)
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "assignmentId": "550e8400-e29b-41d4-a716-446655440020",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Lukisan Sunset Pantai",
    "description": "Karya tentang sunset di pantai",
    "imageUrl": "https://example.com/artwork/550e8400-e29b-41d4-a716-446655440030-full.jpg",
    "imageThumbnail": "https://example.com/artwork/550e8400-e29b-41d4-a716-446655440030-thumb.jpg",
    "imageMedium": "https://example.com/artwork/550e8400-e29b-41d4-a716-446655440030-medium.jpg",
    "status": "PENDING",
    "revisionCount": 0,
    "submittedAt": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### Error Response - Deadline Passed (400)
```json
{
  "success": false,
  "message": "Assignment deadline has passed"
}
```

#### Error Response - Already Submitted (409)
```json
{
  "success": false,
  "message": "Submission already exists for this assignment",
  "errors": {
    "assignmentId": "You have already submitted this assignment"
  }
}
```

#### Error Response - Invalid File Type (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "image": "File must be an image (jpg, png, webp)"
  }
}
```

#### Error Response - Image Too Small (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "image": "Image dimensions must be at least 800x600 pixels. Current: 600x400 pixels"
  }
}
```

#### Error Response - File Too Large (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "image": "File size must be less than 10MB. Current: 12.5MB"
  }
}
```

---

### 4.2 Grade Submission

#### Success Request
```http
POST /api/v1/submissions/550e8400-e29b-41d4-a716-446655440030/grade
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "grade": 95,
  "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis dan menggambarkan suasana sunset dengan indah."
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "status": "GRADED",
    "grade": 95,
    "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis dan menggambarkan suasana sunset dengan indah.",
    "gradedAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

#### Error Response - Invalid Grade (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "grade": "Grade must be a number between 0 and 100"
  }
}
```

#### Error Response - Forbidden (403)
```json
{
  "success": false,
  "message": "Forbidden: Only teachers can grade submissions"
}
```

---

### 4.3 Return for Revision

#### Success Request
```http
POST /api/v1/submissions/550e8400-e29b-41d4-a716-446655440030/revision
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "revisionNote": "Warna kurang kontras, tolong perbaiki bagian langit. Tambahkan lebih banyak detail pada awan."
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Submission returned for revision",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "status": "REVISION",
    "revisionCount": 1,
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

#### Error Response - Missing Revision Note (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "revisionNote": "Revision note is required"
  }
}
```

---

## 5. Student Endpoints

### 5.1 Get All Students

#### Success Request
```http
GET /api/v1/students?page=1&limit=10&search=Rina&classId=550e8400-e29b-41d4-a716-446655440010
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Rina Dewi",
        "email": "student@mail.com",
        "phone": "081234567890",
        "className": "XII IPA 1",
        "class": {
          "id": "550e8400-e29b-41d4-a716-446655440010",
          "name": "XII IPA 1"
        },
        "portfolioCount": 12,
        "avgScore": 88.5,
        "avatar": "https://example.com/avatar.jpg",
        "createdAt": "2024-01-01T10:00:00.000Z"
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

### 5.2 Import Students from Excel

#### Success Request
```http
POST /api/v1/students/import
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

file: <excel_file.xlsx>
```

#### Success Response (200)
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
        "email": "invalid-email",
        "error": "Invalid email format"
      },
      {
        "row": 7,
        "email": "duplicate@mail.com",
        "error": "Email already exists"
      }
    ]
  }
}
```

#### Error Response - Invalid File Format (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "file": "File must be a valid Excel file (.xlsx)"
  }
}
```

---

## 6. Portfolio Endpoints

### 6.1 Get Portfolio Items

#### Success Request
```http
GET /api/v1/portfolio?page=1&limit=10&category=Lukisan&search=Sunset
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "title": "Lukisan Sunset Pantai",
        "imageUrl": "https://example.com/artwork/550e8400-e29b-41d4-a716-446655440030.jpg",
        "category": "Lukisan",
        "student": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Rina Dewi",
          "className": "XII IPA 1",
          "avatar": "https://example.com/avatar.jpg"
        },
        "assignment": {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "title": "Lukisan Tema Alam"
        },
        "grade": 95,
        "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
        "submittedAt": "2024-01-15T10:00:00.000Z",
        "gradedAt": "2024-01-16T10:00:00.000Z"
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

## 7. Dashboard Endpoints

### 7.1 Get Teacher Dashboard

#### Success Request
```http
GET /api/v1/dashboard/teacher
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
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
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "studentName": "Rina Dewi",
        "studentNis": "12345",
        "assignmentTitle": "Lukisan Pemandangan",
        "grade": 95,
        "submittedAt": "2024-01-15T10:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440031",
        "studentName": "Budi Santoso",
        "studentNis": "12346",
        "assignmentTitle": "Sketsa Wajah",
        "grade": 85,
        "submittedAt": "2024-01-14T10:00:00.000Z"
      }
    ],
    "topStudents": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Rina Dewi",
        "nis": "12345",
        "avgScore": 95
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Maya Putri",
        "nis": "12347",
        "avgScore": 92
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "name": "Siti Aminah",
        "avgScore": 90
      }
    ]
  }
}
```

---

### 7.2 Get Student Dashboard

#### Success Request
```http
GET /api/v1/dashboard/student
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
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
        "id": "550e8400-e29b-41d4-a716-446655440040",
        "name": "Seniman Pemula",
        "icon": "🎨",
        "unlockedAt": "2024-01-01T10:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440041",
        "name": "Kolektor Bintang",
        "icon": "⭐",
        "unlockedAt": "2024-01-05T10:00:00.000Z"
      }
    ],
    "recentWorks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "title": "Lukisan Sunset",
        "category": "Lukisan",
        "grade": 95,
        "submittedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pendingAssignments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "title": "Lukisan Tema Alam",
        "deadline": "2024-01-20T23:59:59.000Z",
        "progress": 60
      }
    ]
  }
}
```

---

## 8. Export Endpoints

### 8.1 Export to Excel

#### Success Request
```http
POST /api/v1/export/excel
Cookie: sessionId=xxx eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "classIds": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011"
  ],
  "assignmentIds": [
    "550e8400-e29b-41d4-a716-446655440020"
  ],
  "statuses": ["GRADED", "PENDING"],
  "studentIds": []
}
```

#### Success Response (200)
```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="seniku-export-2024-01-16.xlsx"

<binary file data>
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized: Token is missing or invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development)"
}
```

---

## Notes

1. **Authentication**: Semua endpoint (kecuali auth) memerlukan JWT token di header `Cookie: sessionId=xxx <token>`

2. **Pagination**: Endpoint yang mendukung pagination menggunakan query parameters:
   - `page`: Nomor halaman (default: 1)
   - `limit`: Jumlah item per halaman (default: 10, max: 100)

3. **File Upload**: Endpoint yang menerima file menggunakan `multipart/form-data`

4. **Date Format**: Semua tanggal menggunakan ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

5. **Error Handling**: Semua error response mengikuti format yang konsisten dengan field `success`, `message`, dan `errors` (jika ada)


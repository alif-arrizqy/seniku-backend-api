# API Endpoints - Seniku Backend API

## 📚 Dokumentasi Terkait

Sebelum menggunakan API ini, disarankan untuk membaca dokumentasi berikut:
- **[API Flow & Status Documentation](./04-API-FLOW-AND-STATUS.md)** - Penjelasan lengkap tentang status values, request body fields, flow penggunaan API, dan validation rules
- **[Database Schema](./02-DATABASE-SCHEMA.md)** - Struktur database dan relasi antar tabel

## Base URL
```
http://localhost:8989/seniku/api/v1
```

## Authentication
Sistem menggunakan **JWT (JSON Web Token) Authentication** dengan Access Token dan Refresh Token.

**Semua endpoint (kecuali auth) memerlukan JWT Access Token:**
- Access Token dikirim melalui header `Authorization: Bearer <token>`
- Access Token expires dalam 15 menit
- Refresh Token digunakan untuk mendapatkan Access Token baru
- Refresh Token expires dalam 7 hari

**Cara Testing API:**
1. Gunakan tools seperti Postman, Insomnia, atau Thunder Client
2. Login terlebih dahulu melalui `POST /api/v1/auth/login`
3. Simpan `accessToken` dan `refreshToken` dari response
4. Gunakan `accessToken` di header `Authorization: Bearer <accessToken>` untuk endpoint lain
5. Jika access token expired, gunakan `refreshToken` di endpoint `POST /api/v1/auth/refresh` untuk mendapatkan access token baru

---

## 1. Authentication Endpoints

### 1.1 Register
**POST** `/auth/register`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "teacher@test.com",  // Optional untuk STUDENT, required untuk TEACHER
  "password": "password123",
  "nip": "0987654321",            // Required untuk TEACHER, unique
  "nis": "12345",                 // Required untuk STUDENT, unique
  "name": "Rina Dewi",
  "role": "STUDENT",              // "STUDENT" atau "TEACHER"
  "phone": "081234567890",
  "classId": "uuid"               // Required untuk STUDENT
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

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "identifier": "2025123456789",  // NIP untuk TEACHER atau NIS untuk STUDENT
  "password": "123456"
}
```

**Login Logic:**
1. Cari user by NIP (untuk TEACHER)
2. Jika tidak ditemukan, cari user by NIS (untuk STUDENT)
3. Verify password
4. Generate JWT Access Token dan Refresh Token

**Note:**
- **TEACHER** login dengan **NIP** (Nomor Induk Pegawai)
- **STUDENT** login dengan **NIS** (Nomor Induk Siswa)

**Response Success (200) - Student:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@mail.com",
      "nis": "12345",
      "nip": null,
      "name": "Rina Dewi",
      "role": "STUDENT",
      "avatar": "https://example.com/avatar.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Success (200) - Teacher:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "teacher@mail.com",
      "nip": "0987654321",
      "nis": null,
      "name": "Pak Budi",
      "role": "TEACHER",
      "avatar": "https://example.com/avatar.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error - Invalid Credentials (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

**Response Error - User Not Found (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 1.3 Refresh Token
**POST** `/auth/refresh`

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error - Invalid Refresh Token (401):**
```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

**Response Error - Refresh Token Expired (401):**
```json
{   
  "success": false,
  "error": "Refresh token expired"
}
```

---

### 1.4 Logout
**POST** `/auth/logout`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Note:** Logout akan meng-invalidate semua refresh token user dengan cara increment `tokenVersion` di database.

---

### 1.5 Get Current User
**GET** `/auth/me`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "teacher@test.com",
      "nip": "0987654321",
      "nis": null,
      "name": "PamBudi",
      "role": "TEACHER",
      "avatar": null,
      "phone": "081234567890",
      "address": null,
      "bio": null,
      "birthdate": null,
      "className": null,
      "classId": null,
      "createdAt": "2025-12-19T06:43:34.967Z",
      "updatedAt": "2025-12-19T06:43:34.967Z"
    }
  }
}
```

**Response Error - Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized. Please login first."
}
```

**Response Error - Access Token Expired (401):**
```json
{
  "success": false,
  "error": "Access token expired"
}
```

---

## 2. User Endpoints

### 2.1 Get All Users (Teacher only)
**GET** `/users`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `role` (optional): Filter by role (STUDENT, TEACHER)
- `search` (optional): Search by name, NIS, NIP, or email
- `classId` (optional): Filter by class ID

**Example Request:**
```
GET /users?page=1&limit=10&search=Wanda Oke
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "email": null,
      "nip": null,
      "nis": "2025123456839",
      "name": "Wahyu Dwi",
      "role": "STUDENT",
      "avatar": null,
      "phone": "081234567890",
      "className": "2C",
      "classId": "uuid",
      "isActive": true,
      "createdAt": "2021-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 32,
    "totalPages": 4,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 2.2 Get User by ID
**GET** `/users/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Note:**
- Teacher: bisa akses semua user
- Student: hanya bisa akses profil sendiri

**Response Success (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@mail.com",
      "nip": null,
      "nis": "2025123456848",
      "name": "Rina Dewi Updated",
      "role": "STUDENT",
      "avatar": null,
      "phone": "081234567891",
      "address": "Bandung, Indonesia",
      "bio": "Updated bio",
      "birthdate": "2008-05-08",
      "className": "2C",
      "classId": "uuid",
      "isActive": true
    }
  }
}
```

---

### 2.3 Update User
**PUT** `/users/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Note:**
- Student: hanya bisa update profil sendiri
- Teacher: bisa update semua user

**Body:**
```json
{
  "name": "Fauzan Nako",
  "phone": "081234567891",
  "address": "Bandung, Indonesia",
  "bio": "Updated bio",
  "birthdate": "2008-05-08",
  "email": "newemail@mail.com"  // Optional
  // "classId": "uuid"  // Optional, hanya bisa diubah oleh teacher
}
```

**Note:** 
- `nis` tidak bisa diubah setelah dibuat
- `role` tidak bisa diubah

**Response Success (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@mail.com",
      "nip": null,
      "nis": "2025123456848",
      "name": "Rina Dewi Updated",
      "role": "STUDENT",
      "avatar": null,
      "phone": "081234567891",
      "address": "Bandung, Indonesia",
      "bio": "Updated bio",
      "birthdate": "2008-05-15T00:00:00.000Z",
      "className": "2C",
      "classId": "uuid",
      "isActive": true,
      "updatedAt": "2025-12-19T08:32:29.785Z"
    }
  }
}
```

---

### 2.4 Delete User (Teacher only)
**DELETE** `/users/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

---

### 2.5 Import Students from Excel (Teacher only)
**POST** `/users/import`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `file` (required): Excel file (.xlsx) dengan kolom: NIS, Nama, Email (optional), Phone (optional), Class, Password (optional)

**File Requirements:**
- File type: `.xlsx` (Excel 2007+)
- Max file size: `5MB`
- Format Excel harus memiliki kolom:
  - `NIS` (required, unique)
  - `Nama` (required)
  - `Email` (optional)
  - `Phone` (optional)
  - `Class` (required, nama kelas, akan dicocokkan dengan class yang ada)
  - `Password` (optional, default: `password123` jika tidak diisi)

**Excel Template Example:**
| NIS | Nama | Email | Phone | Class | Password |
|-----|------|-------|-------|-------|----------|
| 12345 | Rina Dewi | rina@mail.com | 081234567890 | XII IPA 1 | password123 |
| 12346 | Budi Santoso | budi@mail.com | 081234567891 | XII IPA 1 | password123 |

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
        "error": "Class 'XII IPA 3' not found"
      }
    ]
  }
}
```

**Response Error - Invalid File Format (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "file": "File must be a valid Excel file (.xlsx)"
  }
}
```

**Response Error - File Too Large (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "file": "File size must be less than 5MB. Current: 6.2MB"
  }
}
```

**Response Error - Missing Required Columns (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "file": "Excel file must contain columns: NIS, Nama, Class"
  }
}
```

**Note:**
- Import akan memproses baris per baris
- Jika ada error pada satu baris, baris tersebut akan di-skip dan error akan dicatat
- Baris yang berhasil akan dibuat sebagai user dengan role `STUDENT`
- Jika class tidak ditemukan berdasarkan nama, baris tersebut akan gagal
- NIS yang sudah ada akan di-skip dan dicatat sebagai error

---

## 3. Category Endpoints

Category digunakan untuk mengkategorikan assignment berdasarkan jenis karya seni (Lukisan, Sketsa, Kolase, Digital, Patung, Fotografi, Desain, dll).

### 3.1 Get All Categories
**GET** `/categories`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name
- `isActive` (optional): Filter by active status (true/false)

**Example Request:**
```
GET /categories?page=1&limit=10&isActive=true
```

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
        "icon": "🎨",
        "isActive": true,
        "assignmentCount": 15,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "name": "Sketsa",
        "description": "Karya seni sketsa",
        "icon": "✏️",
        "isActive": true,
        "assignmentCount": 8,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 7,
      "totalPages": 1
    }
  }
}
```

---

### 3.2 Get Category by ID
**GET** `/categories/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Lukisan",
    "description": "Karya seni lukis",
    "icon": "🎨",
    "isActive": true,
    "assignmentCount": 15,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

---

### 3.3 Create Category (Teacher only)
**POST** `/categories`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Digital Art",
  "description": "Karya seni digital",
  "icon": "💻"
}
```

**Validation:**
- `name`: required, unique, minimum 1 karakter
- `description`: optional
- `icon`: optional (emoji atau icon identifier)

**Response Success (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Digital Art",
    "description": "Karya seni digital",
    "icon": "💻",
    "isActive": true,
    "assignmentCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error - Name Already Exists (409):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": "Category name already exists"
  }
}
```

**Response Error - Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": "Name is required"
  }
}
```

---

### 3.4 Update Category (Teacher only)
**PUT** `/categories/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Digital Art Updated",
  "description": "Updated description",
  "icon": "🖥️",
  "isActive": true
}
```

**Validation:**
- `name`: optional, jika diubah harus unique
- `description`: optional
- `icon`: optional
- `isActive`: optional, boolean

**Response Success (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "uuid",
    "name": "Digital Art Updated",
    "description": "Updated description",
    "icon": "🖥️",
    "isActive": true,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Response Error - Name Already Exists (409):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": "Category name already exists"
  }
}
```

---

### 3.5 Delete Category (Teacher only)
**DELETE** `/categories/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `force` (optional): `true` untuk force delete meskipun ada assignment yang menggunakan category ini (default: `false`)
  - Jika `force=false` dan ada assignment yang menggunakan category, akan return error
  - Jika `force=true`, category akan dihapus dan assignment yang menggunakan category ini akan tetap ada (categoryId tetap tersimpan, tapi category tidak ada)

**Example Request:**
```
DELETE /categories/:id?force=false
```

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
  "error": "Cannot delete category: Has assignments. Use force=true to force delete."
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Note:** 
- Sebaiknya gunakan soft delete dengan mengubah `isActive=false` daripada hard delete
- Hard delete hanya digunakan jika benar-benar diperlukan

---

## 4. Portfolio Endpoints

Portfolio menampilkan semua karya siswa yang sudah dinilai (status GRADED). Portfolio dapat diakses oleh semua user untuk melihat karya-karya terbaik.

### 4.1 Get Portfolio Items
**GET** `/portfolio`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `categoryId` (optional): Filter by category ID
- `studentId` (optional): Filter by student ID
- `classId` (optional): Filter by class ID
- `search` (optional): Search by title or student name
- `minGrade` (optional): Minimum grade filter (0-100)
- `sortBy` (optional): Sort by `grade`, `submittedAt`, or `title` (default: `submittedAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)

**Example Request:**
```
GET /portfolio?page=1&limit=10&sortBy=submittedAt&sortOrder=desc
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Lukisan Sunset Pantai",
        "description": "Karya tentang sunset di pantai",
        "imageUrl": "https://example.com/artwork/uuid-full.jpg",
        "imageThumbnail": "https://example.com/artwork/uuid-thumb.jpg",
        "imageMedium": "https://example.com/artwork/uuid-medium.jpg",
        "category": "Lukisan",
        "grade": 95,
        "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
        "student": {
          "id": "uuid",
          "name": "Rina Dewi",
          "nis": "12345",
          "className": "XII IPA 1",
          "avatar": "https://example.com/avatar.jpg"
        },
        "assignment": {
          "id": "uuid",
          "title": "Lukisan Tema Alam",
          "category": "Lukisan"
        },
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

### 4.2 Get Portfolio Item by ID
**GET** `/portfolio/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

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
    "grade": 95,
    "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
    "student": {
      "id": "uuid",
      "name": "Rina Dewi",
      "nis": "12345",
      "className": "XII IPA 1",
      "avatar": "https://example.com/avatar.jpg"
    },
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Alam",
      "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
      "category": "Lukisan"
    },
    "submittedAt": "2024-01-15T00:00:00.000Z",
    "gradedAt": "2024-01-16T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": "Portfolio item not found"
}
```

**Note:** Portfolio hanya menampilkan submission dengan status `GRADED`. Submission dengan status lain tidak akan muncul di portfolio.

---

## 5. Class Endpoints

### 5.1 Get All Classes
**GET** `/classes`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name

**Example Request:**
```
GET /classes?page=1&limit=10&search
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Classes retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "1A",
      "description": null,
      "_count": {
        "students": 10
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": null,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 5.2 Get Class by ID
**GET** `/classes/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class retrieved successfully",
  "data": {
    "class": {
      "id": "uuid",
      "name": "1B",
      "description": null,
      "createdAt": "2025-12-19T06:39:59.905Z",
      "updatedAt": "2025-12-19T06:39:59.905Z",
      "students": [
        {
          "id": "uuid",
          "name": "Wahyu Dwi",
          "email": null,
          "nis": "2025123456799",
          "avatar": null
        }
      ],
      "_count": {
        "students": 10,
        "assignments": 0
      }
    }
  }
}
```

---

### 5.3 Create Class (Teacher only)
**POST** `/classes`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "3C",
  "description": "Kelas 3C"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "class": {
      "id": "uuid",
      "name": "3B",
      "description": "Kelas 3B",
      "createdAt": "2025-12-19T09:11:57.516Z",
      "updatedAt": "2025-12-19T09:11:57.516Z",
      "_count": {
        "students": 0
      }
    }
  }
}
```

**Response Error - Class Already Exists (409):**
```json
{
  "success": false,
  "error": "Class already exists"
}
```

---

### 5.4 Update Class (Teacher only)
**PUT** `/classes/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "3A",
  "description": "Kelas 3A"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "class": {
      "id": "uuid",
      "name": "3A",
      "description": "Kelas 3A",
      "createdAt": "2025-12-19T09:08:00.578Z",
      "updatedAt": "2025-12-19T09:13:43.671Z",
      "_count": {
        "students": 0
      }
    }
  }
}
```

**Response Error - Class Already Exists (409):**
```json
{
  "success": false,
  "error": "Class already exists"
}
```

---

### 5.5 Delete Class (Teacher only)
**DELETE** `/classes/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Class deleted successfully",
  "data": null
}
```

---

## 6. Dashboard Endpoints

Dashboard menyediakan ringkasan data dan statistik untuk Teacher dan Student. Endpoint dashboard akan otomatis menyesuaikan berdasarkan role user yang login.

### 6.1 Get Dashboard Overview
**GET** `/dashboard/overview`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Example Request:**
```
GET /dashboard/overview
```

**Note:** Response akan berbeda berdasarkan role user (TEACHER atau STUDENT).

**Response Success (200) - Teacher:**
```json
{
  "success": true,
  "data": {
    "role": "TEACHER",
    "statistics": {
      "totalStudents": 32,
      "totalClasses": 5,
      "activeAssignments": 8,
      "pendingSubmissions": 24,
      "gradedSubmissions": 156,
      "averageScore": 85.5
    },
    "recentSubmissions": [
      {
        "id": "uuid",
        "studentName": "Rina Dewi",
        "studentNis": "12345",
        "assignmentTitle": "Lukisan Tema Alam",
        "grade": 95,
        "status": "GRADED",
        "submittedAt": "2024-01-15T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "studentName": "Budi Santoso",
        "studentNis": "12346",
        "assignmentTitle": "Sketsa Wajah",
        "grade": null,
        "status": "PENDING",
        "submittedAt": "2024-01-14T00:00:00.000Z"
      }
    ],
    "topStudents": [
      {
        "id": "uuid",
        "name": "Rina Dewi",
        "nis": "12345",
        "className": "XII IPA 1",
        "avgScore": 95,
        "portfolioCount": 12
      },
      {
        "id": "uuid",
        "name": "Maya Putri",
        "nis": "12347",
        "className": "XII IPA 1",
        "avgScore": 92,
        "portfolioCount": 10
      }
    ],
    "upcomingDeadlines": [
      {
        "id": "uuid",
        "title": "Lukisan Tema Alam",
        "deadline": "2024-01-20T23:59:59.000Z",
        "submissionCount": 24,
        "totalStudents": 32
      }
    ]
  }
}
```

**Response Success (200) - Student:**
```json
{
  "success": true,
  "data": {
    "role": "STUDENT",
    "statistics": {
      "portfolioCount": 12,
      "completedAssignments": 8,
      "totalAssignments": 10,
      "pendingAssignments": 2,
      "averageScore": 88.5,
      "highestScore": 95,
      "totalSubmissions": 12
    },
    "recentWorks": [
      {
        "id": "uuid",
        "title": "Lukisan Sunset Pantai",
        "category": "Lukisan",
        "grade": 95,
        "status": "GRADED",
        "submittedAt": "2024-01-15T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "title": "Sketsa Wajah",
        "category": "Sketsa",
        "grade": null,
        "status": "PENDING",
        "submittedAt": "2024-01-14T00:00:00.000Z"
      }
    ],
    "pendingAssignments": [
      {
        "id": "uuid",
        "title": "Lukisan Tema Alam",
        "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
        "deadline": "2024-01-20T23:59:59.000Z",
        "category": "Lukisan",
        "daysRemaining": 5,
        "mySubmission": {
          "id": "uuid",
          "status": "PENDING"
        }
      }
    ],
    "achievements": [
      {
        "id": "uuid",
        "name": "Seniman Pemula",
        "description": "Menyelesaikan 5 tugas pertama",
        "icon": "🎨",
        "unlockedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "name": "Kolektor Bintang",
        "description": "Mendapatkan nilai A pada 3 tugas",
        "icon": "⭐",
        "unlockedAt": "2024-01-05T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 7. Assignment Endpoints

### 7.1 Get All Assignments
**GET** `/assignments`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (DRAFT, ACTIVE, COMPLETED)
- `categoryId` (optional): Filter by category ID
- `classId` (optional): Filter by class ID
- `search` (optional): Search by title

**Example Request:**
```
GET /assignments?page=1&limit=10
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Lukisan Tema Desa",
      "description": "Buat lukisan dengan tema kehidupan di desa",
      "category": "Lukisan",
      "deadline": "2026-01-20T23:59:59.000Z",
      "status": "ACTIVE",
      "createdById": "uuid",
      "createdAt": "2025-12-19T09:52:13.935Z",
      "updatedAt": "2025-12-19T09:52:13.935Z",
      "createdBy": {
        "id": "uuid",
        "name": "Budi Arie",
        "email": null
      },
      "classes": [
        {
          "id": "uuid",
          "assignmentId": "uuid",
          "classId": "uuid",
          "createdAt": "2025-12-19T09:52:13.935Z",
          "class": {
            "id": "uuid",
            "name": "3B"
          }
        }
      ],
      "_count": {
        "submissions": 0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": null,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 7.2 Get Assignment by ID
**GET** `/assignments/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment retrieved successfully",
  "data": {
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Alam",
      "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
      "category": "Lukisan",
      "deadline": "2026-01-20T23:59:59.000Z",
      "status": "DRAFT",
      "createdById": "uuid",
      "createdAt": "2025-12-19T09:46:41.614Z",
      "updatedAt": "2025-12-19T09:46:41.614Z",
      "createdBy": {
        "id": "uuid",
        "name": "Budi Arie",
        "email": null
      },
      "classes": [
        {
          "id": "uuid",
          "assignmentId": "uuid",
          "classId": "uuid",
          "createdAt": "2025-12-19T09:46:41.614Z",
          "class": {
            "id": "uuid",
            "name": "1A"
          }
        }
      ],
      "submissions": []
    }
  }
}
```

---

### 7.3 Create Assignment (Teacher only)
**POST** `/assignments`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "title": "Lukisan Tema Desa",
  "description": "Buat lukisan dengan tema kehidupan di desa",
  "categoryId": "uuid-category-id",
  "status": "ACTIVE",
  "deadline": "2026-01-20T23:59:59.000Z",
  "classIds": [
    "dbaf99bb-40bd-424d-97d7-4ddc33822ac7"
  ]
}
```

**Validation:**
- `title`: required
- `description`: required
- `categoryId`: required, must be valid category ID
- `deadline`: required, must be in the future
- `classIds`: required, at least one class

**Response Success (201):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Alam",
      "description": "Buat lukisan dengan tema pemandangan alam Indonesia",
      "category": "Lukisan",
      "deadline": "2026-01-20T23:59:59.000Z",
      "status": "DRAFT",
      "createdById": "uuid",
      "createdAt": "2025-12-19T09:46:41.614Z",
      "updatedAt": "2025-12-19T09:46:41.614Z",
      "createdBy": {
        "id": "uuid",
        "name": "Budi Arie",
        "email": null
      },
      "classes": [
        {
          "id": "uuid",
          "assignmentId": "uuid",
          "classId": "uuid",
          "createdAt": "2025-12-19T09:46:41.614Z",
          "class": {
            "id": "uuid",
            "name": "1A"
          }
        }
      ]
    }
  }
}
```

---

### 7.4 Update Assignment (Teacher only)
**PUT** `/assignments/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "title": "Lukisan Tema Desa",
  "description": "Buat lukisan dengan tema kehidupan di desa",
  "categoryId": "uuid-category-id",
  "status": "ACTIVE",
  "deadline": "2026-01-20T23:59:59.000Z",
  "classIds": [
    "2b7bd002-a8b2-4237-b3a0-cf8f68c568c0"
  ]
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "data": {
    "assignment": {
      "id": "uuid",
      "title": "Lukisan Tema Desa",
      "description": "Buat lukisan dengan tema kehidupan di desa",
      "deadline": "2026-01-20T23:59:59.000Z",
      "updatedAt": "2025-12-19T10:00:00.000Z"
    }
  }
}
```

---

### 7.5 Delete Assignment (Teacher only)
**DELETE** `/assignments/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `action` (optional): `delete` | `draft` (default: `delete`)
  - `delete`: Hapus permanen
  - `draft`: Ubah status menjadi DRAFT

**Response Success (200):**
```json
{
  "success": true,
  "message": "Assignment deleted successfully",
  "data": null
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Assignment not found"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Cannot delete assignment: Has submissions"
}
```

---

### 7.6 Bulk Update Assignment Status (Teacher only)
**PUT** `/assignments/bulk-status`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "assignmentIds": [
    "uuid1",
    "uuid2",
    "uuid3"
  ],
  "status": "ACTIVE"  // "DRAFT", "ACTIVE", atau "COMPLETED"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Bulk status update completed",
  "data": {
    "total": 3,
    "success": 3,
    "failed": 0
  }
}
```

---

### 7.7 Bulk Delete Assignments (Teacher only)
**DELETE** `/assignments/bulk-delete`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "assignmentIds": [
    "uuid1",
    "uuid2",
    "uuid3"
  ],
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

## 8. Submission Endpoints

### 8.1 Get Submissions
**GET** `/submissions`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `assignmentId` (optional): Filter by assignment ID
- `studentId` (optional): Filter by student ID (Student can only see their own)
- `status` (optional): Filter by status

**Example Request:**
```
GET /submissions?page=1&limit=10
```

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

### 8.2 Get Submission by ID
**GET** `/submissions/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

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

### 8.3 Submit Assignment (Student only)
**POST** `/submissions`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `assignmentId` (required): Assignment ID
- `title` (required): Title of the submission
- `description` (required): Description of the artwork
- `image` (required): Image file (JPEG, PNG, or WebP)

**Example:**
```
assignmentId: 6e5cd248-43db-4625-bfda-24755212a9c2
title: gambar senja dan laut
description: karya tentang sunset di pantai
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
    "submission": {
      "id": "uuid",
      "assignmentId": "uuid",
      "studentId": "uuid",
      "title": "gambar senja dan laut",
      "description": "karya tentang sunset di pantai",
      "imageUrl": "http://localhost:9000/submissions/submission-1766141036002-5oeqi59i9f7.jpg",
      "imageThumbnail": "http://localhost:9000/submissions/thumb-submission-1766141036002-5oeqi59i9f7.jpg",
      "imageMedium": "http://localhost:9000/submissions/medium-submission-1766141036002-5oeqi59i9f7.jpg",
      "status": "PENDING",
      "grade": null,
      "feedback": null,
      "revisionCount": 0,
      "submittedAt": "2025-12-19T10:43:56.055Z",
      "gradedAt": null,
      "createdAt": "2025-12-19T10:43:56.057Z",
      "updatedAt": "2025-12-19T10:43:56.057Z",
      "assignment": {
        "id": "uuid",
        "title": "Lukisan Tema Desa",
        "category": "Lukisan"
      },
      "student": {
        "id": "uuid",
        "name": "Wahyu Dwi",
        "nis": "2025123456789",
        "avatar": null
      }
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Assignment deadline has passed"
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

### 8.4 Update Submission
**PUT** `/submissions/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: multipart/form-data` (jika upload gambar baru) atau `application/json` (jika hanya update text)

**Body (application/json - tanpa gambar):**
```json
{
  "title": "Lukisan Sunset Pantai (Revisi)",
  "description": "Updated description"
}
```

**Body (multipart/form-data - dengan gambar baru):**
- `title` (optional): Title of the submission
- `description` (optional): Description of the artwork
- `image` (optional): New image file (JPEG, PNG, or WebP)

**Note:** 
- Bisa update jika status = `PENDING` (edit sebelum dinilai)
- Bisa update jika status = `REVISION` (upload revisi setelah mendapat feedback dari guru)
- Jika status = `REVISION` dan diupdate, status akan otomatis berubah menjadi `PENDING` dan `submittedAt` akan diupdate
- Jika upload gambar baru, semua field (title, description, image) optional
- Jika tidak upload gambar, hanya bisa update title dan description
- Gambar baru akan menggantikan gambar lama

**File Validation (jika upload gambar):**
- File type: `image/jpeg`, `image/png`, `image/webp`
- Max file size: `10MB`
- Min dimensions: `800x600px` (recommended: `1200x800px` untuk zoom support)
- Max dimensions: `2400x1600px` (akan di-resize otomatis)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission updated successfully",
  "data": {
    "submission": {
      "id": "uuid",
      "assignmentId": "uuid",
      "studentId": "uuid",
      "title": "Lukisan Sunset Pantai (Revisi)",
      "description": "Updated description",
      "imageUrl": "http://localhost:9000/submissions/submission-1766142160667-bpiwxmtrr2a.jpg",
      "imageThumbnail": "http://localhost:9000/submissions/thumb-submission-1766142160667-bpiwxmtrr2a.jpg",
      "imageMedium": "http://localhost:9000/submissions/medium-submission-1766142160667-bpiwxmtrr2a.jpg",
      "status": "PENDING",
      "grade": null,
      "feedback": null,
      "revisionCount": 0,
      "submittedAt": "2025-12-19T11:02:40.716Z",
      "gradedAt": null,
      "createdAt": "2025-12-19T11:02:40.719Z",
      "updatedAt": "2025-12-19T11:07:02.345Z",
      "assignment": {
        "id": "uuid",
        "title": "Lukisan Tema Desa"
      },
      "student": {
        "id": "uuid",
        "name": "Wahyu Dwi",
        "nis": "2025123456789"
      }
    }
  }
}
```

**Note:** Jika submission sebelumnya berstatus `REVISION`, setelah diupdate status akan menjadi `PENDING` dan `submittedAt` akan diupdate ke waktu saat ini.

**Response Error (400):**
```json
{
  "success": false,
  "error": "Cannot update submission: Already graded"
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

### 8.5 Cancel Submission (Student only)
**DELETE** `/submissions/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Note:** 
- Hanya bisa cancel jika status = `PENDING`
- Setelah cancel, submission akan dihapus

**Response Success (200):**
```json
{
  "success": true,
  "message": "Submission deleted successfully",
  "data": null
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Cannot cancel submission: Already graded or in revision"
}
```

---

### 8.6 Grade Submission (Teacher only)
**POST** `/submissions/:id/grade`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

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
    "submission": {
      "id": "uuid",
      "assignmentId": "uuid",
      "studentId": "uuid",
      "title": "gambar senja dan laut",
      "description": "karya tentang sunset di pantai",
      "imageUrl": "http://localhost:9000/submissions/submission-1766142525362-adxz14biaxp.jpg",
      "imageThumbnail": "http://localhost:9000/submissions/thumb-submission-1766142525362-adxz14biaxp.jpg",
      "imageMedium": "http://localhost:9000/submissions/medium-submission-1766142525362-adxz14biaxp.jpg",
      "status": "GRADED",
      "grade": 95,
      "feedback": "Karya yang sangat bagus! Penggunaan warna sangat harmonis.",
      "revisionCount": 0,
      "submittedAt": "2025-12-19T11:08:45.431Z",
      "gradedAt": "2025-12-19T11:12:35.575Z",
      "createdAt": "2025-12-19T11:08:45.432Z",
      "updatedAt": "2025-12-19T11:12:35.576Z",
      "assignment": {
        "id": "uuid",
        "title": "Lukisan Tema Desa"
      },
      "student": {
        "id": "uuid",
        "name": "Wahyu Dwi",
        "email": null,
        "nis": "2025123456789"
      }
    }
  }
}
```

---

### 8.7 Return for Revision (Teacher only)
**POST** `/submissions/:id/revision`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

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
    "submission": {
      "id": "uuid",
      "assignmentId": "uuid",
      "studentId": "uuid",
      "title": "gambar gunung sunan ibu",
      "description": "karya tentang gunung",
      "imageUrl": "http://localhost:9000/submissions/submission-1766142924422-hei6208nsc6.jpg",
      "imageThumbnail": "http://localhost:9000/submissions/thumb-submission-1766142924422-hei6208nsc6.jpg",
      "imageMedium": "http://localhost:9000/submissions/medium-submission-1766142924422-hei6208nsc6.jpg",
      "status": "REVISION",
      "grade": null,
      "feedback": null,
      "revisionCount": 1,
      "submittedAt": "2025-12-19T11:15:24.460Z",
      "gradedAt": null,
      "createdAt": "2025-12-19T11:15:24.462Z",
      "updatedAt": "2025-12-19T11:18:17.755Z",
      "assignment": {
        "id": "uuid",
        "title": "Lukisan Tema Desa"
      },
      "student": {
        "id": "uuid",
        "name": "Siti Nurhaliza",
        "email": null,
        "nis": "2025123456791"
      },
      "revisions": [
        {
          "id": "uuid",
          "submissionId": "uuid",
          "revisionNote": "Warna kurang kontras, tolong perbaiki bagian langit",
          "imageUrl": "",
          "submittedAt": "2025-12-19T11:18:17.751Z"
        }
      ]
    }
  }
}
```

---

## 9. Export Endpoints

Export endpoints digunakan untuk mengekspor data nilai dan laporan dalam format Excel atau PDF.

### 9.1 Export Grades to Excel
**POST** `/export/grades/excel`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "classIds": [],  // Optional, filter by classes
  "assignmentIds": [],  // Optional, filter by assignments
  "studentIds": [],  // Optional, filter by students
  "statuses": ["GRADED"],  // Optional, filter by submission status
  "startDate": "2024-01-01T00:00:00.000Z",  // Optional, filter by date range
  "endDate": "2024-12-31T23:59:59.000Z"  // Optional, filter by date range
}
```

**Note:** Teacher can export all data, Student can only export their own data.

**Response Success (200):**
```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="seniku-grades-export-2024-01-16.xlsx"

<binary file data>
```

**Excel Format:**
- Sheet 1: Summary (Total students, Total assignments, Average score, etc.)
- Sheet 2: Grades by Student (NIS, Nama, Kelas, Assignment, Grade, Feedback, Date)
- Sheet 3: Grades by Assignment (Assignment, Student, Grade, Feedback, Date)

**Response Error - No Data (404):**
```json
{
  "success": false,
  "error": "No data found for the specified filters"
}
```

**Note:**
- Teacher dapat export semua data
- Student hanya dapat export data mereka sendiri (studentIds akan di-ignore, otomatis menggunakan student ID dari token)

---

### 9.2 Export Grades to PDF
**POST** `/export/grades/pdf`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "classIds": [],  // Optional, filter by classes
  "assignmentIds": [],  // Optional, filter by assignments
  "studentIds": [],  // Optional, filter by students
  "statuses": ["GRADED"],  // Optional, filter by submission status
  "startDate": "2024-01-01T00:00:00.000Z",  // Optional
  "endDate": "2024-12-31T23:59:59.000Z",  // Optional
  "format": "detailed"  // Optional: "summary" or "detailed" (default: "detailed")
}
```

**Note:** Format can be 'summary' or 'detailed' (default: 'detailed'). Teacher can export all data, Student can only export their own data.

**Response Success (200):**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="seniku-grades-report-2024-01-16.pdf"

<binary file data>
```

**PDF Format:**
- Cover page dengan judul dan tanggal export
- Summary statistics (jika format = "summary")
- Detailed grades table dengan:
  - Student information (NIS, Nama, Kelas)
  - Assignment information
  - Grade dan feedback
  - Submission date dan graded date
- Footer dengan informasi export

**Response Error - No Data (404):**
```json
{
  "success": false,
  "error": "No data found for the specified filters"
}
```

**Note:**
- Format "summary" hanya menampilkan ringkasan statistik
- Format "detailed" menampilkan semua detail nilai per submission
- Teacher dapat export semua data
- Student hanya dapat export data mereka sendiri

---

### 9.3 Export Student Report Card (PDF)
**GET** `/export/report-card/:studentId`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `format` (optional): `summary` or `detailed` (default: `detailed`)

**Example Request:**
```
GET /export/report-card/:studentId?format=detailed
```

**Note:** Student can only export their own report card, Teacher can export any student's report card.

**Response Success (200):**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="report-card-rina-dewi-2024-01-16.pdf"

<binary file data>
```

**PDF Format:**
- Cover dengan foto dan informasi siswa
- Summary statistics (Total assignments, Completed, Average score, etc.)
- List semua assignment dengan status dan nilai
- Grafik perkembangan nilai (jika ada)
- Portfolio highlights (karya terbaik)

**Response Error (403):**
```json
{
  "success": false,
  "error": "Forbidden: You can only export your own report card"
}
```

**Note:**
- Student hanya bisa export report card mereka sendiri
- Teacher bisa export report card semua siswa

---

## 10. Achievement System & Flow

### Achievement Overview

Achievement system adalah sistem gamification yang memberikan badge/achievement kepada siswa berdasarkan pencapaian mereka dalam menyelesaikan tugas dan mendapatkan nilai.

### Achievement Flow

**1. Achievement Definition (Manual Setup)**
- Achievement dibuat oleh **Teacher/Admin** melalui API endpoint
- Setiap achievement memiliki:
  - `name`: Nama achievement (e.g., "Seniman Pemula") - **unique**
  - `description`: Deskripsi achievement
  - `icon`: Icon/emoji untuk achievement (max 10 karakter)
  - `criteria`: JSON object yang berisi kondisi untuk unlock achievement (optional)

**2. Achievement Unlock Trigger (Automatic)**
Achievement akan di-check dan di-unlock secara otomatis pada event berikut:

**a. Setelah Submission di-Grade (Status = GRADED)**
- Sistem akan check semua achievement yang belum di-unlock oleh student
- Check criteria achievement berdasarkan:
  - Total submission yang sudah di-grade
  - Total nilai yang didapat
  - Rata-rata nilai
  - Nilai tertinggi
  - Kategori assignment yang sudah diselesaikan
  - Dll (sesuai criteria di JSON)

**b. Setelah Student Menyelesaikan Assignment**
- Check achievement berdasarkan jumlah assignment yang diselesaikan
- Check achievement berdasarkan kategori assignment

**3. Achievement Check Logic (Pseudo Code)**
```
When: Submission status changed to GRADED
  1. Get all achievements that student hasn't unlocked yet
  2. For each achievement:
     a. Check criteria from achievement.criteria (JSON)
     b. If criteria met:
        - Create UserAchievement record (via unlockAchievement service)
        - Create Notification (type: ACHIEVEMENT_UNLOCKED)
        - Return achievement info
```

**4. Achievement Criteria Examples (JSON Format)**
```json
{
  "type": "total_graded_submissions",
  "value": 5,
  "operator": ">="
}
```

```json
{
  "type": "average_grade",
  "value": 85,
  "operator": ">="
}
```

```json
{
  "type": "highest_grade",
  "value": 95,
  "operator": ">="
}
```

```json
{
  "type": "category_completion",
  "categories": ["Lukisan", "Sketsa", "Kolase"],
  "operator": "all"
}
```

---

### 10.1 Get All Achievements
**GET** `/achievements`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name or description

**Response Success (200):**
```json
{
  "success": true,
  "message": "Achievements retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Seniman Pemula",
      "description": "Menyelesaikan 5 tugas pertama",
      "icon": "🎨",
      "criteria": {
        "type": "total_graded_submissions",
        "value": 5,
        "operator": ">="
      },
      "userCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid",
      "name": "Kolektor Bintang",
      "description": "Mendapatkan nilai A pada 3 tugas",
      "icon": "⭐",
      "criteria": {
        "type": "grade_count",
        "value": 3,
        "minGrade": 90,
        "operator": ">="
      },
      "userCount": 8,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

### 10.2 Get Achievement by ID
**GET** `/achievements/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Achievement retrieved successfully",
  "data": {
    "achievement": {
      "id": "uuid",
      "name": "Seniman Pemula",
      "description": "Menyelesaikan 5 tugas pertama",
      "icon": "🎨",
      "criteria": {
        "type": "total_graded_submissions",
        "value": 5,
        "operator": ">="
      },
      "userCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": "Not found"
}
```

---

### 10.3 Get User Achievements
**GET** `/achievements/me/achievements`

**Headers:**
- `Authorization: Bearer <accessToken>`
- User hanya bisa melihat achievement mereka sendiri

**Response Success (200):**
```json
{
  "success": true,
  "message": "User achievements retrieved successfully",
  "data": {
    "achievements": [
      {
        "id": "uuid",
        "name": "Seniman Pemula",
        "description": "Menyelesaikan 5 tugas pertama",
        "icon": "🎨",
        "criteria": {
          "type": "total_graded_submissions",
          "value": 5,
          "operator": ">="
        },
        "unlockedAt": "2024-01-05T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "name": "Kolektor Bintang",
        "description": "Mendapatkan nilai A pada 3 tugas",
        "icon": "⭐",
        "criteria": {
          "type": "grade_count",
          "value": 3,
          "minGrade": 90,
          "operator": ">="
        },
        "unlockedAt": "2024-01-10T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 10.4 Create Achievement (Teacher/Admin only)
**POST** `/achievements`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Seniman Pemula",
  "description": "Menyelesaikan 5 tugas pertama",
  "icon": "🎨",
  "criteria": {
    "type": "total_graded_submissions",
    "value": 5,
    "operator": ">="
  }
}
```

**Note:** Criteria is optional JSON object for achievement unlock conditions.

**Validation:**
- `name`: required, min 1 character, max 100 characters, must be unique
- `description`: required, min 1 character, max 500 characters
- `icon`: required, min 1 character, max 10 characters (emoji or short string)
- `criteria`: optional, JSON object

**Response Success (201):**
```json
{
  "success": true,
  "message": "Achievement created successfully",
  "data": {
    "achievement": {
      "id": "uuid",
      "name": "Seniman Pemula",
      "description": "Menyelesaikan 5 tugas pertama",
      "icon": "🎨",
      "criteria": {
        "type": "total_graded_submissions",
        "value": 5,
        "operator": ">="
      },
      "userCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Response Error (409):**
```json
{
  "success": false,
  "message": "name already exists"
}
```

---

### 10.5 Update Achievement (Teacher/Admin only)
**PUT** `/achievements/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Seniman Pemula Updated",
  "description": "Updated description",
  "icon": "🎨",
  "criteria": {
    "type": "total_graded_submissions",
    "value": 10,
    "operator": ">="
  }
}
```

**Note:** All fields are optional.

**Validation:**
- All fields are optional
- Same validation rules as create

**Response Success (200):**
```json
{
  "success": true,
  "message": "Achievement updated successfully",
  "data": {
    "achievement": {
      "id": "uuid",
      "name": "Seniman Pemula Updated",
      "description": "Updated description",
      "icon": "🎨",
      "criteria": {
        "type": "total_graded_submissions",
        "value": 10,
        "operator": ">="
      },
      "userCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  }
}
```

---

### 10.6 Delete Achievement (Teacher/Admin only)
**DELETE** `/achievements/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `force` (optional): Force delete even if achievement has users (default: false)

**Example Request:**
```
DELETE /achievements/:id?force=false
```

**Note:** Use force=true to delete even if achievement has users.

**Response Success (200):**
```json
{
  "success": true,
  "message": "Achievement deleted successfully"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Cannot delete achievement: Has users. Use force=true to force delete."
}
```

### Achievement Relasi dengan Table/Endpoint Lain

**1. Relasi Database:**
- `Achievement` table: Menyimpan definisi achievement
- `UserAchievement` table: Junction table (many-to-many) antara User dan Achievement
- `User.achievements`: Relasi one-to-many ke UserAchievement
- `Achievement.users`: Relasi one-to-many ke UserAchievement

**2. Relasi dengan Submission:**
- Achievement di-check setiap kali submission di-grade
- Achievement criteria bisa berdasarkan:
  - Total submission yang sudah di-grade
  - Nilai yang didapat
  - Rata-rata nilai
  - Kategori assignment

**3. Relasi dengan Notification:**
- Ketika achievement di-unlock, sistem akan membuat notification dengan type `ACHIEVEMENT_UNLOCKED`
- Notification akan dikirim ke student yang unlock achievement

**4. Relasi dengan Dashboard:**
- Dashboard student menampilkan achievement yang sudah di-unlock
- Dashboard menampilkan progress achievement (jika belum di-unlock)

**5. Relasi dengan Portfolio:**
- Achievement bisa ditampilkan di portfolio student
- Achievement menunjukkan pencapaian student

### Achievement Implementation Notes

**Backend Implementation:**
1. Service untuk check achievement criteria (`achievement.service.ts`)
2. Service method: `checkAndUnlockAchievements(userId: string)`
3. Panggil service ini setelah submission di-grade
4. Service akan:
   - Get all achievements yang belum di-unlock
   - Check criteria untuk setiap achievement
   - Jika criteria met, create UserAchievement
   - Create notification

**Frontend Implementation:**
1. Display achievement di dashboard student
2. Show notification ketika achievement di-unlock
3. Show achievement progress (current/target)
4. Display achievement di profile/portfolio

---

## 11. Notification Endpoints

**Notification Flow:**
- Notification dibuat otomatis oleh sistem untuk semua user (Student dan Teacher)
- Setiap user hanya melihat notification mereka sendiri
- Notification dibuat saat:
  - **ASSIGNMENT_CREATED**: Teacher membuat assignment baru (status ACTIVE) → semua student di kelas yang ditugaskan menerima notification
  - **SUBMISSION_GRADED**: Teacher meng-grade submission → student yang submit menerima notification
  - **SUBMISSION_REVISION**: Teacher return for revision → student yang submit menerima notification
  - **ASSIGNMENT_DEADLINE**: (Future) Reminder deadline assignment
  - **ACHIEVEMENT_UNLOCKED**: (Future) Student mendapatkan achievement baru
  - **GENERAL**: Notifikasi umum dari sistem/admin

---

### 11.1 Get Notifications
**GET** `/notifications`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isRead` (optional): Filter by read status (true/false)

**Example Request:**
```
GET /notifications?page=1&limit=10&isRead=false
```

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
        "message": "Karya 'Lukisan Sunset Pantai' telah dinilai dengan nilai A (95)",
        "link": "/submissions/uuid",
        "isRead": false,
        "createdAt": "2024-01-16T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "type": "ASSIGNMENT_CREATED",
        "title": "Tugas Baru",
        "message": "Tugas baru 'Lukisan Tema Alam' telah dibuat. Deadline: 20/01/2024",
        "link": "/assignments/uuid",
        "isRead": false,
        "createdAt": "2024-01-15T00:00:00.000Z"
      },
      {
        "id": "uuid",
        "type": "SUBMISSION_REVISION",
        "title": "Karya Perlu Direvisi",
        "message": "Karya 'Lukisan Sunset Pantai' perlu direvisi. Warna kurang kontras, tolong perbaiki bagian langit...",
        "link": "/submissions/uuid",
        "isRead": false,
        "createdAt": "2024-01-14T00:00:00.000Z"
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

### 11.2 Get Notification by ID
**GET** `/notifications/:id`

**Headers:**
- `Authorization: Bearer <accessToken>`
- User hanya bisa akses notification mereka sendiri

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": "uuid",
      "type": "SUBMISSION_GRADED",
      "title": "Karya Dinilai",
      "message": "Karya 'Lukisan Sunset Pantai' telah dinilai dengan nilai A (95)",
      "link": "/submissions/uuid",
      "isRead": false,
      "createdAt": "2024-01-16T00:00:00.000Z"
    }
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": "Notification not found"
}
```

---

### 11.3 Mark Notification as Read
**PUT** `/notifications/:id/read`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": null
}
```

---

### 11.4 Mark All Notifications as Read
**PUT** `/notifications/read-all`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

---

### 11.5 Get Unread Notification Count
**GET** `/notifications/unread/count`

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
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

## JWT Token Management

- Access Token expires dalam 15 menit
- Refresh Token expires dalam 7 hari
- Access Token dikirim melalui header `Authorization: Bearer <token>`
- Refresh Token dikirim melalui body request di endpoint `/auth/refresh`
- Logout akan meng-invalidate semua refresh token dengan increment `tokenVersion`
- Jika access token expired, gunakan refresh token untuk mendapatkan access token baru

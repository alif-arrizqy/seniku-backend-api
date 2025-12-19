# Seniku Backend API - Dokumentasi

Dokumentasi lengkap untuk backend API aplikasi Seniku (E-Portfolio Seni Digital).

## 📚 Daftar Dokumen

1. **[01-ANALISIS-APLIKASI.md](./docs/01-ANALISIS-APLIKASI.md)**
   - Overview aplikasi
   - Fitur utama
   - User roles dan workflow
   - Status dan kategori

2. **[02-DATABASE-SCHEMA.md](./docs/02-DATABASE-SCHEMA.md)**
   - Entity Relationship Diagram (ERD)
   - Database tables dengan Prisma schema
   - Enums dan indexes
   - Constraints dan relationships
   - **Update**: Tambahan field NIS untuk Student

3. **[03-API-ENDPOINTS.md](./docs/03-API-ENDPOINTS.md)**
   - Daftar lengkap semua API endpoints
   - Request parameters dan body
   - Response format (success & error)
   - Query parameters dan pagination
   - **Update**: Session-based authentication (bukan JWT)

4. **[04-REQUEST-RESPONSE-EXAMPLES.md](./docs/04-REQUEST-RESPONSE-EXAMPLES.md)**
   - Contoh lengkap request dan response
   - Success cases
   - Error cases dengan berbagai skenario
   - HTTP status codes

5. **[07-DATA-FLOW-FRONTEND.md](./docs/07-DATA-FLOW-FRONTEND.md)** ⭐ NEW
   - Detail data yang diperlukan untuk setiap halaman frontend
   - Query SQL untuk setiap endpoint
   - Data aggregation examples
   - Performance optimization strategies
   - Caching strategies

6. **[08-UPDATE-SUMMARY.md](./docs/08-UPDATE-SUMMARY.md)** ⭐ NEW
   - Ringkasan semua perubahan terbaru
   - Breaking changes
   - Migration checklist
   - Testing checklist

7. **[09-MINIO-STORAGE.md](./docs/09-MINIO-STORAGE.md)** ⭐ NEW
   - MinIO integration guide
   - Database schema untuk file storage
   - Bucket structure
   - Implementation examples

8. **[10-PROJECT-STRUCTURE.md](./docs/10-PROJECT-STRUCTURE.md)** ⭐ NEW
   - Struktur lengkap folder dan file
   - Penjelasan setiap folder dan file
   - Data flow dan best practices
   - File creation order

## 🚀 Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Session-based (Cookie)
- **Logging**: Pino
- **File Storage**: Cloud Storage (S3/Cloudinary recommended)

## 🔐 Authentication

Sistem menggunakan **Session-based Authentication** (bukan JWT):

- Login menggunakan **email** atau **NIS** (untuk siswa)
- Session disimpan di server
- Cookie dikirim otomatis oleh browser
- Session expired setelah periode tertentu (default: 7 hari)

### Login Flow

1. **Email Login**: Semua user (Teacher & Student) bisa login dengan email
2. **NIS Login**: Hanya Student yang bisa login dengan NIS
3. Backend akan otomatis detect apakah identifier adalah email atau NIS

## 📋 Quick Start

### 1. Database Setup

Lihat [02-DATABASE-SCHEMA.md](./docs/02-DATABASE-SCHEMA.md) untuk schema lengkap.

**Key Points:**
- User model memiliki field `nis` (unique, hanya untuk STUDENT)
- Email optional untuk STUDENT, required untuk TEACHER
- NIS hanya untuk STUDENT

### 2. API Endpoints

Lihat [03-API-ENDPOINTS.md](./docs/03-API-ENDPOINTS.md) untuk daftar lengkap endpoints.

**Authentication:**
- `POST /auth/register` - Register user baru
- `POST /auth/login` - Login dengan email atau NIS
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current session

### 3. Request/Response Examples

Lihat [04-REQUEST-RESPONSE-EXAMPLES.md](./docs/04-REQUEST-RESPONSE-EXAMPLES.md) untuk contoh penggunaan.

### 4. API Flow Detail

Lihat [06-API-FLOW-DETAIL.md](./docs/06-API-FLOW-DETAIL.md) untuk flow detail penyajian data API ke frontend.

## 🔄 Recent Updates

### Version 2.2.0 (2024-01-16)

**Major Changes:**
1. **Grade System**: Changed from string (A+, A, A-) to number (0-100)
2. **Category Management**: Added category field to assignments
3. **Bulk Operations**: Added bulk delete assignments endpoint
4. **Submission Workflow**: Added edit/cancel submission for students
5. **Data Flow Documentation**: Added detailed data flow documentation

**Key Features:**
- Grade menggunakan number 0-100 (bukan string)
- Assignment memiliki category field (required)
- Category management endpoints (CRUD)
- Student bisa edit/cancel submission jika status PENDING
- Teacher bisa bulk delete assignments
- Teacher bisa edit assignment

**Breaking Changes:**
- ⚠️ Grade field type changed: `string` → `number` (0-100)
- Migration required untuk existing data

### Version 2.0.0 (2024-01-16)

**Major Changes:**
1. **Authentication**: Changed from JWT to Session-based authentication
2. **NIS Field**: Added NIS (Nomor Induk Siswa) field for students
3. **Login**: Support login with email or NIS
4. **Flow Documentation**: Added detailed API flow documentation

**Key Features:**
- Session-based auth dengan cookie
- Login menggunakan email (semua user) atau NIS (hanya student)
- NIS unique untuk setiap student
- Email optional untuk student, required untuk teacher

## 📝 Notes

1. **Authentication**: Semua endpoint (kecuali auth) memerlukan session cookie
2. **Pagination**: Default: page=1, limit=10, max limit=100
3. **File Upload**: Menggunakan `multipart/form-data`
4. **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
5. **Error Format**: Konsisten dengan `success`, `message`, dan `errors` fields

## 🔐 Security

- Session-based authentication dengan HttpOnly cookies
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- File upload validation
- CORS configuration
- Input validation dan sanitization

## 📊 Database

- PostgreSQL dengan Prisma ORM
- Indexes untuk optimasi query
- Foreign key constraints dengan cascade delete
- Unique constraints untuk NIS dan email

## 🎯 Next Steps

1. Setup project structure
2. Install dependencies
3. Configure database connection
4. Setup session store (database atau Redis)
5. Implement authentication dengan session
6. Create API endpoints
7. Add file upload handling
8. Implement image processing (optional)
9. Setup logging dengan Pino
10. Add error handling
11. Write tests

## 📞 Support

Untuk pertanyaan atau update dokumentasi, silakan buat issue atau pull request.

---

**Last Updated**: 2024-01-16
**Version**: 2.2.0

---

## 📋 Quick Reference

### Grade System
- **Type**: Number (0-100)
- **Ranges**:
  - 90-100: Excellent (Hijau)
  - 80-89: Good (Biru)
  - 70-79: Fair (Kuning)
  - 60-69: Needs Improvement (Orange)
  - 0-59: Poor (Abu-abu)

### Categories
- Default categories: Lukisan, Sketsa, Kolase, Digital, Patung, Fotografi, Desain
- Teacher bisa menambah kategori baru
- Category required saat create assignment

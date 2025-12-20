# Seniku Backend API

Backend API untuk aplikasi Seniku (E-Portfolio Seni Digital).

## 🚀 Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Logging**: Pino
- **File Storage**: MinIO (S3-compatible)
- **Image Processing**: Sharp

## 🔐 Authentication

Sistem menggunakan **JWT (JSON Web Token)** untuk authentication:

- Login menggunakan **NIP** (untuk guru) atau **NIS** (untuk siswa)
- Token dikirim melalui `Authorization: Bearer <token>` header
- Token expired setelah periode tertentu (default: 7 hari)


## 📦 Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd seniku-backend-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   - Copy `env.example.txt` ke `.env`
   - Isi semua variabel yang diperlukan (database, JWT secret, MinIO, dll)

4. **Setup database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Seed database (optional)**
   ```bash
   npm run seed
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

## 📝 Notes

- **Authentication**: Semua endpoint (kecuali auth) memerlukan JWT token di header
- **Pagination**: Default: page=1, limit=10, max limit=100
- **File Upload**: Menggunakan `multipart/form-data`
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Error Format**: Konsisten dengan `success`, `message`, dan `errors` fields

## 🔐 Security

- JWT authentication dengan Bearer token
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

---

**Last Updated**: 2025-12-19  
**Version**: 3.0.0

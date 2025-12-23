# Seniku Backend API

Backend API untuk aplikasi Seniku (E-Portfolio Seni Digital).

## 🚀 Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL/Supabase
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Logging**: Pino
- **File Storage**: MinIO (S3-compatible)
- **Image Processing**: Sharp


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
   npm run prisma:generate
   
   npm run prisma:push
   ```

5. **Seed database (optional)**
   ```bash
   npm run seed
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

### 🗄️ Supabase Setup

Aplikasi ini mendukung PostgreSQL lokal maupun Supabase. Untuk menggunakan Supabase:

1. **Buat project di Supabase**
   - Kunjungi [supabase.com](https://supabase.com)
   - Buat project baru
   - Catat `PROJECT-REF` dan password database

2. **Ambil Connection String**
   - Buka Settings > Database di Supabase dashboard
   - Copy connection string dari bagian "Connection string"
   - Pilih "URI" atau "Connection pooling" sesuai kebutuhan

3. **Update Environment Variables**
   - Update `DATABASE_URL` di `.env` dengan connection string Supabase
   - **Untuk Connection Pooler** (direkomendasikan untuk production):
     ```env
     DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
     DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
     ```
   - **Untuk Direct Connection** (untuk development):
     ```env
     DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
     ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   # atau untuk development
   npx prisma migrate dev
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

---

**Last Updated**: 2025-12-23
**Version**: 3.0.0

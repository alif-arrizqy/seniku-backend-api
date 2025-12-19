# Installation Guide - Seniku Backend API

Panduan lengkap untuk setup dan install proyek backend API Seniku.

---

## 📋 Prerequisites

Sebelum memulai, pastikan sudah terinstall:

- **Node.js**: v20.x atau lebih tinggi (LTS recommended)
- **PostgreSQL**: v14.x atau lebih tinggi
- **npm/yarn/pnpm**: Package manager
- **Git**: Version control

### Check Versions

```bash
node --version    # Should be v20.x or higher
npm --version     # Should be v9.x or higher
psql --version    # Should be v14.x or higher
```

---

## 🚀 Quick Start

### 1. Clone Repository (jika menggunakan Git)

```bash
git clone <repository-url>
cd seniku-backend-api
```

### 2. Install Dependencies

```bash
npm install
```

Atau:

```bash
yarn install
```

Atau:

```bash
pnpm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project:

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi yang sesuai:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/seniku_db?schema=public"

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Session
SESSION_SECRET="your-super-secret-session-key-change-in-production"
SESSION_COOKIE_NAME="seniku_session"
SESSION_MAX_AGE=604800000  # 7 days in milliseconds

# CORS
CORS_ORIGIN="http://localhost:5173"  # Frontend URL

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="./uploads"

# Image Processing
IMAGE_MAX_WIDTH=2400
IMAGE_MAX_HEIGHT=1600
IMAGE_THUMBNAIL_SIZE=300
IMAGE_MEDIUM_SIZE=800

# Logging
LOG_LEVEL="info"
```

### 4. Setup Database

#### 4.1 Create Database

```bash
# Login ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE seniku_db;

# Exit
\q
```

#### 4.2 Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

Swagger UI akan tersedia di `http://localhost:3000/docs`

---

## 📁 Project Structure

Setelah setup, struktur project akan seperti ini:

```
seniku-backend-api/
├── .env                    # Environment variables
├── .env.example            # Example env file
├── .gitignore
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts             # Database seed
├── src/
│   ├── server.ts           # Main server file
│   ├── app.ts              # Fastify app setup
│   ├── config/
│   │   └── env.ts          # Environment config
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   ├── assignments.ts  # Assignment routes
│   │   ├── submissions.ts # Submission routes
│   │   ├── students.ts    # Student routes
│   │   ├── portfolio.ts   # Portfolio routes
│   │   └── categories.ts   # Category routes
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── assignment.controller.ts
│   │   └── ...
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── assignment.service.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── file-upload.ts
│   │   └── image-processor.ts
│   └── types/
│       └── index.ts
└── dist/                   # Compiled TypeScript (after build)
```

---

## 🔧 Configuration

### TypeScript Configuration

File `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Prisma Configuration

File `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 🧪 Testing Setup

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

---

## 📦 Build for Production

### 1. Build TypeScript

```bash
npm run build
```

### 2. Start Production Server

```bash
npm start
```

### 3. Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name seniku-api

# Save PM2 configuration
pm2 save
pm2 startup
```

---

## 🔐 Security Checklist

Sebelum deploy ke production:

- [ ] Change `SESSION_SECRET` to strong random string
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS
- [ ] Setup rate limiting
- [ ] Configure helmet security headers
- [ ] Use environment variables untuk sensitive data
- [ ] Setup database backups
- [ ] Review file upload limits
- [ ] Setup logging dan monitoring

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d seniku_db
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma Client
npm run prisma:generate
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

1. **Setup Database**: Pastikan PostgreSQL sudah running
2. **Configure Environment**: Edit `.env` file
3. **Run Migrations**: Setup database schema
4. **Start Server**: Run development server
5. **Test API**: Akses Swagger UI di `/docs`
6. **Read Documentation**: Lihat `docs/` folder untuk detail API

---

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

---

## 📞 Support

Jika ada masalah saat installation:

1. Check Prerequisites sudah terinstall
2. Check `.env` file sudah dikonfigurasi dengan benar
3. Check database connection
4. Check logs untuk error messages
5. Review documentation di `docs/` folder

---

**Last Updated**: 2024-01-16  
**Version**: 1.0.0


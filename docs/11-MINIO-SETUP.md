# MinIO Setup Guide - Seniku Backend API

Panduan lengkap untuk setup dan konfigurasi MinIO untuk project Seniku.

---

## 📋 Prerequisites

- MinIO sudah di-download dan executable tersedia
- MinIO server sudah running
- Access ke MinIO Console (http://127.0.0.1:9001)

---

## 🚀 Setup MinIO

### 1. Menjalankan MinIO Server

#### Windows (Command Prompt / PowerShell)

```bash
# Basic command
D:\minio.exe server D:\projects\seniku\seniku-backend-api\minio-data --console-address ":9001"

# Dengan custom access key dan secret key
D:\minio.exe server D:\projects\seniku\seniku-backend-api\minio-data --console-address ":9001" --address ":9000"
```

#### Environment Variables (Optional)

Buat file `.env` atau set environment variables:

```bash
# Set di PowerShell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadmin123"

# Atau di Command Prompt
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin123
```

#### Menjalankan dengan Environment Variables

```bash
D:\minio.exe server D:\projects\seniku\seniku-backend-api\minio-data --console-address ":9001"
```

**Default Credentials:**
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

**⚠️ PENTING:** Ganti credentials di production!

---

### 2. Akses MinIO Console

1. Buka browser: `http://127.0.0.1:9001`
2. Login dengan credentials:
   - Username: `minioadmin`
   - Password: `minioadmin`

---

## 🪣 Setup Buckets

### 3. Membuat Buckets

#### Via MinIO Console (GUI)

1. Login ke MinIO Console
2. Klik **"Buckets"** di sidebar
3. Klik **"Create Bucket"**
4. Buat 3 buckets:
   - `avatars` - Untuk user avatars
   - `submissions` - Untuk submission artwork
   - `temp` - Untuk temporary uploads

#### Via MinIO Client (mc) - Recommended

Install MinIO Client: https://min.io/docs/minio/linux/reference/minio-mc.html

```bash
# Setup alias
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin

# Create buckets
mc mb local/avatars
mc mb local/submissions
mc mb local/temp
```

#### Via Code (Setup Script)

Buat file `scripts/setup-minio.ts`:

```typescript
import { Client } from 'minio';
import * as dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const buckets = [
  { name: 'avatars', policy: 'public' },
  { name: 'submissions', policy: 'public' },
  { name: 'temp', policy: 'private' },
];

async function setupBuckets() {
  console.log('Setting up MinIO buckets...');

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const exists = await minioClient.bucketExists(bucket.name);
      
      if (!exists) {
        // Create bucket
        await minioClient.makeBucket(bucket.name, 'us-east-1');
        console.log(`✅ Bucket "${bucket.name}" created`);
      } else {
        console.log(`ℹ️  Bucket "${bucket.name}" already exists`);
      }

      // Set bucket policy
      if (bucket.policy === 'public') {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket.name}/*`],
            },
          ],
        };

        await minioClient.setBucketPolicy(bucket.name, JSON.stringify(policy));
        console.log(`✅ Bucket "${bucket.name}" policy set to public`);
      } else {
        console.log(`ℹ️  Bucket "${bucket.name}" policy is private`);
      }
    } catch (error) {
      console.error(`❌ Error setting up bucket "${bucket.name}":`, error);
    }
  }

  console.log('✅ MinIO setup completed!');
}

setupBuckets().catch(console.error);
```

Jalankan script:

```bash
npm run setup:minio
# atau
tsx scripts/setup-minio.ts
```

---

## 🔓 Setup Bucket Policy (Public Read)

### 4. Membuat Bucket Policy Public via Console

#### Step-by-Step:

1. **Login ke MinIO Console** (`http://127.0.0.1:9001`)

2. **Klik bucket yang ingin diubah** (misalnya `avatars`)

3. **Klik tab "Access Policy"** atau "Policy"

4. **Pilih "Public"** atau **"Custom Policy"**

5. **Jika Custom Policy, paste JSON berikut:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::avatars/*"]
    }
  ]
}
```

**Untuk bucket `submissions`:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::submissions/*"]
    }
  ]
}
```

6. **Klik "Save"**

7. **Verify:** Upload file test, lalu akses URL langsung di browser

---

### 5. Membuat Bucket Policy Public via MinIO Client (mc)

```bash
# Download policy file
# avatars-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::avatars/*"]
    }
  ]
}

# Apply policy
mc anonymous set download local/avatars
# atau
mc policy set download local/avatars
```

---

### 6. Membuat Bucket Policy Public via Code

```typescript
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: '127.0.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
});

// Public read policy untuk avatars
const publicReadPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::avatars/*'],
    },
  ],
};

// Set policy
await minioClient.setBucketPolicy('avatars', JSON.stringify(publicReadPolicy));

// Public read policy untuk submissions
const submissionsPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: ['arn:aws:s3:::submissions/*'],
    },
  ],
};

await minioClient.setBucketPolicy('submissions', JSON.stringify(submissionsPolicy));
```

---

## 🔧 Konfigurasi Project

### 7. Update Environment Variables

File `.env`:

```env
# MinIO Configuration
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_SUBMISSIONS=submissions
MINIO_BUCKET_TEMP=temp
MINIO_PUBLIC_URL=http://127.0.0.1:9000
```

**Untuk Production:**

```env
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_PUBLIC_URL=https://cdn.example.com
# atau
MINIO_PUBLIC_URL=https://minio.example.com
```

---

## 🧪 Testing MinIO Connection

### 8. Test Script

Buat file `scripts/test-minio.ts`:

```typescript
import { Client } from 'minio';
import * as dotenv from 'dotenv';

dotenv.config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

async function testConnection() {
  try {
    // List buckets
    const buckets = await minioClient.listBuckets();
    console.log('✅ Connected to MinIO');
    console.log('📦 Buckets:', buckets.map(b => b.name));

    // Test upload
    const testContent = Buffer.from('Hello MinIO!');
    await minioClient.putObject('temp', 'test.txt', testContent, testContent.length);
    console.log('✅ Test upload successful');

    // Test download
    const data = await minioClient.getObject('temp', 'test.txt');
    const chunks: Buffer[] = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString();
    console.log('✅ Test download successful:', content);

    // Cleanup
    await minioClient.removeObject('temp', 'test.txt');
    console.log('✅ Test file deleted');

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Jalankan:

```bash
tsx scripts/test-minio.ts
```

---

## 📝 Checklist Setup

- [ ] MinIO server running
- [ ] MinIO Console accessible (http://127.0.0.1:9001)
- [ ] Bucket `avatars` created
- [ ] Bucket `submissions` created
- [ ] Bucket `temp` created
- [ ] Bucket `avatars` policy set to public
- [ ] Bucket `submissions` policy set to public
- [ ] Bucket `temp` policy is private
- [ ] Environment variables configured
- [ ] Test connection successful

---

## 🎯 Quick Setup Script

Buat file `scripts/setup-minio-quick.sh` (untuk Linux/Mac) atau `setup-minio-quick.bat` (untuk Windows):

### Windows (`setup-minio-quick.bat`)

```batch
@echo off
echo Setting up MinIO buckets...

REM Setup MinIO Client alias (if mc is installed)
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin

REM Create buckets
mc mb local/avatars
mc mb local/submissions
mc mb local/temp

REM Set public read policy
mc anonymous set download local/avatars
mc anonymous set download local/submissions

echo ✅ MinIO setup completed!
```

Jalankan:

```bash
setup-minio-quick.bat
```

---

## 🔐 Security Best Practices

### Development
- ✅ Public read untuk avatars dan submissions (OK untuk dev)
- ✅ Private untuk temp bucket

### Production
- ⚠️ Consider using presigned URLs untuk private files
- ⚠️ Use HTTPS
- ⚠️ Change default credentials
- ⚠️ Setup CORS properly
- ⚠️ Use CDN in front of MinIO
- ⚠️ Setup backup strategy

---

## 🐛 Troubleshooting

### Bucket Policy Tidak Bekerja

1. **Check policy JSON format** - Harus valid JSON
2. **Check bucket name** - Harus match dengan policy Resource
3. **Check MinIO version** - Policy format mungkin berbeda
4. **Try via mc client:**
   ```bash
   mc anonymous set download local/avatars
   ```

### Connection Error

1. **Check MinIO server running:**
   ```bash
   # Check process
   tasklist | findstr minio
   ```

2. **Check port:**
   ```bash
   netstat -an | findstr 9000
   ```

3. **Check credentials** di `.env`

### CORS Error

Setup CORS policy di MinIO:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## 📚 References

- [MinIO Documentation](https://min.io/docs/)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

---

**Last Updated**: 2024-01-16  
**Version**: 1.0.0


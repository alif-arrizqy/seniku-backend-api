# MinIO Quick Setup Guide

Panduan cepat untuk setup MinIO bucket policy menjadi public.

---

## 🚀 Quick Steps

### 1. Pastikan MinIO Running

```bash
D:\minio.exe server D:\projects\seniku\seniku-backend-api\minio-data --console-address ":9001"
```

### 2. Buka MinIO Console

Buka browser: `http://127.0.0.1:9001`

Login dengan:
- Username: `minioadmin`
- Password: `minioadmin`

---

## 🔓 Membuat Bucket Policy Public (via Console)

### Method 1: Via Access Policy Tab

1. **Klik bucket** yang ingin diubah (misalnya `avatars`)

2. **Klik tab "Access Policy"** atau **"Summary" → "Access Policy"**

3. **Pilih "Public"** atau klik **"Add Policy"**

4. **Paste JSON berikut:**

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

**⚠️ PENTING:** Ganti `avatars` dengan nama bucket Anda!

5. **Klik "Save"** atau **"Set Policy"**

6. **Verify:** Upload file test, lalu akses URL langsung di browser

---

### Method 2: Via Bucket Settings

1. **Klik bucket** (misalnya `avatars`)

2. **Klik "Manage"** atau **"Settings"**

3. **Scroll ke "Access Policy"**

4. **Pilih "Public"** atau **"Custom Policy"**

5. **Jika Custom Policy, paste JSON:**

```json
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
```

6. **Save**

---

## 📋 Policy JSON untuk Setiap Bucket

### Avatars Bucket

```json
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
```

### Submissions Bucket

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::submissions/*"]
    }
  ]
}
```

### Temp Bucket (Private - Jangan ubah!)

```json
{
  "Version": "2012-10-17",
  "Statement": []
}
```

Atau biarkan kosong/null untuk private.

---

## 🛠️ Setup via Script (Recommended)

### Option 1: TypeScript Script

```bash
npm run setup:minio
```

Script akan:
- ✅ Create buckets (jika belum ada)
- ✅ Set policy public untuk avatars dan submissions
- ✅ Set policy private untuk temp

### Option 2: Batch Script (Windows)

```bash
scripts\setup-minio.bat
```

**Note:** Perlu install MinIO Client (mc) terlebih dahulu.

---

## ✅ Verify Setup

### Test Public Access

1. **Upload file test** ke bucket `avatars`:
   - File: `test.jpg`
   - Bucket: `avatars`

2. **Dapatkan URL:**
   ```
   http://127.0.0.1:9000/avatars/test.jpg
   ```

3. **Buka URL di browser** (atau incognito mode)
   - ✅ Jika bisa diakses = Public berhasil
   - ❌ Jika error/403 = Masih private

---

## 🐛 Troubleshooting

### Policy Tidak Bekerja

1. **Check JSON format** - Harus valid JSON
2. **Check bucket name** - Harus match dengan Resource
3. **Clear browser cache** - Coba incognito mode
4. **Check MinIO version** - Policy format mungkin berbeda

### Error: "Access Denied"

1. **Verify policy sudah di-set**
2. **Check Resource path** - Harus `arn:aws:s3:::bucket-name/*`
3. **Try via mc client:**
   ```bash
   mc anonymous set download local/avatars
   ```

### Bucket Tidak Muncul di Console

1. **Refresh browser**
2. **Check MinIO server running**
3. **Check credentials**

---

## 📝 Checklist

- [ ] MinIO server running
- [ ] MinIO Console accessible
- [ ] Bucket `avatars` created
- [ ] Bucket `submissions` created
- [ ] Bucket `temp` created
- [ ] Bucket `avatars` policy = Public
- [ ] Bucket `submissions` policy = Public
- [ ] Bucket `temp` policy = Private
- [ ] Test upload & access URL

---

## 🔗 Quick Links

- **MinIO Console**: http://127.0.0.1:9001
- **MinIO API**: http://127.0.0.1:9000
- **Documentation**: [docs/11-MINIO-SETUP.md](./docs/11-MINIO-SETUP.md)

---

**Last Updated**: 2024-01-16


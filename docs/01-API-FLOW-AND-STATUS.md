# API Flow & Status Documentation

Dokumen ini menjelaskan flow penggunaan API, status values, dan field-field penting dalam request body untuk Seniku Backend API.

---

## Table of Contents

1. [Status Values](#status-values)
2. [Request Body Fields](#request-body-fields)
3. [API Flow](#api-flow)
4. [Validation Rules](#validation-rules)
5. [Common Patterns](#common-patterns)

---

## Status Values

### 1. Assignment Status

Assignment memiliki 3 status yang menunjukkan kondisi tugas:

#### **DRAFT**
- **Deskripsi**: Assignment masih dalam tahap draft/persiapan
- **Karakteristik**:
  - Assignment baru dibuat dengan status ini secara default
  - Belum terlihat oleh siswa
  - Teacher masih bisa mengedit semua field
  - Tidak ada notifikasi yang dikirim ke siswa
- **Kapan digunakan**:
  - Saat teacher membuat assignment baru (default)
  - Saat teacher ingin menyimpan assignment sementara sebelum publish
- **Transisi**:
  - `DRAFT` → `ACTIVE`: Teacher mengaktifkan assignment
  - `DRAFT` → `COMPLETED`: Tidak bisa langsung, harus melalui ACTIVE dulu

#### **ACTIVE**
- **Deskripsi**: Assignment aktif dan dapat diakses oleh siswa
- **Karakteristik**:
  - Assignment terlihat oleh siswa di kelas yang ditugaskan
  - Siswa dapat submit karya untuk assignment ini
  - Notifikasi `ASSIGNMENT_CREATED` dikirim ke semua siswa di kelas yang ditugaskan
  - Teacher masih bisa mengedit assignment
- **Kapan digunakan**:
  - Saat teacher ingin mempublish assignment ke siswa
  - Saat assignment sudah siap untuk dikerjakan siswa
- **Transisi**:
  - `ACTIVE` → `COMPLETED`: Setelah deadline atau teacher menandai selesai
  - `ACTIVE` → `DRAFT`: Teacher bisa mengubah kembali ke draft

#### **COMPLETED**
- **Deskripsi**: Assignment sudah selesai/tidak aktif lagi
- **Karakteristik**:
  - Assignment tidak lagi menerima submission baru
  - Siswa masih bisa melihat assignment dan submission mereka
  - Teacher masih bisa melihat dan grade submission yang ada
  - Biasanya digunakan setelah deadline atau semua siswa sudah submit
- **Kapan digunakan**:
  - Setelah deadline assignment lewat
  - Setelah teacher selesai mengevaluasi semua submission
  - Saat assignment tidak lagi relevan
- **Transisi**:
  - `COMPLETED` → `ACTIVE`: Teacher bisa mengaktifkan kembali (jika deadline belum lewat)
  - `COMPLETED` → `DRAFT`: Teacher bisa mengubah ke draft

**Flow Status Assignment:**
```
DRAFT → ACTIVE → COMPLETED
  ↑         ↓         ↑
  └─────────┴─────────┘
```

---

### 2. Submission Status

Submission memiliki 4 status yang menunjukkan kondisi karya siswa:

#### **PENDING**
- **Deskripsi**: Submission sudah dikirim dan menunggu penilaian dari teacher
- **Karakteristik**:
  - Siswa sudah submit karya mereka
  - Belum dinilai oleh teacher
  - Siswa masih bisa mengedit submission (update title, description, atau upload gambar baru)
  - Tidak muncul di portfolio (karena belum dinilai)
- **Kapan digunakan**:
  - Setelah siswa submit karya untuk pertama kali
  - Setelah siswa update submission yang berstatus REVISION
- **Transisi**:
  - `PENDING` → `GRADED`: Teacher memberikan nilai
  - `PENDING` → `REVISION`: Teacher meminta revisi
  - `PENDING` → `NOT_SUBMITTED`: Siswa cancel submission (hanya jika belum dinilai)

#### **GRADED**
- **Deskripsi**: Submission sudah dinilai oleh teacher
- **Karakteristik**:
  - Teacher sudah memberikan nilai dan feedback
  - Submission muncul di portfolio (karya yang sudah dinilai)
  - Siswa tidak bisa lagi mengedit submission
  - Notifikasi `SUBMISSION_GRADED` dikirim ke siswa
  - Achievement check dilakukan otomatis setelah status ini
- **Kapan digunakan**:
  - Setelah teacher memberikan nilai melalui endpoint `/submissions/:id/grade`
- **Transisi**:
  - `GRADED` → (tidak bisa diubah lagi, final status)

#### **REVISION**
- **Deskripsi**: Submission perlu direvisi berdasarkan feedback teacher
- **Karakteristik**:
  - Teacher meminta siswa untuk memperbaiki karya
  - Siswa bisa mengupdate submission (upload gambar baru, update deskripsi)
  - Setelah diupdate, status otomatis berubah menjadi `PENDING`
  - Notifikasi `SUBMISSION_REVISION` dikirim ke siswa
  - `revisionCount` akan bertambah setiap kali diminta revisi
- **Kapan digunakan**:
  - Saat teacher merasa karya perlu diperbaiki sebelum dinilai
  - Teacher menggunakan endpoint `/submissions/:id/revision`
- **Transisi**:
  - `REVISION` → `PENDING`: Setelah siswa update submission
  - `REVISION` → `GRADED`: Teacher bisa langsung grade tanpa revisi (langka)

#### **NOT_SUBMITTED**
- **Deskripsi**: Submission dibatalkan atau belum ada submission
- **Karakteristik**:
  - Siswa belum submit atau sudah cancel submission
  - Hanya bisa cancel jika status masih `PENDING`
  - Tidak ada data submission yang tersimpan
- **Kapan digunakan**:
  - Saat siswa cancel submission yang masih pending
  - Default state sebelum siswa submit

**Flow Status Submission:**
```
NOT_SUBMITTED → PENDING → GRADED
                      ↓
                  REVISION → PENDING → GRADED
```

---

### 3. Notification Types

Notification memiliki beberapa tipe yang menunjukkan jenis notifikasi:

#### **ASSIGNMENT_CREATED**
- **Trigger**: Teacher membuat assignment baru dengan status `ACTIVE`
- **Penerima**: Semua siswa di kelas yang ditugaskan
- **Isi**: Informasi tentang assignment baru, deadline, dan link ke assignment

#### **SUBMISSION_GRADED**
- **Trigger**: Teacher meng-grade submission (status menjadi `GRADED`)
- **Penerima**: Siswa yang submit karya tersebut
- **Isi**: Nilai yang didapat, feedback dari teacher, dan link ke submission

#### **SUBMISSION_REVISION**
- **Trigger**: Teacher meminta revisi (status menjadi `REVISION`)
- **Penerima**: Siswa yang submit karya tersebut
- **Isi**: Catatan revisi dari teacher dan link ke submission

#### **ASSIGNMENT_DEADLINE**
- **Trigger**: (Future feature) Reminder deadline assignment
- **Penerima**: Siswa yang belum submit
- **Isi**: Peringatan deadline yang akan datang

#### **ACHIEVEMENT_UNLOCKED**
- **Trigger**: Siswa mendapatkan achievement baru
- **Penerima**: Siswa yang unlock achievement
- **Isi**: Informasi achievement yang didapat

#### **GENERAL**
- **Trigger**: Notifikasi umum dari sistem/admin
- **Penerima**: Semua user atau user tertentu
- **Isi**: Informasi umum atau pengumuman

---

## Request Body Fields

### 1. Authentication

#### Register (`POST /auth/register`)

**Field Requirements:**

| Field | Type | Required | Role | Description |
|-------|------|----------|------|-------------|
| `email` | string | Conditional | TEACHER: required<br>STUDENT: optional | Email user (harus unique untuk TEACHER) |
| `password` | string | Required | Both | Password (minimum 3 karakter) |
| `nip` | string | Conditional | TEACHER: required<br>STUDENT: not used | Nomor Induk Pegawai (unique untuk TEACHER) |
| `nis` | string | Conditional | STUDENT: required<br>TEACHER: not used | Nomor Induk Siswa (unique untuk STUDENT) |
| `name` | string | Required | Both | Nama lengkap user |
| `role` | enum | Required | Both | "STUDENT" atau "TEACHER" |
| `phone` | string | Optional | Both | Nomor telepon |
| `classId` | uuid | Conditional | STUDENT: required<br>TEACHER: not used | ID kelas untuk siswa |

**Validation Rules:**
- Untuk `STUDENT`: `nis` required dan unique, `email` optional
- Untuk `TEACHER`: `email` required dan unique, `nip` required dan unique
- `password`: minimum 3 karakter
- `name`: required, tidak boleh kosong

#### Login (`POST /auth/login`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | Required | NIP untuk TEACHER atau NIS untuk STUDENT |
| `password` | string | Required | Password user |

**Note:**
- **TEACHER** login dengan **NIP** (Nomor Induk Pegawai)
- **STUDENT** login dengan **NIS** (Nomor Induk Siswa)
- Sistem akan mencari user by NIP terlebih dahulu, jika tidak ditemukan akan mencari by NIS

---

### 2. Assignment

#### Create Assignment (`POST /assignments`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Required | Judul assignment (min 1 karakter) |
| `description` | string | Required | Deskripsi assignment (min 1 karakter) |
| `categoryId` | uuid | Required | ID kategori assignment (harus valid) |
| `status` | enum | Optional | "DRAFT" (default) atau "ACTIVE" |
| `deadline` | datetime | Required | Deadline assignment (harus di masa depan) |
| `classIds` | array[uuid] | Required | Array ID kelas yang ditugaskan (min 1 kelas) |

**Validation Rules:**
- `title`: required, tidak boleh kosong
- `description`: required, tidak boleh kosong
- `categoryId`: required, harus valid category ID yang ada di database
- `deadline`: required, format ISO 8601, harus di masa depan
- `classIds`: required, array tidak boleh kosong, semua classId harus valid

**Status Behavior:**
- Jika `status` tidak diisi, default adalah `DRAFT`
- Jika `status` = `ACTIVE`, notifikasi akan dikirim ke semua siswa di kelas yang ditugaskan
- Jika `status` = `DRAFT`, assignment tidak terlihat oleh siswa

#### Update Assignment (`PUT /assignments/:id`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Optional | Judul assignment |
| `description` | string | Optional | Deskripsi assignment |
| `categoryId` | uuid | Optional | ID kategori assignment |
| `status` | enum | Optional | "DRAFT", "ACTIVE", atau "COMPLETED" |
| `deadline` | datetime | Optional | Deadline assignment |
| `classIds` | array[uuid] | Optional | Array ID kelas yang ditugaskan |

**Note:**
- Semua field optional, hanya field yang diisi yang akan diupdate
- Jika `status` diubah dari `DRAFT` ke `ACTIVE`, notifikasi akan dikirim
- Jika `status` diubah ke `COMPLETED`, assignment tidak lagi menerima submission baru

---

### 3. Submission

#### Submit Assignment (`POST /submissions`)

**Field Requirements (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assignmentId` | uuid | Required | ID assignment yang akan di-submit |
| `title` | string | Required | Judul karya |
| `description` | string | Required | Deskripsi karya |
| `image` | file | Required | File gambar (JPEG, PNG, atau WebP) |

**File Validation:**
- **File type**: `image/jpeg`, `image/png`, `image/webp`
- **Max file size**: `10MB`
- **Min dimensions**: `800x600px` (recommended: `1200x800px` untuk zoom support)
- **Max dimensions**: `5000x5000px`

**Validation Rules:**
- `assignmentId`: required, harus valid assignment ID, assignment harus berstatus `ACTIVE`, deadline belum lewat
- `title`: required, tidak boleh kosong
- `description`: required, tidak boleh kosong
- `image`: required, harus valid image file sesuai kriteria di atas

**Status After Submit:**
- Submission akan dibuat dengan status `PENDING`
- Siswa akan menerima konfirmasi bahwa submission berhasil

#### Update Submission (`PUT /submissions/:id`)

**Field Requirements:**

**Option 1: JSON (tanpa upload gambar baru)**
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Option 2: multipart/form-data (dengan upload gambar baru)**
- `title` (optional): Judul karya
- `description` (optional): Deskripsi karya
- `image` (optional): File gambar baru

**Validation Rules:**
- Bisa update jika status = `PENDING` (edit sebelum dinilai)
- Bisa update jika status = `REVISION` (upload revisi setelah mendapat feedback)
- Jika status = `REVISION` dan diupdate, status akan otomatis berubah menjadi `PENDING`
- Jika upload gambar baru, validasi file sama seperti submit (min 800x600px, max 10MB)
- Jika tidak upload gambar, hanya bisa update title dan description

**Status Behavior:**
- `PENDING` → tetap `PENDING` (jika update sebelum dinilai)
- `REVISION` → `PENDING` (otomatis setelah diupdate)
- `GRADED` → tidak bisa diupdate (error)

---

### 4. Grade Submission

#### Grade Submission (`POST /submissions/:id/grade`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `grade` | number | Required | Nilai (0-100) |
| `feedback` | string | Optional | Feedback dari teacher |

**Validation Rules:**
- `grade`: required, number antara 0-100
- `feedback`: optional, string

**Status After Grade:**
- Submission status berubah menjadi `GRADED`
- `gradedAt` diisi dengan timestamp saat ini
- Notifikasi `SUBMISSION_GRADED` dikirim ke siswa
- Achievement check dilakukan otomatis
- Submission muncul di portfolio

#### Return for Revision (`POST /submissions/:id/revision`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `revisionNote` | string | Required | Catatan revisi dari teacher |

**Validation Rules:**
- `revisionNote`: required, tidak boleh kosong

**Status After Revision:**
- Submission status berubah menjadi `REVISION`
- `revisionCount` bertambah 1
- Notifikasi `SUBMISSION_REVISION` dikirim ke siswa
- Siswa bisa mengupdate submission, setelah update status menjadi `PENDING`

---

### 5. Category

#### Create Category (`POST /categories`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Required | Nama kategori (unique, min 1 karakter, max 100 karakter) |
| `description` | string | Optional | Deskripsi kategori (max 500 karakter) |
| `icon` | string | Optional | Icon/emoji untuk kategori (max 10 karakter) |

**Validation Rules:**
- `name`: required, unique, minimum 1 karakter, maksimum 100 karakter
- `description`: optional, maksimum 500 karakter
- `icon`: optional, maksimum 10 karakter (emoji atau icon identifier)

---

### 6. Achievement

#### Create Achievement (`POST /achievements`)

**Field Requirements:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Required | Nama achievement (unique, min 1 karakter, max 100 karakter) |
| `description` | string | Required | Deskripsi achievement (min 1 karakter, max 500 karakter) |
| `icon` | string | Required | Icon/emoji (min 1 karakter, max 10 karakter) |
| `criteria` | object | Optional | JSON object untuk kondisi unlock achievement |

**Criteria Examples:**

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

## API Flow

### 1. Assignment Lifecycle Flow

```
1. Teacher membuat assignment (POST /assignments)
   └─ Status: DRAFT (default)
   └─ Assignment tidak terlihat oleh siswa

2. Teacher mengaktifkan assignment (PUT /assignments/:id dengan status: ACTIVE)
   └─ Status: ACTIVE
   └─ Notifikasi ASSIGNMENT_CREATED dikirim ke siswa
   └─ Siswa bisa melihat dan submit karya

3. Siswa submit karya (POST /submissions)
   └─ Submission status: PENDING
   └─ Siswa bisa edit sebelum dinilai

4. Teacher menilai karya (POST /submissions/:id/grade)
   └─ Submission status: GRADED
   └─ Notifikasi SUBMISSION_GRADED dikirim
   └─ Achievement check dilakukan
   └─ Karya muncul di portfolio

   ATAU

4. Teacher meminta revisi (POST /submissions/:id/revision)
   └─ Submission status: REVISION
   └─ Notifikasi SUBMISSION_REVISION dikirim
   └─ Siswa update submission
   └─ Status kembali ke PENDING
   └─ Kembali ke step 4

5. Teacher menandai assignment selesai (PUT /assignments/:id dengan status: COMPLETED)
   └─ Status: COMPLETED
   └─ Assignment tidak lagi menerima submission baru
```

### 2. Student Submission Flow

```
1. Siswa melihat assignment aktif (GET /assignments)
   └─ Filter: status=ACTIVE

2. Siswa submit karya (POST /submissions)
   └─ Body: assignmentId, title, description, image
   └─ Status: PENDING

3. Siswa bisa edit submission (PUT /submissions/:id)
   └─ Hanya jika status: PENDING
   └─ Bisa update title, description, atau upload gambar baru

4. Teacher menilai atau meminta revisi
   └─ Jika dinilai: Status → GRADED
   └─ Jika revisi: Status → REVISION

5. Jika revisi, siswa update submission
   └─ Status: REVISION → PENDING
   └─ Kembali ke step 4

6. Setelah dinilai (GRADED)
   └─ Karya muncul di portfolio
   └─ Achievement check dilakukan
   └─ Siswa tidak bisa edit lagi
```

### 3. Teacher Grading Flow

```
1. Teacher melihat semua submission (GET /submissions)
   └─ Filter: assignmentId, status=PENDING

2. Teacher melihat detail submission (GET /submissions/:id)
   └─ Melihat gambar, title, description

3. Teacher memilih aksi:
   
   Option A: Grade langsung
   └─ POST /submissions/:id/grade
   └─ Body: grade (0-100), feedback (optional)
   └─ Status: PENDING → GRADED
   └─ Notifikasi dikirim ke siswa

   Option B: Minta revisi
   └─ POST /submissions/:id/revision
   └─ Body: revisionNote
   └─ Status: PENDING → REVISION
   └─ Notifikasi dikirim ke siswa
   └─ Siswa akan update, status kembali ke PENDING
```

---

## Validation Rules

### 1. Date/Time Format

Semua field datetime menggunakan format **ISO 8601**:
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

**Contoh:**
```json
"2026-01-20T23:59:59.000Z"
```

### 2. UUID Format

Semua ID menggunakan format **UUID v4**:
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

**Contoh:**
```json
"6e5cd248-43db-4625-bfda-24755212a9c2"
```

### 3. File Upload

**Image Requirements:**
- **Allowed types**: JPEG, PNG, WebP
- **Max size**: 10MB
- **Min dimensions**: 800x600px
- **Recommended dimensions**: 1200x800px (untuk zoom support)
- **Max dimensions**: 5000x5000px

**Excel Import Requirements:**
- **File type**: `.xlsx` (Excel 2007+)
- **Max size**: 5MB
- **Required columns**: NIS, Nama, Class
- **Optional columns**: Email, Phone, Password

### 4. String Length Limits

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| `name` (user) | 1 | - | Required |
| `name` (category) | 1 | 100 | Unique |
| `name` (achievement) | 1 | 100 | Unique |
| `description` (category) | - | 500 | Optional |
| `description` (achievement) | 1 | 500 | Required |
| `icon` | 1 | 10 | Emoji or short string |
| `title` (assignment) | 1 | - | Required |
| `title` (submission) | 1 | - | Required |
| `password` | 3 | - | Minimum 3 characters |

### 5. Number Ranges

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| `grade` | 0 | 100 | Integer or decimal |
| `page` | 1 | - | Pagination |
| `limit` | 1 | 100 | Pagination, default 10 |

---

## Common Patterns

### 1. Pagination

Semua list endpoints menggunakan pagination dengan format:

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. Error Response Format

Semua error response mengikuti format:

```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate data)
- `422` - Validation Error
- `500` - Internal Server Error

### 3. Success Response Format

Semua success response mengikuti format:

```json
{
  "success": true,
  "message": "Operation successful message",
  "data": {
    // Response data
  }
}
```

### 4. Filtering & Searching

**Common Query Parameters:**
- `search`: Search by name, title, atau field text lainnya
- `status`: Filter by status (enum values)
- `page`: Page number
- `limit`: Items per page
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`

**Example:**
```
GET /assignments?page=1&limit=10&status=ACTIVE&search=Lukisan
```

### 5. Bulk Operations

Beberapa endpoint mendukung bulk operations:

**Bulk Update Status:**
```json
{
  "assignmentIds": ["uuid1", "uuid2", "uuid3"],
  "status": "ACTIVE"
}
```

**Bulk Delete:**
```json
{
  "assignmentIds": ["uuid1", "uuid2", "uuid3"],
  "action": "delete"  // or "draft"
}
```

---

## Best Practices

### 1. Assignment Management

1. **Buat assignment dengan status DRAFT terlebih dahulu**
   - Review semua detail sebelum publish
   - Pastikan deadline sudah benar
   - Pastikan kelas yang ditugaskan sudah tepat

2. **Aktifkan assignment (ACTIVE) saat sudah siap**
   - Notifikasi akan otomatis dikirim ke siswa
   - Siswa bisa langsung mulai mengerjakan

3. **Tandai COMPLETED setelah selesai**
   - Setelah deadline atau semua sudah dinilai
   - Mencegah submission baru

### 2. Submission Management

1. **Validasi file sebelum submit**
   - Pastikan dimensi gambar minimal 800x600px
   - Pastikan ukuran file tidak melebihi 10MB
   - Gunakan format yang didukung (JPEG, PNG, WebP)

2. **Gunakan gambar resolusi tinggi**
   - Recommended: 1200x800px untuk zoom support
   - Memudahkan teacher melihat detail karya

3. **Update submission jika perlu revisi**
   - Upload gambar baru jika diminta
   - Update deskripsi sesuai feedback

### 3. Grading

1. **Berikan feedback yang jelas**
   - Jelaskan kelebihan karya
   - Berikan saran perbaikan jika perlu

2. **Gunakan revisi untuk karya yang perlu perbaikan**
   - Lebih baik minta revisi daripada langsung nilai rendah
   - Berikan kesempatan siswa untuk memperbaiki

3. **Grade secara konsisten**
   - Gunakan kriteria penilaian yang sama
   - Berikan feedback yang konstruktif

---

## FAQ

### Q: Apakah assignment bisa diubah status dari COMPLETED ke ACTIVE?
**A:** Ya, teacher bisa mengubah status assignment kembali ke ACTIVE jika deadline belum lewat dan masih diperlukan.

### Q: Apakah siswa bisa cancel submission yang sudah dinilai?
**A:** Tidak, siswa hanya bisa cancel submission dengan status PENDING. Setelah dinilai (GRADED) atau diminta revisi (REVISION), tidak bisa dicancel.

### Q: Apakah assignment dengan status DRAFT terlihat oleh siswa?
**A:** Tidak, assignment dengan status DRAFT hanya terlihat oleh teacher. Siswa hanya bisa melihat assignment dengan status ACTIVE.

### Q: Berapa kali siswa bisa revisi?
**A:** Tidak ada batasan jumlah revisi. Setiap kali teacher meminta revisi, `revisionCount` akan bertambah.

### Q: Apakah submission yang sudah GRADED bisa diubah?
**A:** Tidak, submission dengan status GRADED adalah final dan tidak bisa diubah lagi.

### Q: Kapan achievement di-check?
**A:** Achievement di-check otomatis setiap kali submission berubah status menjadi GRADED.

---

**Last Updated:** 2025-12-24
**Version:** 1.0


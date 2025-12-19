# API Flow Detail - Seniku Backend API

Dokumen ini menjelaskan flow detail untuk penyajian data API ke frontend, termasuk urutan request, data yang dikembalikan, dan optimasi performa.

---

## 1. Authentication Flow

### 1.1 Register Flow

```
Frontend → POST /api/v1/auth/register
  Body: { email?, nis, password, name, role, classId }
  
Backend:
  1. Validate input
  2. Check NIS unique (untuk STUDENT)
  3. Check email unique (jika ada)
  4. Hash password
  5. Create user
  6. Return user data (tanpa password)
  
Frontend ← 201 Created
  Data: { user: { id, email, nis, name, role, class } }
```

**Validasi:**
- STUDENT: `nis` required & unique, `email` optional, `classId` required
- TEACHER: `email` required & unique, `nis` tidak digunakan

---

### 1.2 Login Flow

```
Frontend → POST /api/v1/auth/login
  Body: { identifier: "email@mail.com" | "12345", password }
  
Backend:
  1. Check if identifier is email format
     - If email → find user by email
     - If not email → find user by NIS (only STUDENT)
  2. Verify password
  3. Create session
  4. Set session cookie
  5. Return user data
  
Frontend ← 200 OK
  Set-Cookie: sessionId=xxx; HttpOnly; Secure; SameSite=Strict
  Data: { user: { id, email, nis, name, role, class } }
```

**Login Logic Detail:**
```typescript
// Pseudo code
if (isEmailFormat(identifier)) {
  user = findUserByEmail(identifier);
} else {
  // Hanya untuk STUDENT
  user = findUserByNIS(identifier);
  if (user && user.role !== 'STUDENT') {
    return error('NIS hanya untuk siswa');
  }
}

if (!user || !verifyPassword(password, user.password)) {
  return error('Invalid credentials');
}

session = createSession(user.id);
setCookie('sessionId', session.id);
return { user };
```

---

### 1.3 Session Verification Flow

```
Frontend → Any Protected Endpoint
  Cookie: sessionId=xxx
  
Backend Middleware:
  1. Extract sessionId from cookie
  2. Find session in database/memory
  3. Check if session expired
  4. Get user from session
  5. Attach user to request
  6. Continue to route handler
  
If Invalid:
  Frontend ← 401 Unauthorized
    { message: "Session expired or invalid" }
```

---

## 2. Dashboard Flow

### 2.1 Teacher Dashboard Flow

```
Frontend → GET /api/v1/dashboard/teacher
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session (middleware)
  2. Check role = TEACHER
  3. Query database:
     - Count total students
     - Count active assignments
     - Count new portfolios (last 7 days)
     - Calculate average score
     - Get recent submissions (last 10)
     - Get top students (top 3 by avg score)
  4. Format response
  5. Return data
  
Frontend ← 200 OK
  Data: {
    totalStudents: 32,
    activeAssignments: 5,
    newPortfolios: 18,
    averageScore: 85.5,
    recentSubmissions: [...],
    topStudents: [...]
  }
```

**Query Optimization:**
```sql
-- Single query dengan aggregation
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') as total_students,
  (SELECT COUNT(*) FROM assignments WHERE status = 'ACTIVE') as active_assignments,
  (SELECT COUNT(*) FROM submissions WHERE status = 'GRADED' AND graded_at > NOW() - INTERVAL '7 days') as new_portfolios,
  (SELECT AVG(score) FROM submissions WHERE status = 'GRADED') as avg_score;
```

---

### 2.2 Student Dashboard Flow

```
Frontend → GET /api/v1/dashboard/student
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session (middleware)
  2. Get current user from session
  3. Query database:
     - Count portfolio (graded submissions)
     - Count completed assignments
     - Count total assignments (for student's class)
     - Calculate average score
     - Get achievements
     - Get recent works (last 5)
     - Get pending assignments
  4. Format response
  5. Return data
  
Frontend ← 200 OK
  Data: {
    portfolioCount: 12,
    completedAssignments: 8,
    totalAssignments: 10,
    averageScore: 88.5,
    achievements: [...],
    recentWorks: [...],
    pendingAssignments: [...]
  }
```

---

## 3. Assignment Flow

### 3.1 Get Assignments Flow (Student View)

```
Frontend → GET /api/v1/assignments?page=1&limit=10
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session
  2. Get current user (student)
  3. Query assignments:
     - Filter by student's class
     - Include submission status for current student
     - Sort by deadline (ascending)
     - Paginate
  4. Format response with mySubmission data
  5. Return data
  
Frontend ← 200 OK
  Data: {
    assignments: [
      {
        id: "uuid",
        title: "Lukisan Tema Alam",
        deadline: "2024-01-20T23:59:59.000Z",
        status: "ACTIVE",
        mySubmission: {  // Only for current student
          id: "uuid",
          status: "PENDING",
          grade: null,
          submittedAt: "2024-01-15T00:00:00.000Z"
        }
      }
    ],
    pagination: { page: 1, limit: 10, total: 5, totalPages: 1 }
  }
```

**Query Optimization:**
```sql
SELECT 
  a.*,
  s.id as submission_id,
  s.status as submission_status,
  s.grade,
  s.submitted_at
FROM assignments a
LEFT JOIN assignment_classes ac ON a.id = ac.assignment_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = :currentUserId
WHERE ac.class_id = :studentClassId
  AND a.status = 'ACTIVE'
ORDER BY a.deadline ASC
LIMIT :limit OFFSET :offset;
```

---

### 3.2 Get Assignment Detail Flow (Teacher View)

```
Frontend → GET /api/v1/assignments/:id
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Query assignment with:
     - Assignment details
     - Created by info
     - Classes assigned
     - All submissions with student info
     - Submission statistics
  4. Format response
  5. Return data
  
Frontend ← 200 OK
  Data: {
    id: "uuid",
    title: "Lukisan Tema Alam",
    submissions: [
      {
        id: "uuid",
        student: { id, name, nis, className },
        status: "PENDING",
        submittedAt: "2024-01-15T00:00:00.000Z"
      }
    ],
    submissionCount: 24,
    totalStudents: 32
  }
```

---

## 4. Submission Flow

### 4.1 Submit Assignment Flow

```
Frontend → POST /api/v1/submissions
  Cookie: sessionId=xxx
  Content-Type: multipart/form-data
  Body: { assignmentId, title, description, image: <file> }
  
Backend:
  1. Verify session
  2. Check role = STUDENT
  3. Validate assignment:
     - Assignment exists
     - Assignment is ACTIVE
     - Deadline not passed
     - Student's class assigned to assignment
  4. Validate file:
     - File type (jpeg, png, webp)
     - File size (max 10MB)
     - Image dimensions (min 800x600px)
  5. Process image:
     - Upload to cloud storage
     - Generate thumbnail (300x300)
     - Generate medium (800x600)
     - Keep original (full resolution)
  6. Create submission record
  7. Create notification for teacher
  8. Return submission data
  
Frontend ← 201 Created
  Data: {
    id: "uuid",
    status: "PENDING",
    imageUrl: "https://...",
    submittedAt: "2024-01-15T00:00:00.000Z"
  }
```

**Image Processing Flow:**
```
1. Receive file buffer
2. Validate dimensions using sharp
3. Upload original to S3/Cloudinary
4. Generate thumbnail → Upload thumbnail
5. Generate medium → Upload medium
6. Store URLs in database
```

---

### 4.2 Review Submission Flow (Teacher)

```
Frontend → POST /api/v1/submissions/:id/grade
  Cookie: sessionId=xxx
  Body: { grade: "A", feedback: "..." }
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Get submission
  4. Check submission status = PENDING
  5. Update submission:
     - Set grade
     - Set feedback
     - Set status = GRADED
     - Set gradedAt = now()
  6. Create notification for student
  7. Return updated submission
  
Frontend ← 200 OK
  Data: {
    id: "uuid",
    status: "GRADED",
    grade: "A",
    feedback: "...",
    gradedAt: "2024-01-16T00:00:00.000Z"
  }
```

---

### 4.3 Return for Revision Flow

```
Frontend → POST /api/v1/submissions/:id/revision
  Cookie: sessionId=xxx
  Body: { revisionNote: "..." }
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Get submission
  4. Check submission status = PENDING
  5. Update submission:
     - Set status = REVISION
     - Increment revisionCount
  6. Create SubmissionRevision record
  7. Create notification for student
  8. Return updated submission
  
Frontend ← 200 OK
  Data: {
    id: "uuid",
    status: "REVISION",
    revisionCount: 1
  }
```

---

## 5. Portfolio Flow

### 5.1 Get Portfolio Items Flow

```
Frontend → GET /api/v1/portfolio?page=1&limit=10&category=Lukisan
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session
  2. Query submissions:
     - Filter: status = GRADED
     - Filter by category (if provided)
     - Search by title/student name (if provided)
     - Filter by student (if provided)
     - Sort by gradedAt (descending)
     - Paginate
  3. Include related data:
     - Student info (name, nis, className, avatar)
     - Assignment info (title)
  4. Format response
  5. Return data
  
Frontend ← 200 OK
  Data: {
    items: [
      {
        id: "uuid",
        title: "Lukisan Sunset",
        imageUrl: "https://...",
        imageThumbnail: "https://...",
        student: { name, nis, className, avatar },
        assignment: { title },
        grade: "A",
        feedback: "...",
        gradedAt: "2024-01-16T00:00:00.000Z"
      }
    ],
    pagination: { page: 1, limit: 10, total: 50, totalPages: 5 }
  }
```

**Query Optimization:**
```sql
SELECT 
  s.id,
  s.title,
  s.image_url,
  s.image_thumbnail,
  s.grade,
  s.feedback,
  s.graded_at,
  u.name as student_name,
  u.nis as student_nis,
  c.name as class_name,
  a.title as assignment_title
FROM submissions s
JOIN users u ON s.student_id = u.id
JOIN classes c ON u.class_id = c.id
JOIN assignments a ON s.assignment_id = a.id
WHERE s.status = 'GRADED'
  AND (:category IS NULL OR s.category = :category)
  AND (:search IS NULL OR s.title ILIKE :search OR u.name ILIKE :search)
ORDER BY s.graded_at DESC
LIMIT :limit OFFSET :offset;
```

---

## 6. Student Management Flow

### 6.1 Get Students Flow (Teacher)

```
Frontend → GET /api/v1/students?page=1&limit=10&search=Rina&classId=uuid
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Query students:
     - Filter by class (if provided)
     - Search by name, NIS, or email (if provided)
     - Calculate portfolioCount (subquery)
     - Calculate avgScore (subquery)
     - Paginate
  4. Format response
  5. Return data
  
Frontend ← 200 OK
  Data: {
    students: [
      {
        id: "uuid",
        name: "Rina Dewi",
        nis: "12345",
        email: "student@mail.com",
        className: "XII IPA 1",
        portfolioCount: 12,
        avgScore: 88.5
      }
    ],
    pagination: { page: 1, limit: 10, total: 32, totalPages: 4 }
  }
```

**Query dengan Aggregation:**
```sql
SELECT 
  u.id,
  u.name,
  u.nis,
  u.email,
  u.class_name,
  (SELECT COUNT(*) FROM submissions WHERE student_id = u.id AND status = 'GRADED') as portfolio_count,
  (SELECT AVG(score) FROM submissions WHERE student_id = u.id AND status = 'GRADED') as avg_score
FROM users u
WHERE u.role = 'STUDENT'
  AND (:classId IS NULL OR u.class_id = :classId)
  AND (:search IS NULL OR u.name ILIKE :search OR u.nis ILIKE :search OR u.email ILIKE :search)
ORDER BY u.name ASC
LIMIT :limit OFFSET :offset;
```

---

### 6.2 Import Students Flow

```
Frontend → POST /api/v1/students/import
  Cookie: sessionId=xxx
  Content-Type: multipart/form-data
  Body: { file: <excel_file> }
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Parse Excel file:
     - Read rows
     - Validate format
     - Extract data (NIS, name, email, phone, class)
  4. For each row:
     - Validate NIS (required, unique)
     - Validate name (required)
     - Find class by name
     - Check if NIS exists
     - Check if email exists (if provided)
  5. Batch insert valid rows
  6. Return import result
  
Frontend ← 200 OK
  Data: {
    total: 10,
    success: 8,
    failed: 2,
    errors: [
      { row: 3, nis: "12345", error: "NIS already exists" }
    ]
  }
```

---

## 7. Notification Flow

### 7.1 Get Notifications Flow

```
Frontend → GET /api/v1/notifications?page=1&limit=10
  Cookie: sessionId=xxx
  
Backend:
  1. Verify session
  2. Get current user
  3. Query notifications:
     - Filter by userId
     - Filter by isRead (if provided)
     - Sort by createdAt (descending)
     - Paginate
  4. Count unread notifications
  5. Format response
  6. Return data
  
Frontend ← 200 OK
  Data: {
    notifications: [
      {
        id: "uuid",
        type: "SUBMISSION_GRADED",
        title: "Karya Dinilai",
        message: "...",
        link: "/submissions/uuid",
        isRead: false,
        createdAt: "2024-01-16T00:00:00.000Z"
      }
    ],
    unreadCount: 5,
    pagination: { page: 1, limit: 10, total: 20, totalPages: 2 }
  }
```

---

## 8. Data Flow Optimization

### 8.1 Pagination Strategy

**Frontend Request:**
```
GET /api/v1/assignments?page=1&limit=10
```

**Backend Response:**
```json
{
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

**Best Practices:**
- Default limit: 10
- Max limit: 100
- Include pagination metadata
- Use cursor-based pagination for large datasets (optional)

---

### 8.2 Filtering Strategy

**Query Parameters:**
- `search`: Search across multiple fields
- `status`: Filter by status
- `classId`: Filter by class
- `category`: Filter by category
- `dateFrom` / `dateTo`: Date range filter

**Example:**
```
GET /api/v1/submissions?status=PENDING&assignmentId=uuid&page=1&limit=10
```

---

### 8.3 Sorting Strategy

**Query Parameters:**
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: `asc` or `desc` (default: desc)

**Example:**
```
GET /api/v1/portfolio?sortBy=gradedAt&sortOrder=desc
```

---

### 8.4 Data Aggregation

**Dashboard Stats:**
- Use database aggregation functions (COUNT, AVG, SUM)
- Cache frequently accessed stats (optional)
- Calculate on-demand for real-time data

**Example Query:**
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN role = 'STUDENT' THEN id END) as total_students,
  COUNT(DISTINCT CASE WHEN status = 'ACTIVE' THEN id END) as active_assignments,
  AVG(CASE WHEN status = 'GRADED' THEN score END) as avg_score
FROM ...
```

---

## 9. Error Handling Flow

### 9.1 Validation Error Flow

```
Frontend → POST /api/v1/submissions
  Body: { assignmentId: "", title: "", image: <invalid_file> }
  
Backend:
  1. Validate input
  2. Check validation errors
  3. Return 422 with error details
  
Frontend ← 422 Unprocessable Entity
  {
    "success": false,
    "message": "Validation error",
    "errors": {
      "assignmentId": "Assignment ID is required",
      "title": "Title is required",
      "image": "Image must be at least 800x600 pixels"
    }
  }
```

---

### 9.2 Authorization Error Flow

```
Frontend → POST /api/v1/assignments
  Cookie: sessionId=xxx (Student session)
  
Backend:
  1. Verify session
  2. Check role = TEACHER
  3. Role is STUDENT → Return 403
  
Frontend ← 403 Forbidden
  {
    "success": false,
    "message": "Forbidden: Only teachers can create assignments"
  }
```

---

## 10. Response Format Standard

### 10.1 Success Response

```json
{
  "success": true,
  "message": "Operation successful",  // Optional
  "data": {
    // Response data
  },
  "pagination": {  // If paginated
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 10.2 Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": {  // If validation error
    "field": "Field-specific error"
  }
}
```

---

## 11. Performance Optimization

### 11.1 Database Indexing

**Indexes yang diperlukan:**
- `users.email` - untuk login lookup
- `users.nis` - untuk login lookup
- `users.role` - untuk filtering
- `users.class_id` - untuk filtering
- `assignments.status` - untuk filtering
- `assignments.deadline` - untuk sorting
- `submissions.status` - untuk filtering
- `submissions.student_id` - untuk filtering
- `submissions.assignment_id` - untuk filtering

### 11.2 Query Optimization

- Use JOIN instead of multiple queries
- Use SELECT only needed fields
- Use LIMIT for pagination
- Use indexes for WHERE clauses
- Use aggregation functions for stats

### 11.3 Caching Strategy (Optional)

- Cache dashboard stats (5 minutes)
- Cache class list (1 hour)
- Cache user profile (until update)
- Use Redis for session storage

---

## 12. Security Considerations

### 12.1 Session Security

- HttpOnly cookies (prevent XSS)
- Secure flag (HTTPS only)
- SameSite=Strict (prevent CSRF)
- Session expiration (7 days)
- Session rotation on login

### 12.2 Input Validation

- Validate all user inputs
- Sanitize file uploads
- Check file types and sizes
- Validate image dimensions
- Prevent SQL injection (use Prisma)

### 12.3 Authorization Checks

- Verify session on every request
- Check role permissions
- Verify resource ownership
- Prevent unauthorized access

---

## 13. Frontend Integration Guide

### 13.1 Request Headers

```javascript
// Automatic cookie handling
fetch('/api/v1/assignments', {
  credentials: 'include'  // Include cookies
})
```

### 13.2 Error Handling

```javascript
try {
  const response = await fetch('/api/v1/assignments', {
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // Session expired, redirect to login
    window.location.href = '/auth';
  }
  
  const data = await response.json();
  if (!data.success) {
    // Handle error
    console.error(data.message, data.errors);
  }
} catch (error) {
  // Handle network error
}
```

### 13.3 Data Fetching Pattern

```javascript
// Fetch with pagination
const fetchAssignments = async (page = 1, limit = 10) => {
  const response = await fetch(
    `/api/v1/assignments?page=${page}&limit=${limit}`,
    { credentials: 'include' }
  );
  const data = await response.json();
  return data;
};
```

---

## 14. Testing Scenarios

### 14.1 Authentication Tests

- Register with valid data
- Register with duplicate NIS
- Register with duplicate email
- Login with email
- Login with NIS
- Login with invalid credentials
- Logout
- Access protected route without session

### 14.2 Authorization Tests

- Student trying to create assignment (should fail)
- Teacher trying to submit assignment (should fail)
- Access other student's data (should fail)
- Teacher access all students (should succeed)

### 14.3 Data Flow Tests

- Create assignment → Publish → Submit → Grade
- Submit → Return for revision → Resubmit → Grade
- Filter and paginate assignments
- Search students by NIS/email/name
- Export data to Excel/PDF

---

**Last Updated**: 2024-01-16
**Version**: 2.0.0


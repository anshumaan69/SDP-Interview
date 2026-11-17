# Comprehensive REST API Specification
## AI-Assisted Interview Preparation & Coding Practice Platform
**Document Identifier:** `SDP-API-2026-V2`  
**API Version:** `v1`  
**Base URL:** `http://localhost:4001/api/v1`  
**Interactive Swagger UI:** `http://localhost:4001/docs`  
**Protocol:** HTTPS / JSON over REST  

---

## 1. Global Conventions & Standards

### 1.1 Authentication & Request Headers
- **Access Tokens:** Protected endpoints require an `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.
- **Refresh Tokens:** Transmitted via HTTP-Only, Secure, `SameSite=Strict` cookie (`refreshToken`).
- **Idempotency:** State-mutating endpoints (`/sessions/:id/answers`, `/coding/problems/:id/submit`) accept an optional or recommended `Idempotency-Key: <UUID>` header to guard against network retries.
- **Request Tracing:** The gateway assigns every request a UUID v4 correlation ID, returned in the `X-Request-Id` response header.

### 1.2 Response Envelopes

#### Standard Success Envelope:
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Standard Error Envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ]
  }
}
```

### 1.3 Rate Limiting Policy
| Route Scope | Window | Quota | Key Prefix | Status on Exceed |
| :--- | :--- | :--- | :--- | :--- |
| Authentication (`/auth/*`) | 60 seconds | 10 req / IP | `ratelimit:auth` | HTTP 429 Too Many Requests |
| LLM Interview (`/sessions/*`) | 3600 seconds (1 hr) | 60 req / User | `ratelimit:ai_hourly` | HTTP 429 Too Many Requests |
| LLM Interview (`/sessions/*`) | 86400 seconds (24 hr) | 100 req / User | `ratelimit:ai_daily` | HTTP 429 Too Many Requests |

---

## 2. System & Metadata Endpoints

### 2.1 Health Check
- **Route:** `GET /health`
- **Auth:** None
- **Summary:** Verifies database and cache service connectivity.
- **Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-11-17T14:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2.2 Metadata Options
- **Route:** `GET /meta/options`
- **Auth:** None
- **Summary:** Retrieves platform dropdown values (cached in Redis for 24h).
- **Response (200 OK):**
```json
{
  "data": {
    "roles": ["Software Engineer", "Frontend Developer", "Backend Engineer", "DevOps Engineer"],
    "interviewTypes": ["HR", "TECHNICAL", "BEHAVIOURAL", "MIXED"],
    "difficulties": ["EASY", "MEDIUM", "HARD"],
    "topics": ["Arrays", "Linked Lists", "Trees", "Dynamic Programming", "Graphs"],
    "experienceLevels": ["FRESHER", "0_1_YEARS", "1_3_YEARS"]
  }
}
```

---

## 3. Authentication & Profile Endpoints

### 3.1 Register Candidate
- **Route:** `POST /auth/register`
- **Auth:** None
- **Rate Limit:** 10 req / min / IP
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "targetRole": "Backend Engineer",
  "experienceLevel": "0_1_YEARS"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "jane@example.com"
  }
}
```

### 3.2 Verify Email OTP
- **Route:** `POST /auth/verify-otp`
- **Auth:** None
- **Request Body:**
```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "verified": true
  }
}
```

### 3.3 Resend Verification OTP
- **Route:** `POST /auth/resend-otp`
- **Auth:** None
- **Request Body:**
```json
{
  "email": "jane@example.com"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "sent": true
  }
}
```

### 3.4 Candidate & Admin Login
- **Route:** `POST /auth/login`
- **Auth:** None
- **Rate Limit:** 10 req / min / IP (5 failed attempts trigger 15-min lockout)
- **Request Body:**
```json
{
  "email": "candidate@sdp.com",
  "password": "CandidatePass123!"
}
```
- **Response (200 OK):**  
  *Sets HTTP-Only Cookie `refreshToken`*
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "c0a8012b-...",
      "name": "Candidate User",
      "email": "candidate@sdp.com",
      "role": "CANDIDATE"
    }
  }
}
```

### 3.5 Refresh Session Token
- **Route:** `POST /auth/refresh`
- **Auth:** Requires valid `refreshToken` cookie
- **Response (200 OK):**  
  *Sets rotated HTTP-Only Cookie `refreshToken`*
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

### 3.6 Logout
- **Route:** `POST /auth/logout`
- **Auth:** Requires valid `refreshToken` cookie
- **Response (204 No Content):** Revokes token in DB and clears cookie.

### 3.7 Profile Management (`/me`)
- **`GET /me`**: Fetch current user profile.
- **`PATCH /me`**: Update `name`, `targetRole`, `experienceLevel`, or `skills`.
- **`POST /me/change-password`**: Updates password given `oldPassword` and `newPassword`.
- **`DELETE /me`**: Soft-deletes user account (starts 30-day grace period).

---

## 4. Adaptive Mock Interview Endpoints

### 4.1 Initialize Interview Session
- **Route:** `POST /sessions`
- **Auth:** Bearer Token
- **Rate Limit:** 60/hr and 100/day
- **Request Body:**
```json
{
  "role": "Full Stack Developer",
  "type": "TECHNICAL",
  "difficulty": "EASY",
  "questionCount": 5,
  "timerSeconds": 180,
  "mode": "TEXT"
}
```
- **Response (201 Created):**
```json
{
  "data": {
    "sessionId": "a1b2c3d4-...",
    "status": "IN_PROGRESS",
    "config": {
      "role": "Full Stack Developer",
      "type": "TECHNICAL",
      "difficulty": "EASY",
      "questionCount": 5,
      "timerSeconds": 180,
      "mode": "TEXT"
    },
    "question": {
      "id": "q1-instance-uuid",
      "index": 1,
      "text": "Explain the difference between SQL and NoSQL databases. When would you choose one over the other?",
      "type": "TECHNICAL",
      "difficulty": "EASY"
    },
    "total": 5
  }
}
```

### 4.2 Get Active Session State
- **Route:** `GET /sessions/:id`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": {
    "id": "a1b2c3d4-...",
    "status": "IN_PROGRESS",
    "currentIndex": 1,
    "total": 5,
    "answeredCount": 0,
    "question": {
      "id": "q1-instance-uuid",
      "index": 1,
      "text": "Explain the difference between SQL and NoSQL databases...",
      "type": "TECHNICAL",
      "difficulty": "EASY"
    }
  }
}
```

### 4.3 Submit Answer for Evaluation
- **Route:** `POST /sessions/:id/answers`
- **Auth:** Bearer Token
- **Headers:** Optional `Idempotency-Key: <uuid>`
- **Request Body:**
```json
{
  "questionId": "q1-instance-uuid",
  "answerText": "SQL databases are relational and structured with ACID transactions, whereas NoSQL is non-relational and scales horizontally for unstructured documents.",
  "timeTakenSeconds": 45
}
```
- **Response (202 Accepted):**
```json
{
  "data": {
    "answerId": "ans-uuid-...",
    "evalStatus": "PENDING"
  }
}
```

### 4.4 Poll Answer Evaluation Result
- **Route:** `GET /sessions/:id/answers/:answerId`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": {
    "evalStatus": "DONE",
    "scores": {
      "relevance": 8.5,
      "correctness": 9.0,
      "clarity": 8.0,
      "completeness": 8.5,
      "overall": 8.5
    },
    "feedback": "Strong concise comparison covering relational integrity vs horizontal scalability. Consider giving concrete examples like PostgreSQL vs MongoDB.",
    "sampleAnswer": "SQL databases use structured schemas and ACID guarantees (e.g., PostgreSQL), ideal for transactions. NoSQL offers flexible schemas (e.g., MongoDB, Redis), ideal for rapid schema evolution and horizontal partitioning.",
    "nextDifficulty": "MEDIUM",
    "nextQuestion": {
      "id": "q2-instance-uuid",
      "index": 2,
      "text": "How do database indexes work internally, and what are the trade-offs of B-Tree versus Hash indexes?",
      "type": "TECHNICAL",
      "difficulty": "MEDIUM"
    },
    "isLast": false
  }
}
```

### 4.5 Skip Question
- **Route:** `POST /sessions/:id/skip`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "questionId": "q1-instance-uuid"
}
```
- **Response (200 OK):** Records skip with score 0.0 and returns next pre-generated question.

### 4.6 Pause / Resume / End Session
- **`POST /sessions/:id/pause`**: Transitions session to `PAUSED`.
- **`POST /sessions/:id/resume`**: Restores session to `IN_PROGRESS`.
- **`POST /sessions/:id/end`**: Concludes session, transitioning to `COMPLETED` or `ENDED_EARLY`.

### 4.7 Get Completed Session Breakdown
- **Route:** `GET /sessions/:id/result`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": {
    "resultStatus": "READY",
    "overallScore": 8.2,
    "criteriaAverages": {
      "relevance": 8.5,
      "correctness": 8.3,
      "clarity": 8.0,
      "completeness": 8.0
    },
    "strengths": ["Database Architecture", "Concurrency Control"],
    "weakAreas": ["Distributed Systems Edge Cases"],
    "suggestions": ["Practice explaining trade-offs in CAP theorem scenarios"],
    "questions": [
      {
        "index": 1,
        "text": "Explain SQL vs NoSQL...",
        "answerText": "SQL is...",
        "skipped": false,
        "scores": { "overall": 8.5 },
        "feedback": "...",
        "sampleAnswer": "..."
      }
    ]
  }
}
```

---

## 5. Coding Practice & Sandboxed Execution Endpoints

### 5.1 Browse Problem Topics
- **Route:** `GET /coding/topics`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": [
    {
      "topic": "Arrays & Strings",
      "total": 8,
      "easy": 4,
      "medium": 3,
      "hard": 1
    },
    {
      "topic": "Dynamic Programming",
      "total": 6,
      "easy": 1,
      "medium": 3,
      "hard": 2
    }
  ]
}
```

### 5.2 List Problems Catalog
- **Route:** `GET /coding/problems?topic=Arrays&difficulty=EASY&page=1&limit=20`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": [
    {
      "id": "prob-uuid-1",
      "title": "Two Sum",
      "slug": "two-sum",
      "topic": "Arrays & Strings",
      "difficulty": "EASY",
      "isSolved": true,
      "attemptCount": 3
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 5.3 Get Problem Details (Confidentiality Enforced)
- **Route:** `GET /coding/problems/:id`
- **Auth:** Bearer Token
- **Response (200 OK):**  
  *Never leaks hidden test cases!*
```json
{
  "data": {
    "id": "prob-uuid-1",
    "title": "Two Sum",
    "slug": "two-sum",
    "topic": "Arrays & Strings",
    "difficulty": "EASY",
    "statement": "Given an array of integers `nums` and an integer `target`...",
    "constraints": "- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9",
    "samples": [
      {
        "input": "2 7 11 15\n9",
        "output": "0 1"
      }
    ],
    "starterCode": {
      "python": "def twoSum(nums, target):\n    # Write code here\n    pass\n",
      "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}\n",
      "cpp": "#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}\n"
    },
    "solved": true
  }
}
```

### 5.4 Run Code (Sample Cases or Custom Stdin)
- **Route:** `POST /coding/problems/:id/run`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "language": "python",
  "code": "import sys\nlines = sys.stdin.read().splitlines()\nnums = list(map(int, lines[0].split()))\ntarget = int(lines[1])\nseen = {}\nfor i, n in enumerate(nums):\n    if target - n in seen:\n        print(f\"{seen[target - n]} {i}\")\n        break\n    seen[n] = i\n",
  "customInput": "3 2 4\n6"
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "passedCount": 1,
    "total": 1,
    "results": [
      {
        "caseNo": 1,
        "visible": true,
        "verdict": "PASSED",
        "runtimeMs": 32,
        "expected": "1 2",
        "actual": "1 2"
      }
    ]
  }
}
```

### 5.5 Submit Solution (All Test Cases)
- **Route:** `POST /coding/problems/:id/submit`
- **Auth:** Bearer Token
- **Headers:** Optional `Idempotency-Key: <uuid>`
- **Request Body:**
```json
{
  "language": "python",
  "code": "import sys\nlines = sys.stdin.read().splitlines()\n..."
}
```
- **Response (200 OK):**
```json
{
  "data": {
    "id": "attempt-uuid-...",
    "status": "PASSED",
    "passedCount": 10,
    "total": 10,
    "results": [
      { "caseNo": 1, "visible": true, "verdict": "PASSED", "runtimeMs": 28 },
      { "caseNo": 2, "visible": false, "verdict": "PASSED", "runtimeMs": 31 }
    ]
  }
}
```

---

## 6. Candidate Analytics & PDF Reports Endpoints

### 6.1 Dashboard KPI Summary
- **Route:** `GET /dashboard/summary?from=2026-01-01&to=2026-11-17`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": {
    "totalSessions": 15,
    "completedSessions": 12,
    "averageScore": 7.8,
    "bestScore": 9.2,
    "lastSessionAt": "2026-11-17T10:30:00.000Z"
  }
}
```

### 6.2 Progression Trend
- **Route:** `GET /dashboard/trend?granularity=day`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "data": [
    { "date": "2026-11-10", "averageScore": 7.1, "sessions": 2 },
    { "date": "2026-11-12", "averageScore": 8.0, "sessions": 3 },
    { "date": "2026-11-17", "averageScore": 8.4, "sessions": 1 }
  ]
}
```

### 6.3 Queue PDF Readiness Report
- **Route:** `POST /reports`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "from": "2026-10-01",
  "to": "2026-11-17"
}
```
- **Response (202 Accepted):**
```json
{
  "data": {
    "reportId": "rep-uuid-...",
    "status": "QUEUED"
  }
}
```

### 6.4 Download PDF Report Stream
- **Route:** `GET /reports/:id/download`
- **Auth:** Bearer Token
- **Response (200 OK):**  
  Binary PDF stream (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="Interview_Report_rep-uuid.pdf"`).

---

## 7. Administrative Portal Endpoints

### 7.1 Platform Analytics
- **Route:** `GET /admin/stats`
- **Auth:** Admin Bearer Token
- **Response (200 OK):**
```json
{
  "data": {
    "totalUsers": 1250,
    "activeUsers": 1180,
    "totalSessions": 4320,
    "totalQuestions": 245,
    "sessionsToday": 68
  }
}
```

### 7.2 Question Bank CRUD
- **`GET /admin/questions`**: Paginated query with `q`, `type`, `role`, `difficulty`.
- **`POST /admin/questions`**: Creates question with duplicate detection (HTTP 409 if exists).
- **`PATCH /admin/questions/:id`**: Updates question prompt or rubric.
- **`DELETE /admin/questions/:id`**: Deletes question and records audit log.

### 7.3 Bulk CSV Question Ingestion
- **Route:** `POST /admin/questions/bulk`
- **Auth:** Admin Bearer Token
- **Payload:** Multipart/form-data with CSV file containing headers: `text, type, role, difficulty, idealAnswer`.
- **Response (200 OK):**
```json
{
  "data": {
    "inserted": 25,
    "failedCount": 2,
    "failed": [
      { "row": 14, "reason": "Invalid type 'GRAPH_ALGO'" },
      { "row": 19, "reason": "Text must be at least 10 characters" }
    ]
  }
}
```

### 7.4 User Moderation
- **`GET /admin/users`**: Lists candidates with status filter (`ACTIVE` / `BLOCKED`).
- **`PATCH /admin/users/:id/status`**: Sets status (`{"status": "BLOCKED"}` or `{"status": "ACTIVE"}`).

### 7.5 Security Audit Logs
- **Route:** `GET /admin/audit-logs?event=LOGIN_FAILED&page=1&limit=50`
- **Auth:** Admin Bearer Token
- **Response (200 OK):**
```json
{
  "data": [
    {
      "id": "log-uuid-1",
      "userId": "c0a8012b-...",
      "event": "LOGIN_FAILED",
      "ip": "192.168.1.105",
      "details": { "email": "candidate@sdp.com", "consecutiveFailures": 2 },
      "createdAt": "2026-11-17T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 1 }
}
```

# Database & Data Architecture Specification
## AI-Assisted Interview Preparation & Coding Practice Platform
**Document Identifier:** `SDP-DB-2026-V2`  
**System Version:** 2.0.0  
**Database Engines:** PostgreSQL 16 (Persistent Store) & Redis 7 (In-Memory Key-Value)  
**ORM:** Prisma 5.10  

---

## 1. Database Architecture Overview

The system uses a hybrid persistence architecture combining relational ACID guarantees with high-velocity in-memory caching:
1. **Relational Core (PostgreSQL 16):** Houses primary domain models, user credentials, interview sessions, answers, coding problems, test cases, attempts, readiness reports, and audit logs. All schema definitions, migrations, and query operations are managed via **Prisma ORM**.
2. **Volatile Key-Value Store (Redis 7):** Houses high-velocity, ephemeral operational state:
   - 6-digit verification OTP tokens and 60-second cooldown timers.
   - Account lockout state (15-minute cooldown) and failed login tracking.
   - Sliding-window rate limit counters across authentication and AI endpoints.
   - Pre-computed system metadata options (cached for 24 hours).

---

## 2. Enums and Domain Enumerations

The relational database enforces domain values via PostgreSQL `ENUM` types defined in `schema.prisma`:

| Enum Name | Allowed Values | Semantic Purpose |
| :--- | :--- | :--- |
| `Role` | `CANDIDATE`, `ADMIN` | Role-based authorization privileges |
| `UserStatus` | `ACTIVE`, `BLOCKED` | Candidate access state |
| `ExperienceLevel` | `FRESHER`, `0_1_YEARS` (`ZERO_TO_ONE`), `1_3_YEARS` (`ONE_TO_THREE`) | Candidate experience tier |
| `InterviewType` | `HR`, `TECHNICAL`, `BEHAVIOURAL`, `MIXED` | Category of mock interview questions |
| `Difficulty` | `EASY`, `MEDIUM`, `HARD` | Question and problem complexity level |
| `SessionStatus` | `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `ENDED_EARLY` | Mock interview session lifecycle state |
| `EvalStatus` | `PENDING`, `DONE`, `FAILED` | Asynchronous answer grading state |
| `InterviewMode` | `TEXT`, `VOICE` | Modality of interview interaction |
| `ResultStatus` | `GENERATING`, `READY` | State of session completion summary report |
| `ReportStatus` | `QUEUED`, `READY`, `FAILED` | State of PDF readiness report generation |

---

## 3. Data Dictionary & Table Specifications

### 3.1 `User`
Stores candidate and administrator profiles, credentials, target roles, and lifecycle flags.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Unique user identifier |
| `name` | `VARCHAR(100)`| No | None | None | Full name of candidate or admin |
| `email` | `VARCHAR(255)`| No | None | Unique | Unique email address (lowercased) |
| `passwordHash` | `VARCHAR(255)`| No | None | None | Bcrypt hash (work factor: 12) |
| `role` | `Role` | No | `CANDIDATE` | Enum | Access level |
| `status` | `UserStatus` | No | `ACTIVE` | Enum | Account active or blocked |
| `targetRole` | `VARCHAR(100)`| No | `"Software Engineer"` | None | Target career role |
| `experienceLevel`| `ExperienceLevel`| No | `FRESHER` | Enum | Years of professional experience |
| `skills` | `JSONB` | No | `'[]'` | Valid JSON | Array of string skill tags |
| `emailVerified` | `BOOLEAN` | No | `false` | None | True when OTP verified |
| `markedForDeletionAt`| `TIMESTAMP` | Yes | `null` | None | Timestamp when candidate requested deletion |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Entity creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Auto | None | Entity update timestamp |

**Indexes:**
- `@@unique([email])`
- `@@index([role, status])`
- `@@index([createdAt])`

---

### 3.2 `RefreshToken`
Tracks active session refresh tokens for sliding token rotation.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Unique token entity ID |
| `userId` | `VARCHAR(36)` | No | None | FK -> `User(id)` | Foreign key to user (`onDelete: Cascade`) |
| `tokenHash` | `VARCHAR(64)` | No | None | None | SHA-256 hash of plain refresh token |
| `expiresAt` | `TIMESTAMP` | No | None | None | Absolute expiration (+30 mins sliding) |
| `revokedAt` | `TIMESTAMP` | Yes | `null` | None | Timestamp when invalidated on logout/rotation |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Token creation timestamp |

**Indexes:**
- `@@index([userId])`

---

### 3.3 `PasswordReset`
Stores single-use tokens for forgot password flows.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Identifier |
| `userId` | `VARCHAR(36)` | No | None | FK -> `User(id)` | Foreign key to user (`onDelete: Cascade`) |
| `tokenHash` | `VARCHAR(64)` | No | None | None | SHA-256 hash of reset token |
| `expiresAt` | `TIMESTAMP` | No | None | None | Token expiry timestamp (1 hour TTL) |
| `usedAt` | `TIMESTAMP` | Yes | `null` | None | Timestamp when consumed |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Issuance timestamp |

**Indexes:**
- `@@index([userId])`

---

### 3.4 `Question`
The platform Question Bank containing 230+ seeded questions and administrator-created questions.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Unique question identifier |
| `text` | `TEXT` | No | None | None | Verbatim question prompt |
| `normalizedText`| `TEXT` | No | None | None | Normalized text for duplicate detection |
| `type` | `InterviewType`| No | None | Enum | Question classification (`HR`, `TECHNICAL`, etc.) |
| `role` | `VARCHAR(100)`| No | None | None | Target role |
| `difficulty` | `Difficulty` | No | None | Enum | Difficulty level |
| `idealAnswer` | `TEXT` | Yes | `null` | None | Reference benchmark answer & rubric |
| `isSeeded` | `BOOLEAN` | No | `false` | None | True for initial seed question |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Auto | None | Last modified timestamp |

**Indexes:**
- `@@index([type, role, difficulty])` (Fast fallback queries)
- `@@index([normalizedText])` (Deduplication lookup)

---

### 3.5 `Session`
Represents an active, paused, or completed adaptive interview loop.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Session identifier |
| `userId` | `VARCHAR(36)` | No | None | FK -> `User(id)` | Foreign key (`onDelete: Cascade`) |
| `role` | `VARCHAR(100)`| No | None | None | Job role selected for the interview |
| `type` | `InterviewType`| No | None | Enum | Interview category |
| `difficulty` | `Difficulty` | No | None | Enum | Initial starting difficulty |
| `currentDifficulty`| `Difficulty`| No | None | Enum | Current adapted difficulty level |
| `questionCount` | `INT` | No | `5` | Min: 5, Max: 20| Total configured questions |
| `currentIndex` | `INT` | No | `0` | None | Zero-based index of active question |
| `status` | `SessionStatus`| No | `IN_PROGRESS` | Enum | Lifecycle status |
| `timerSeconds` | `INT` | Yes | `null` | 30 - 600s | Optional countdown timer per question |
| `mode` | `InterviewMode`| No | `TEXT` | Enum | `TEXT` or `VOICE` interaction |
| `resultStatus` | `ResultStatus` | No | `GENERATING` | Enum | Summary compilation status |
| `overallScore` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Mean score across answered questions |
| `criteriaScores` | `JSONB` | Yes | `null` | JSON Object | Averages for relevance, correctness, etc. |
| `strengths` | `JSONB` | Yes | `null` | JSON Array | Top candidate competencies identified by AI |
| `weakAreas` | `JSONB` | Yes | `null` | JSON Array | Technical gaps requiring practice |
| `suggestions` | `JSONB` | Yes | `null` | JSON Array | Actionable guidance for improvement |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Session start timestamp |
| `updatedAt` | `TIMESTAMP` | No | Auto | None | Last interaction timestamp |

**Indexes:**
- `@@index([userId, createdAt])` (Chronological history & trends)
- `@@index([status])` (Resumable session lookups)

---

### 3.6 `SessionQuestion`
Represents a specific question instance served during an interview session.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Instance identifier |
| `sessionId` | `VARCHAR(36)` | No | None | FK -> `Session(id)` | Foreign key (`onDelete: Cascade`) |
| `questionId` | `VARCHAR(36)` | Yes | `null` | None | ID of bank question if fallback used |
| `questionText` | `TEXT` | No | None | None | Text of question presented |
| `type` | `InterviewType`| No | None | Enum | Question type |
| `difficulty` | `Difficulty` | No | None | Enum | Difficulty at time of generation |
| `index` | `INT` | No | None | 0 to (count-1) | Sequence position in session |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Creation timestamp |

**Indexes:**
- `@@index([sessionId, index])`

---

### 3.7 `Answer`
Stores the candidate's answer, rubric evaluation scores, qualitative feedback, and sample answer.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Answer identifier |
| `sessionId` | `VARCHAR(36)` | No | None | FK -> `Session(id)` | Foreign key (`onDelete: Cascade`) |
| `sessionQuestionId`| `VARCHAR(36)`| No | None | FK -> `SessionQuestion(id)` | Unique (`onDelete: Cascade`) |
| `answerText` | `TEXT` | Yes | `null` | Max 2000 chars | Verbatim response from candidate |
| `timeTakenSeconds`| `INT` | No | `0` | $\ge 0$ | Elapsed time spent on question |
| `skipped` | `BOOLEAN` | No | `false` | None | True if question skipped |
| `evalStatus` | `EvalStatus` | No | `PENDING` | Enum | Evaluation processing status |
| `relevance` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Relevance score |
| `correctness` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Technical accuracy score |
| `clarity` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Articulation and conciseness score |
| `completeness` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Coverage score |
| `overall` | `FLOAT` | Yes | `null` | 0.0 - 10.0 | Mean score of the 4 criteria |
| `feedback` | `TEXT` | Yes | `null` | None | Constructive evaluation commentary |
| `sampleAnswer` | `TEXT` | Yes | `null` | None | Exemplar benchmark answer |
| `rubricVersion` | `VARCHAR(10)` | No | `"1.0"` | None | Rubric schema version |
| `promptVersion` | `VARCHAR(10)` | No | `"1.0"` | None | Prompt engineering version |
| `idempotencyKey`| `VARCHAR(64)` | Yes | `null` | Unique | Idempotent submission key |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Submission timestamp |
| `updatedAt` | `TIMESTAMP` | No | Auto | None | Last update timestamp |

**Indexes:**
- `@@unique([sessionQuestionId])` (1-to-1 relation)
- `@@unique([idempotencyKey])` (Replay protection)
- `@@index([sessionId])`

---

### 3.8 `CodingProblem` & `TestCase`
Represents competitive programming challenges and their associated test vectors.

#### `CodingProblem`:
| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Problem identifier |
| `title` | `VARCHAR(200)`| No | None | None | Problem title |
| `slug` | `VARCHAR(200)`| No | None | Unique | URL slug (e.g. `two-sum`) |
| `topic` | `VARCHAR(100)`| No | None | None | Category (e.g. `Arrays`, `Graphs`) |
| `difficulty` | `Difficulty` | No | None | Enum | Problem difficulty |
| `statement` | `TEXT` | No | None | None | Markdown problem description |
| `constraints` | `TEXT` | No | None | None | Time/space complexity constraints |
| `sampleCases` | `JSONB` | No | None | JSON Array | Array of `{ input, output }` |
| `starterCode` | `JSONB` | No | None | JSON Object | Templates for python, java, cpp |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Creation timestamp |
| `updatedAt` | `TIMESTAMP` | No | Auto | None | Last update timestamp |

**Indexes:**
- `@@unique([slug])`
- `@@index([topic, difficulty])`

#### `TestCase`:
| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Test case identifier |
| `problemId` | `VARCHAR(36)` | No | None | FK -> `CodingProblem(id)` | Foreign key (`onDelete: Cascade`) |
| `input` | `TEXT` | No | None | None | Input passed to stdin |
| `expectedOutput`| `TEXT` | No | None | None | Expected stdout string |
| `isHidden` | `BOOLEAN` | No | `false` | None | True for secret verification test cases |
| `orderIndex` | `INT` | No | `0` | None | Sequence order in execution |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Creation timestamp |

**Indexes:**
- `@@index([problemId])`

---

### 3.9 `CodingAttempt`
Records candidate code submissions and test case execution results.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Submission identifier |
| `userId` | `VARCHAR(36)` | No | None | FK -> `User(id)` | Foreign key (`onDelete: Cascade`) |
| `problemId` | `VARCHAR(36)` | No | None | FK -> `CodingProblem(id)` | Foreign key (`onDelete: Cascade`) |
| `language` | `VARCHAR(20)` | No | None | `python`, `java`, `cpp` | Programming language |
| `code` | `TEXT` | No | None | Max 64 KB | Candidate source code |
| `status` | `VARCHAR(30)` | No | `"QUEUED"` | None | Overall verdict (`PASSED`, `TLE`, etc.) |
| `passedCount` | `INT` | No | `0` | None | Number of test cases passed |
| `totalCount` | `INT` | No | `0` | None | Total test cases evaluated |
| `compileError` | `TEXT` | Yes | `null` | None | Compiler error output (if any) |
| `results` | `JSONB` | Yes | `null` | JSON Array | Array of individual test case results |
| `idempotencyKey`| `VARCHAR(64)` | Yes | `null` | Unique | Replay prevention key |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Submission timestamp |

**Indexes:**
- `@@unique([idempotencyKey])`
- `@@index([userId, createdAt])`
- `@@index([problemId])`

---

### 3.10 `Report`
Tracks generated candidate PDF readiness reports.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Report identifier |
| `userId` | `VARCHAR(36)` | No | None | FK -> `User(id)` | Foreign key (`onDelete: Cascade`) |
| `status` | `ReportStatus`| No | `QUEUED` | Enum | `QUEUED`, `READY`, `FAILED` |
| `fromDate` | `TIMESTAMP` | Yes | `null` | None | Start of reporting date window |
| `toDate` | `TIMESTAMP` | Yes | `null` | None | End of reporting date window |
| `filePath` | `VARCHAR(500)`| Yes | `null` | None | Filesystem path on server |
| `downloadUrl` | `VARCHAR(500)`| Yes | `null` | None | Expiring download route |
| `expiresAt` | `TIMESTAMP` | No | None | +24 hours | Report expiration timestamp |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Creation timestamp |

**Indexes:**
- `@@index([userId, createdAt])`

---

### 3.11 `AuditLog`
Immutable administrative and security event logs.

| Column Name | Data Type | Nullable | Default | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | No | `uuid()` | Primary Key | Log event identifier |
| `userId` | `VARCHAR(36)` | Yes | `null` | FK -> `User(id)` | User who triggered action (`onDelete: SetNull`) |
| `event` | `VARCHAR(100)`| No | None | None | Event tag (e.g. `LOGIN_FAILED`, `ADMIN_CREATE_QUESTION`) |
| `ip` | `VARCHAR(45)` | Yes | `null` | None | Origin IPv4 or IPv6 |
| `details` | `JSONB` | Yes | `null` | JSON Object | Event-specific metadata payload |
| `createdAt` | `TIMESTAMP` | No | `NOW()` | None | Timestamp of event occurrence |

**Indexes:**
- `@@index([event, createdAt])`

---

## 4. Referential Integrity & Cascade Rules

```
+--------------------------------------------------------------+
|                          User Table                          |
+--+-------------------+--------------------+---------------+--+
   | (Cascade)         | (Cascade)          | (Cascade)     | (SetNull)
   v                   v                    v               v
[Session]      [CodingAttempt]          [Report]       [AuditLog]
   | (Cascade)
   v
[SessionQuestion]
   | (Cascade)
   v
[Answer]
```

1. **Cascading Purges (`onDelete: Cascade`):** Deleting a `User` cascades down to delete their `RefreshToken`, `PasswordReset`, `Session`, `SessionQuestion`, `Answer`, `CodingAttempt`, and `Report` records automatically.
2. **Audit Preservation (`onDelete: SetNull`):** When a candidate account is expunged, corresponding `AuditLog` rows are preserved with `userId = null` to maintain forensic audit history without violating referential constraints.
3. **Problem Cascading:** Deleting a `CodingProblem` cascades to all associated `TestCase` and `CodingAttempt` records.

---

## 5. Soft Deletion & GDPR Purge Lifecycle

The platform implements a GDPR-compliant two-phase deletion strategy:
1. **Phase 1 (Soft Deletion):** When a user requests deletion (`DELETE /api/v1/me`), the system sets `markedForDeletionAt = NOW()` and revokes all active refresh tokens.
2. **Phase 2 (Reactivation Grace Period):** If the user authenticates successfully within 30 days, the system clears `markedForDeletionAt = null`, restoring the account.
3. **Phase 3 (Permanent Purge):** The scheduled background worker `purgeDeletedAccountsJob.ts` runs periodically:
   ```sql
   DELETE FROM "User" 
   WHERE "markedForDeletionAt" IS NOT NULL 
     AND "markedForDeletionAt" <= NOW() - INTERVAL '30 days';
   ```
   PostgreSQL cascades this delete across all related tables.

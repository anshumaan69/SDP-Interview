# Software Requirements Specification (SRS)
## AI-Assisted Interview Preparation & Coding Practice Platform
**Document Identifier:** `SDP-SRS-2026-V2`  
**Standard Compliance:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018  
**System Version:** 2.0.0  
**Status:** Approved / Production Baseline  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) describes the complete functional, non-functional, interface, and behavioral requirements for the **AI Interview Preparation Platform** (SDP-Interview). This document serves as the authoritative agreement between platform stakeholders, product engineers, system architects, and quality assurance teams.

### 1.2 Scope of the System
The AI Interview Preparation Platform is a production-grade, full-stack educational technology system designed to simulate realistic technical and behavioral hiring loops for software engineering candidates. The platform delivers:
- **Adaptive Mock Interviews:** Dynamic, real-time question generation powered by Large Language Models (LLMs - Google Gemini 1.5 Flash) with fallback to a seeded bank of 230+ curated questions across 8 industry roles and 4 interview categories.
- **Rubric-Driven Evaluation:** Multi-criteria automated assessment scoring candidates across Relevance, Correctness, Clarity, and Completeness (scale 0.0–10.0), augmented with qualitative feedback and exemplar answers.
- **Sandboxed Coding Practice:** A secure, isolated competitive coding environment executing Python 3, Java, and C++ against curated algorithmic problems with strict resource bounds (5s CPU timeout, 64KB I/O buffer, memory bounds) via Judge0 batch API or local isolated process containment.
- **Candidate Analytics & Reporting:** Real-time analytics dashboards, time-series progression curves, radar charts, and server-side PDF readiness reports generated via PDFKit with signed streaming downloads.
- **Administration & Moderation:** Comprehensive management portals offering KPI metrics, question bank CRUD with whitespace-normalized duplicate detection, bulk CSV ingestion with row-level validation, user blocking/unblocking, and immutable audit logs.

### 1.3 Definitions, Acronyms, and Abbreviations
| Term / Acronym | Definition |
| :--- | :--- |
| **API** | Application Programming Interface (RESTful over HTTP/HTTPS) |
| **Bcrypt** | Password-hashing function based on the Blowfish cipher (Cost Factor: 12) |
| **C4 Model** | Context, Containers, Components, and Code software architecture model |
| **CPU Limit** | Maximum allowed processor compute time (hard limit: 5000 ms) |
| **CSV** | Comma-Separated Values file format |
| **DTO** | Data Transfer Object |
| **GDPR** | General Data Protection Regulation (EU 2016/679) |
| **HLD** | High-Level Design |
| **Idempotency** | Property of an API operation where repeated identical requests produce the same result |
| **JWT** | JSON Web Token (RFC 7519) |
| **LLD** | Low-Level Design |
| **LLM** | Large Language Model (Google Gemini 1.5 Flash via REST) |
| **Judge0** | Open-source multi-language code execution engine |
| **OTP** | One-Time Password (6-digit numeric verification token) |
| **RBAC** | Role-Based Access Control |
| **Prisma** | Next-generation Node.js/TypeScript Object-Relational Mapping (ORM) |
| **Redis** | In-memory key-value data structure store used for caching and state tracking |
| **SRS** | Software Requirements Specification |
| **TLE** | Time Limit Exceeded (execution exceeded 5.0 seconds) |
| **TTL** | Time-To-Live (expiration duration in seconds/milliseconds) |
| **UUID** | Universally Unique Identifier (Version 4, 128-bit) |

### 1.4 References
- IEEE Std 830-1998: IEEE Recommended Practice for Software Requirements Specifications.
- ISO/IEC/IEEE 29148:2018: Systems and software engineering — Life cycle processes — Requirements engineering.
- RFC 7519: JSON Web Token (JWT).
- RFC 6749: The OAuth 2.0 Authorization Framework.
- Google Gemini API Reference (Gemini 1.5 Flash models).
- Judge0 API Documentation (v1.13.0).

---

## 2. Overall Description

### 2.1 Product Perspective
The AI Interview Preparation Platform is an integrated monorepo comprising three principal tiers:
1. **Presentation Layer (`apps/web`):** Next.js 14 App Router application providing reactive interfaces for public onboarding, candidate practice, and administrative oversight.
2. **Application & Business Logic Layer (`apps/api`):** Express.js REST application operating on Node.js and TypeScript, enforcing authentication, validation, domain services, rate limiting, and background orchestration.
3. **Data & Infrastructure Layer:** PostgreSQL 16 relational database for persistent business data, Redis 7 for high-velocity volatile data (OTP, lockout state, rate limiting, and cache), and sandboxed execution environments.
4. **Shared Domain Layer (`packages/shared`):** Canonical TypeScript types, Zod schemas, and system enums shared across frontend and backend boundaries.

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|      (Candidate Portal / Admin Dashboard / Guest Auth)       |
+------------------------------+------------------------------+
                               | HTTPS / REST / Cookies
+------------------------------v------------------------------+
|            Web Frontend (Next.js 14 App Router)             |
+------------------------------+------------------------------+
                               | REST v1 (Port 4001)
+------------------------------v------------------------------+
|            Backend API Gateway (Express / Node.js)           |
|  [Auth] [RateLimit] [Validate] [RequestId] [ErrorHandler]   |
+--------+---------------+--------------------+---------------+
         |               |                    |
+--------v-------+ +-----v--------+  +--------v-------+  +-----v--------+
| PostgreSQL 16  | |   Redis 7    |  | Gemini 1.5 LLM |  | Judge0 /     |
| (Prisma ORM)   | | (Cache/OTP)  |  | (API Fallback) |  | Local Runner |
+----------------+ +--------------+  +----------------+  +--------------+
```

### 2.2 User Classes and Characteristics
| User Persona | Role Identifier | Technical Sophistication | Primary Objectives |
| :--- | :--- | :--- | :--- |
| **Candidate** | `CANDIDATE` | Medium to High | Practice interview questions, write and debug algorithmic code, review rubric feedback, inspect analytical progress, export readiness reports. |
| **Administrator** | `ADMIN` | High | Monitor platform metrics, manage question repository, ingest bulk question sets via CSV, manage candidate access, inspect security audit logs. |
| **Unregistered Guest** | N/A | Variable | Review public landing pages, explore feature overviews, register for an account, initiate password recovery. |

### 2.3 Operating Environment
- **Server OS:** Linux (Ubuntu 22.04 LTS / Alpine Linux 3.19 container base).
- **Runtime Environment:** Node.js `>= 18.18.0` (target v20/v22), TypeScript `5.3+`, `pnpm` workspace `>= 8.x`.
- **Database Engine:** PostgreSQL 16.
- **Cache Engine:** Redis 7.0+.
- **Client Platforms:** Modern evergreen web browsers (Chromium `>= 110`, Firefox `>= 110`, Safari `>= 16`).

### 2.4 Design and Implementation Constraints
1. **Execution Security:** Candidate code submissions must never execute within the main API process context. Sandboxing with strict process timeouts (5s) and output buffers (64KB) is mandatory.
2. **Quota & Cost Protection:** External LLM calls are limited to 60 req/hr/user and 100 req/day/user. Deterministic offline fallback to database questions must guarantee 100% platform uptime.
3. **Monorepo Cohesion:** Type contracts, Zod schemas, and domain enums must reside in `@sdp/shared` to enforce compile-time type safety across both frontend and backend.
4. **Data Privacy (GDPR):** Account deletion requires soft-deletion with a 30-day reactivation grace period followed by automated cascading purge.

---

## 3. Specific System Requirements

### 3.1 Module 1: Authentication, Authorization & User Profile

#### FR-AUTH-01: Candidate Registration
- The system shall allow new users to register with `name` (2-100 chars), `email` (RFC-compliant), `password` ($\ge 8$ chars containing at least 1 letter and 1 digit), `targetRole`, and `experienceLevel` (`FRESHER`, `0_1_YEARS`, `1_3_YEARS`).
- Passwords must be hashed using Bcrypt with a work factor of 12.
- Upon registration, the system shall generate a 6-digit numeric OTP, persist it in Redis with a 10-minute TTL, and dispatch it via the configured email provider.
- Initial account status shall be `ACTIVE` with `emailVerified = false`.

#### FR-AUTH-02: OTP Verification & Resend
- The candidate must submit the 6-digit OTP to activate the account.
- The system shall allow a maximum of 3 invalid attempts per OTP before invalidating the token.
- A 60-second cooldown period shall be enforced between consecutive OTP resend requests via Redis key `otp_cooldown:<email>`.
- Successful verification shall mark `emailVerified = true` and purge the OTP record.

#### FR-AUTH-03: Candidate Authentication & Account Lockout
- The system shall authenticate users using email and password.
- If a candidate submits 5 consecutive incorrect passwords, the system shall lock the account for 15 minutes (900 seconds) in Redis (`lockout:<email>`), rejecting login attempts with HTTP 423 Locked.
- Blocked accounts (`status = BLOCKED`) shall be denied login with HTTP 403 Forbidden.
- Unverified accounts (`emailVerified = false`) shall be denied login with HTTP 403 Forbidden.
- Upon successful authentication, failed attempt counters in Redis shall be cleared.

#### FR-AUTH-04: Session Management & Sliding Token Rotation
- Upon valid login, the system shall issue:
  1. A signed JWT Access Token containing `userId`, `email`, `role`, and `name` with a 15-minute expiration.
  2. A cryptographically random 40-byte Refresh Token persisted in PostgreSQL (SHA-256 hashed) with a 30-minute sliding expiration, transmitted via `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- The endpoint `POST /api/v1/auth/refresh` shall validate the cookie, revoke the previous refresh token, issue a new access token, and slide the refresh token expiration forward by 30 minutes.
- Logout shall mark the refresh token as revoked (`revokedAt = NOW()`) and clear client cookies.

#### FR-AUTH-05: Password Recovery & Profile Management
- The system shall support password reset workflows via secure single-use tokens expiring within 1 hour.
- Authenticated users shall be able to update their `name`, `targetRole`, `experienceLevel`, and `skills` (string array, max 30 items).
- Candidates can request account deletion; the system shall verify their current password, set `markedForDeletionAt = NOW()`, and deactivate the account. If the user logs in within 30 days, deletion is canceled.

---

### 3.2 Module 2: Adaptive Mock Interviews

#### FR-INT-01: Session Initialization
- Candidates can initiate an interview session by configuring:
  - `role`: Target job title (e.g., "Full Stack Developer", "Backend Engineer").
  - `type`: `HR`, `TECHNICAL`, `BEHAVIOURAL`, or `MIXED`.
  - `difficulty`: Initial starting level (`EASY`, `MEDIUM`, `HARD`).
  - `questionCount`: Total questions for the session (integer, 5 to 20; default: 5).
  - `timerSeconds`: Optional per-question timer constraint (30 to 600 seconds).
  - `mode`: Interaction modality (`TEXT` or `VOICE`).
- Session status shall initialize to `IN_PROGRESS` with `currentIndex = 0`.
- The system shall synchronously generate or select Question 1 before returning HTTP 201 Created.

#### FR-INT-02: Dynamic Question Generation & Fallback
- The system shall attempt to generate questions via Google Gemini 1.5 Flash using structured prompt templates.
- **Deduplication Constraint:** The generated question must not duplicate any question presented to the candidate in their prior 5 interview sessions.
- **Resilience Fallback:** If the LLM provider fails (timeout, rate limit, parse error) after 2 retry attempts, the system must immediately select an unasked question from the 230+ seeded Question Bank matching the requested `role`, `type`, and `difficulty`.

#### FR-INT-03: Multi-Criteria Answer Evaluation
- When an answer is submitted (`POST /api/v1/sessions/:id/answers`), the system shall evaluate the response on 4 discrete criteria:
  1. **Relevance (0.0 - 10.0):** Directness and alignment with the prompt.
  2. **Correctness (0.0 - 10.0):** Accuracy of technical facts, syntax, and concepts.
  3. **Clarity (0.0 - 10.0):** Communication structure, conciseness, and articulation.
  4. **Completeness (0.0 - 10.0):** Coverage of core requirements and trade-offs.
- The overall answer score shall be calculated as:
  $$S_{overall} = \frac{\text{Relevance} + \text{Correctness} + \text{Clarity} + \text{Completeness}}{4}$$
- The evaluation shall provide constructive text feedback and an improved sample answer.
- An evaluation shall support `Idempotency-Key` headers to prevent double-grading on network replay.

#### FR-INT-04: Dynamic Difficulty Adaptation Engine
- After evaluating each question $k \ge 2$, the system shall compute the candidate's next difficulty level based on the last two evaluated questions $(S_{k-1}, S_k)$:
  - If $S_{k-1} \ge 7.5 \land S_k \ge 7.5$: Increase difficulty ($\text{EASY} \to \text{MEDIUM} \to \text{HARD}$).
  - If $S_{k-1} \le 4.0 \land S_k \le 4.0$: Decrease difficulty ($\text{HARD} \to \text{MEDIUM} \to \text{EASY}$).
  - Otherwise: Maintain current difficulty.
- The system shall pre-generate the subsequent question in the background at the newly adapted difficulty.

#### FR-INT-05: Question Skip & Session Lifecycle Controls
- Candidates may skip a question (`POST /api/v1/sessions/:id/skip`); skipped questions receive a score of 0.0 and are marked `skipped = true`.
- Candidates may pause (`status = PAUSED`) and resume (`status = IN_PROGRESS`) interview loops.
- Candidates may end sessions early or complete all questions, transitioning status to `COMPLETED` or `ENDED_EARLY`.
- Session completion triggers aggregated score calculation and qualitative summary generation (top strengths, areas for improvement, actionable suggestions).

---

### 3.3 Module 3: Sandboxed Coding Practice

#### FR-CODE-01: Problem Catalog & Filtering
- The system shall maintain 30 curated data structures and algorithms challenges classified by topic (e.g., Arrays, Trees, Dynamic Programming, Graphs) and difficulty (`EASY`, `MEDIUM`, `HARD`).
- Candidates can browse topics, inspect problem counts, filter by difficulty/topic, and track individual solved status.
- The system shall provide a `GET /api/v1/coding/problems/random` endpoint that prioritizes unsolved challenges.

#### FR-CODE-02: Problem Specification & Confidentiality
- Each problem includes title, slug, topic, difficulty, markdown statement, constraints, visible sample test cases, and starter code templates for Python 3, Java, and C++.
- **Confidentiality Rule:** The API must strictly filter out `isHidden = true` test cases from candidate-facing responses. Hidden test cases must never be leaked across the client network boundary.

#### FR-CODE-03: Code Execution Sandbox (Sample & Custom Stdin)
- Candidates can execute code against visible sample cases or custom input (`POST /api/v1/coding/problems/:id/run`).
- Execution must run within an isolated container/child-process sandbox with:
  - 5000 ms CPU execution timeout.
  - 64 KB output buffer limit (stdout and stderr truncation).
  - Isolated temporary workspace directories with automatic cleanup.
- Supported languages: Python 3 (`python3`), Java (`javac`/`java`), C++ (`g++ -O2`).

#### FR-CODE-04: Solution Submission & Verdict Engine
- When submitting a solution (`POST /api/v1/coding/problems/:id/submit`), the system runs the code against all test cases (both visible and hidden).
- The engine determines test verdicts:
  - `PASSED`: Output matches expected output (normalized whitespace).
  - `WRONG_ANSWER`: Output deviates from expected output.
  - `TLE`: Execution elapsed time exceeds 5000 ms.
  - `COMPILE_ERROR`: Compiler exited with non-zero exit code during build.
  - `RUNTIME_ERROR`: Process raised an unhandled exception or non-zero exit code.
- If all test cases pass, the attempt is marked `PASSED`, and the problem is recorded as solved for the candidate.
- Submissions support the `Idempotency-Key` header to prevent duplicate execution records.

---

### 3.4 Module 4: Analytics, Dashboard & Readiness Reports

#### FR-DASH-01: Aggregated Candidate Metrics
- The candidate dashboard shall compute:
  - Total interview sessions started and completed.
  - Overall average interview performance score.
  - All-time highest session score.
  - Timestamp of most recent interview practice.
- Supports optional date filtering (`from`, `to`).

#### FR-DASH-02: Progression Trends & Radar Distribution
- The system shall aggregate score progression over time grouped by `day` or `week`.
- The system shall expose historical performance across distinct interview categories (`HR`, `TECHNICAL`, `BEHAVIOURAL`) and coding challenge topics.

#### FR-DASH-03: Server-Side PDF Readiness Report Generation
- Candidates can request generation of an official PDF Readiness Report (`POST /api/v1/reports`).
- The backend asynchronously compiles candidate performance data into a formatted PDF document using `pdfkit`.
- Generated PDFs contain:
  1. Header with candidate name, email, target role, and timestamp.
  2. Executive performance summary (average score, total sessions, pass rate).
  3. Category score distribution tables and rubric breakdowns.
  4. Identified technical strengths and weakness analysis.
  5. Detailed chronological session history logs.
- The report is saved to `reports/generated/` and made available via a secure signed download endpoint expiring in 24 hours.

---

### 3.5 Module 5: Administrative Management & Governance

#### FR-ADM-01: Administrative KPI Dashboard
- The system shall provide administrators with platform-level metrics:
  - Total registered candidates and active candidate counts.
  - Cumulative interview sessions executed.
  - Total questions in repository.
  - Session throughput for the current UTC day.

#### FR-ADM-02: Question Bank Management & Normalized Deduplication
- Administrators can perform full CRUD on the curated Question Bank.
- **Duplicate Prevention:** Before creating or updating a question, the system shall normalize text (lowercase, whitespace collapse, punctuation strip). If a question with identical normalized text exists, the operation shall fail with HTTP 409 Conflict.

#### FR-ADM-03: Bulk CSV Question Import
- Administrators can upload CSV files containing question datasets.
- The importer validates required columns (`text`, `type`, `role`, `difficulty`, optional `idealAnswer`).
- The system processes rows in batch, records successfully created questions, and returns an itemized failure report detailing exact row numbers and validation failure reasons.

#### FR-ADM-04: User Moderation & Access Control
- Administrators can search, inspect, block, and unblock candidate accounts.
- Blocking an account instantly invalidates active refresh tokens and prevents subsequent login.

#### FR-ADM-05: Security Audit Logging
- The system shall automatically record critical security and administrative actions in the `AuditLog` table:
  - User login successes and failures (with IP).
  - Account lockout triggers.
  - Question creations, modifications, and deletions.
  - User status changes (blocking/unblocking).
  - Bulk question ingestion events.
- Audit records shall be immutable and queryable by event type, user, and date range.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Candidate Interface:** Clean, dark-themed responsive UI built using Next.js 14 App Router and Tailwind CSS, featuring persistent navigation, status indicators, dynamic question timers, Monaco-style coding panels, and Lucide icons.
- **Admin Portal:** Restricted administrative interface featuring analytical stat cards, searchable question and user tables, CSV drag-and-drop uploaders, and audit log explorers.

### 4.2 Software Interfaces
1. **Google Gemini Generative AI:**
   - Protocol: HTTPS REST (`https://generativelanguage.googleapis.com/v1beta`).
   - Model: `gemini-1.5-flash`.
   - Payload: Structured JSON prompts requesting schema-conformant JSON output.
2. **Judge0 Sandboxed API:**
   - Protocol: HTTP REST (`http://localhost:2358` or cloud endpoint).
   - Endpoints: `POST /submissions/batch`, `GET /submissions/batch?tokens=...`.
3. **PostgreSQL Database:**
   - Connector: Prisma ORM with connection pooling via `DATABASE_URL`.
4. **Redis Cache:**
   - Connector: `ioredis` with TCP connection pooling via `REDIS_URL`.
5. **Email Transport:**
   - Protocol: SMTP via `nodemailer` (supporting Ethereal/SendGrid/SES).

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance & Latency Requirements
- **NFR-PERF-01 (API Response Times):** Standard read/write REST endpoints must respond within $\le 200\text{ ms}$ at the 95th percentile under standard load.
- **NFR-PERF-02 (Synchronous First Question):** Session initialization must return Question 1 within $\le 2.5\text{ seconds}$. If external LLM exceeds 2.0s, deterministic fallback must fire.
- **NFR-PERF-03 (Coding Execution Timeout):** Code execution processes must enforce a hard kill after exactly $5000\text{ ms}$ of CPU time.
- **NFR-PERF-04 (Database Connection Pool):** Prisma must sustain a connection pool size between 10 and 50 connections with automatic timeout handling.

### 5.2 Security & Cryptographic Standards
- **NFR-SEC-01 (Password Encryption):** All user passwords must be hashed using Bcrypt with cost factor 12.
- **NFR-SEC-02 (Token Confidentiality):** Refresh tokens stored in PostgreSQL must be cryptographic SHA-256 digests; plain tokens must never be persisted.
- **NFR-SEC-03 (Cookie Hardening):** Refresh tokens must be set with `HttpOnly = true`, `Secure = true` (in production), and `SameSite = Strict`.
- **NFR-SEC-04 (Rate Limiting):**
  - Authentication routes: 10 requests / minute / IP.
  - LLM evaluation routes: 60 requests / hour / user and 100 requests / day / user.
  - General API traffic: 100 requests / 15 minutes / IP.
- **NFR-SEC-05 (Account Lockout):** 5 consecutive failed authentications trigger an automatic 15-minute lockout.
- **NFR-SEC-06 (Sandbox Isolation):** Execution of untrusted candidate code must occur in segregated child processes with memory restrictions, disallowing network access and system directory manipulation.

### 5.3 Reliability & Availability
- **NFR-REL-01 (Platform Uptime):** The platform shall maintain 99.9% service availability.
- **NFR-REL-02 (Graceful Degradation):** Unavailability of Google Gemini or Judge0 must not cause HTTP 500 errors for candidates; the platform must automatically degrade to Question Bank and local isolated child-process execution.
- **NFR-REL-03 (Data Durability):** Database migrations must be managed via Prisma with automated snapshot backups.

### 5.4 Compliance & Data Privacy
- **NFR-CMP-01 (GDPR Right to Erasure):** Upon candidate deletion request, all personal data is flagged for 30 days and permanently expunged via cascading delete job (`purgeDeletedAccounts`).
- **NFR-CMP-02 (Auditability):** All administrative modifications must maintain an immutable audit trail for a minimum of 365 days.

---

## 6. Requirements Traceability Matrix

| Requirement ID | Module | Implementation File / Component | Test Suite Reference |
| :--- | :--- | :--- | :--- |
| `FR-AUTH-01` | Auth | `services/auth/authService.ts` | `auth.test.ts` (Registration suite) |
| `FR-AUTH-02` | Auth | `services/auth/authService.ts` | `auth.test.ts` (OTP verification suite) |
| `FR-AUTH-03` | Auth | `services/auth/authService.ts` | `auth.test.ts` (Lockout suite) |
| `FR-AUTH-04` | Auth | `services/auth/authService.ts` | `auth.test.ts` (Token rotation suite) |
| `FR-INT-01` | Interview | `services/interview/interviewService.ts` | `interview.test.ts` (Session creation) |
| `FR-INT-02` | Interview | `services/llm/llmService.ts` | `interview.test.ts` (LLM & fallback) |
| `FR-INT-03` | Interview | `services/interview/interviewService.ts` | `interview.test.ts` (Answer evaluation) |
| `FR-INT-04` | Interview | `services/interview/interviewService.ts` | `interview.test.ts` (Difficulty adaptation) |
| `FR-CODE-01` | Coding | `services/coding/codingService.ts` | `coding.test.ts` (Catalog & topics) |
| `FR-CODE-02` | Coding | `services/coding/codingService.ts` | `coding.test.ts` (Hidden cases privacy) |
| `FR-CODE-03` | Coding | `services/coding/codeRunnerService.ts` | `coding.test.ts` (Run code / custom stdin) |
| `FR-CODE-04` | Coding | `services/coding/codingService.ts` | `coding.test.ts` (Submit solution & verdicts) |
| `FR-DASH-01` | Dashboard | `services/dashboard/dashboardService.ts` | `dashboard.test.ts` (Summary metrics) |
| `FR-REPORT-01`| Reports | `services/report/pdfReportService.ts` | `dashboard.test.ts` (Report generation) |
| `FR-ADM-01` | Admin | `services/admin/adminService.ts` | `admin.test.ts` (KPI stats) |
| `FR-ADM-02` | Admin | `services/admin/adminService.ts` | `admin.test.ts` (Question CRUD & dedupe) |
| `FR-ADM-03` | Admin | `services/admin/adminService.ts` | `admin.test.ts` (Bulk CSV upload) |
| `FR-ADM-04` | Admin | `services/admin/adminService.ts` | `admin.test.ts` (User moderation) |
| `FR-SYS-01` | System | `routes/health.ts` | `health.test.ts` (Postgres & Redis health) |

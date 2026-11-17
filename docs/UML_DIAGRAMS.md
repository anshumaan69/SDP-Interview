# Complete UML & Architectural Diagrams Suite
## AI-Assisted Interview Preparation & Coding Practice Platform
**Document Identifier:** `SDP-UML-2026-V2`  
**System Version:** 2.0.0  
**Specification:** Unified Modeling Language (UML 2.5) & C4 Model  

---

## 1. System Use Case Diagram

The use case diagram illustrates the interactions between primary human actors (**Candidate**, **Administrator**, **Guest User**) and external systems (**Google Gemini AI**, **Judge0 Engine**, **SMTP Gateway**).

```mermaid
flowchart LR
    subgraph Actors
        Guest["Guest User"]
        Candidate["Candidate User"]
        Admin["Administrator"]
        Gemini["Google Gemini AI"]
        Judge0["Judge0 Sandbox"]
        SMTP["SMTP Gateway"]
    end

    subgraph AuthUseCases["Authentication & Profile"]
        UC_Reg(["Register Account"])
        UC_OTP(["Verify 6-Digit OTP"])
        UC_Login(["Login (JWT & Sliding Cookie)"])
        UC_Reset(["Reset Password"])
        UC_Prof(["Manage Profile & Skills"])
        UC_Del(["Delete Account (GDPR)"])
    end

    subgraph InterviewUseCases["Adaptive Mock Interviews"]
        UC_StartInt(["Start Interview Session"])
        UC_SubAns(["Submit Answer"])
        UC_SkipQ(["Skip Active Question"])
        UC_PauseInt(["Pause / Resume Session"])
        UC_EndInt(["End Session Early"])
        UC_ViewRes(["View Detailed Session Breakdown"])
    end

    subgraph CodingUseCases["Coding Sandbox"]
        UC_BrowseProb(["Browse Problems by Topic"])
        UC_RunCode(["Run Code (Sample / Custom Stdin)"])
        UC_SubCode(["Submit Solution (All Test Cases)"])
    end

    subgraph AnalyticsUseCases["Analytics & Reports"]
        UC_Dash(["Inspect Dashboard KPIs & Trends"])
        UC_Hist(["Review Interview History"])
        UC_GenPDF(["Generate & Download PDF Report"])
    end

    subgraph AdminUseCases["Administration & Moderation"]
        UC_Stats(["Inspect Platform Stats"])
        UC_QCRUD(["Question Bank CRUD & Dedupe"])
        UC_CSV(["Bulk CSV Question Import"])
        UC_ModUser(["Block / Unblock Candidate"])
        UC_Audit(["Inspect Security Audit Logs"])
    end

    %% Guest associations
    Guest --> UC_Reg
    Guest --> UC_OTP
    Guest --> UC_Login
    Guest --> UC_Reset

    %% Candidate associations
    Candidate --> UC_Login
    Candidate --> UC_Prof
    Candidate --> UC_Del
    Candidate --> UC_StartInt
    Candidate --> UC_SubAns
    Candidate --> UC_SkipQ
    Candidate --> UC_PauseInt
    Candidate --> UC_EndInt
    Candidate --> UC_ViewRes
    Candidate --> UC_BrowseProb
    Candidate --> UC_RunCode
    Candidate --> UC_SubCode
    Candidate --> UC_Dash
    Candidate --> UC_Hist
    Candidate --> UC_GenPDF

    %% Admin associations
    Admin --> UC_Login
    Admin --> UC_Stats
    Admin --> UC_QCRUD
    Admin --> UC_CSV
    Admin --> UC_ModUser
    Admin --> UC_Audit

    %% External System interactions
    UC_Reg -.->|Dispatches OTP| SMTP
    UC_StartInt -.->|Generates Q1| Gemini
    UC_SubAns -.->|Evaluates Rubric| Gemini
    UC_RunCode -.->|Executes Code| Judge0
    UC_SubCode -.->|Executes Test Cases| Judge0
```

---

## 2. System Context & Container Diagram (C4 Model)

```mermaid
flowchart TB
    subgraph Clients["Presentation Tier"]
        Browser["Candidate / Admin Browser<br/>(HTTPS)"]
    end

    subgraph AppServer["Application Tier (Node.js & Express)"]
        NextWeb["Web Client App (apps/web)<br/>Next.js 14 App Router<br/>Port 3000"]
        API["Backend API Gateway (apps/api)<br/>Express.js / TypeScript<br/>Port 4001"]
    end

    subgraph DataTier["Data & Cache Tier"]
        Postgres[("PostgreSQL 16 DB<br/>Port 5435<br/>Relational Store")]
        RedisStore[("Redis 7 Store<br/>Port 6385<br/>OTP / Rate Limits / Lockout")]
    end

    subgraph SandboxTier["Execution Tier"]
        Judge0Svc["Judge0 Sandbox API<br/>Port 2358"]
        ChildProcess["Local Isolated Runner<br/>(child_process.spawn)"]
    end

    subgraph ExternalTier["External Cloud Services"]
        GeminiCloud["Google Gemini 1.5 Flash<br/>Generative REST API"]
        MailServer["SMTP Email Server"]
    end

    Browser -->|HTTPS / WSS| NextWeb
    NextWeb -->|REST API v1| API
    API -->|Prisma ORM (Connection Pool)| Postgres
    API -->|ioredis (TCP)| RedisStore
    API -->|Batch Submissions| Judge0Svc
    API -.->|Offline Fallback Execution| ChildProcess
    API -->|Structured Prompting| GeminiCloud
    API -->|SMTP Protocol| MailServer
```

---

## 3. Domain Model & Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ RefreshToken : has
    User ||--o{ PasswordReset : requests
    User ||--o{ Session : starts
    User ||--o{ CodingAttempt : submits
    User ||--o{ Report : generates
    User ||--o{ AuditLog : triggers

    Session ||--o{ SessionQuestion : contains
    Session ||--o{ Answer : receives
    SessionQuestion ||--o| Answer : produces

    CodingProblem ||--o{ TestCase : defines
    CodingProblem ||--o{ CodingAttempt : attempted_in

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        UserStatus status
        string targetRole
        ExperienceLevel experienceLevel
        json skills
        boolean emailVerified
        datetime markedForDeletionAt
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        string id PK
        string userId FK
        string tokenHash
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    PasswordReset {
        string id PK
        string userId FK
        string tokenHash
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    Question {
        string id PK
        string text
        string normalizedText UK
        InterviewType type
        string role
        Difficulty difficulty
        string idealAnswer
        boolean isSeeded
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string id PK
        string userId FK
        string role
        InterviewType type
        Difficulty difficulty
        Difficulty currentDifficulty
        int questionCount
        int currentIndex
        SessionStatus status
        int timerSeconds
        InterviewMode mode
        ResultStatus resultStatus
        float overallScore
        json criteriaScores
        json strengths
        json weakAreas
        json suggestions
        datetime createdAt
        datetime updatedAt
    }

    SessionQuestion {
        string id PK
        string sessionId FK
        string questionId
        string questionText
        InterviewType type
        Difficulty difficulty
        int index
        datetime createdAt
    }

    Answer {
        string id PK
        string sessionId FK
        string sessionQuestionId FK
        string answerText
        int timeTakenSeconds
        boolean skipped
        EvalStatus evalStatus
        float relevance
        float correctness
        float clarity
        float completeness
        float overall
        string feedback
        string sampleAnswer
        string idempotencyKey UK
        datetime createdAt
        datetime updatedAt
    }

    CodingProblem {
        string id PK
        string title
        string slug UK
        string topic
        Difficulty difficulty
        string statement
        string constraints
        json sampleCases
        json starterCode
        datetime createdAt
        datetime updatedAt
    }

    TestCase {
        string id PK
        string problemId FK
        string input
        string expectedOutput
        boolean isHidden
        int orderIndex
        datetime createdAt
    }

    CodingAttempt {
        string id PK
        string userId FK
        string problemId FK
        string language
        string code
        string status
        int passedCount
        int totalCount
        string compileError
        json results
        string idempotencyKey UK
        datetime createdAt
    }

    Report {
        string id PK
        string userId FK
        ReportStatus status
        datetime fromDate
        datetime toDate
        string filePath
        string downloadUrl
        datetime expiresAt
        datetime createdAt
    }

    AuditLog {
        string id PK
        string userId FK
        string event
        string ip
        json details
        datetime createdAt
    }
```

---

## 4. Detailed Component & Class Diagram

```mermaid
classDiagram
    direction TB

    class AuthService {
        +register(RegisterInput)
        +sendVerificationOtp(email)
        +verifyOtp(VerifyOtpInput)
        +resendOtp(email)
        +login(LoginInput, ip)
        +refreshToken(token)
        +logout(token)
        +deleteAccount(userId, input)
    }

    class InterviewService {
        +createSession(userId, input)
        +getSession(userId, sessionId)
        +submitAnswer(userId, sessionId, input, idempotencyKey)
        +processAnswerEvaluation(sessionId, sqId, answerId)
        +getAnswerEvaluation(userId, sessionId, answerId)
        +skipQuestion(userId, sessionId, questionId)
        +pauseSession(userId, sessionId)
        +resumeSession(userId, sessionId)
        +endSession(userId, sessionId)
        +getSessionResult(userId, sessionId)
    }

    class LlmService {
        +generateQuestion(params)
        +pickFallbackQuestion(role, type, difficulty, excluded)
        +evaluateAnswer(params)
        +mockEvaluateAnswer(qText, aText, idealAnswer)
        +generateSessionSummary(params)
    }

    class CodingService {
        +getTopics()
        +getProblems(userId, params)
        +getRandomProblem(userId, topic, difficulty)
        +getProblemById(idOrSlug, userId)
        +runCode(userId, problemId, input)
        +submitCode(userId, problemId, input, idempotencyKey)
    }

    class CodeRunnerService {
        +runBatch(language, code, cases)
        -checkJudge0()
        -runOnJudge0(language, code, cases)
        -runInIsolatedSandbox(language, code, cases)
        -executeProcess(cmd, args, input, timeoutMs)
    }

    class DashboardService {
        +getSummary(userId, from, to)
        +getTrend(userId, from, to, granularity)
    }

    class PdfReportService {
        +queueReport(userId, from, to)
        +generatePdf(reportId)
        +getReportStream(reportId, userId)
    }

    class AdminService {
        +getStats()
        +getQuestions(params)
        +createQuestion(input, adminId, ip)
        +updateQuestion(id, input, adminId, ip)
        +deleteQuestion(id, adminId, ip)
        +bulkUploadQuestions(csvContent, adminId, ip)
        +updateUserStatus(userId, status, adminId, ip)
        +getAuditLogs(params)
    }

    InterviewService --> LlmService : invokes
    CodingService --> CodeRunnerService : delegates execution
    InterviewService --> PrismaClient : reads/writes
    AuthService --> RedisClient : manages OTP & lockouts
    AuthService --> PrismaClient : manages users
    AdminService --> PrismaClient : manages repository
    PdfReportService --> PrismaClient : compiles data
```

---

## 5. Sequence Diagram 1: Registration & OTP Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as Express API (/auth)
    participant AuthSvc as AuthService
    participant Redis as Redis Cache
    participant DB as PostgreSQL
    participant SMTP as Email Transport

    Candidate->>API: POST /api/v1/auth/register (name, email, password, targetRole, expLevel)
    API->>AuthSvc: register(input)
    AuthSvc->>DB: findUnique(email)
    DB-->>AuthSvc: null (Available)
    AuthSvc->>AuthSvc: Hash password (Bcrypt cost 12)
    AuthSvc->>DB: create User (emailVerified = false)
    DB-->>AuthSvc: user record (id)
    AuthSvc->>Redis: SET otp:email (hash, attempts: 0, EX: 600)
    AuthSvc->>Redis: SET otp_cooldown:email (EX: 60)
    AuthSvc->>SMTP: sendEmail(OTP: 123456)
    AuthSvc-->>API: { userId, email }
    API-->>Candidate: HTTP 201 Created

    Candidate->>API: POST /api/v1/auth/verify-otp (email, otp: "123456")
    API->>AuthSvc: verifyOtp(input)
    AuthSvc->>Redis: GET otp:email
    Redis-->>AuthSvc: { hash, attempts }
    AuthSvc->>AuthSvc: Validate OTP & compare hash
    AuthSvc->>Redis: DEL otp:email
    AuthSvc->>DB: update User (emailVerified = true)
    DB-->>AuthSvc: updated
    AuthSvc-->>API: { verified: true }
    API-->>Candidate: HTTP 200 OK (Account Activated)
```

---

## 6. Sequence Diagram 2: Candidate Login & Sliding Refresh Token Rotation

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as Express API (/auth)
    participant AuthSvc as AuthService
    participant Redis as Redis Cache
    participant DB as PostgreSQL

    Candidate->>API: POST /api/v1/auth/login (email, password)
    API->>AuthSvc: login(input, ip)
    AuthSvc->>Redis: GET lockout:email
    Redis-->>AuthSvc: null (Not locked)
    AuthSvc->>DB: findUnique(email)
    DB-->>AuthSvc: user record (passwordHash, status, emailVerified)
    AuthSvc->>AuthSvc: Bcrypt.compare(password, hash) -> Match
    AuthSvc->>Redis: DEL failed_login:email
    AuthSvc->>AuthSvc: Sign JWT Access Token (15 min expiry)
    AuthSvc->>AuthSvc: Generate 40-byte crypto Refresh Token
    AuthSvc->>DB: create RefreshToken (SHA-256 hash, expiresAt: +30m)
    AuthSvc->>DB: create AuditLog (LOGIN_SUCCESS)
    AuthSvc-->>API: { user, accessToken, refreshTokenPlain }
    API-->>Candidate: HTTP 200 OK + Set-Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict)

    Note over Candidate, API: 14 Minutes Later (Access Token Near Expiry)

    Candidate->>API: POST /api/v1/auth/refresh (Cookie: refreshToken)
    API->>AuthSvc: refreshToken(cookiePlainToken)
    AuthSvc->>AuthSvc: Hash cookiePlainToken (SHA-256)
    AuthSvc->>DB: findFirst(tokenHash, revokedAt: null, expiresAt > NOW)
    DB-->>AuthSvc: valid token record
    AuthSvc->>DB: update old RefreshToken (revokedAt = NOW)
    AuthSvc->>AuthSvc: Generate new 40-byte Refresh Token
    AuthSvc->>DB: create new RefreshToken (+30m sliding expiry)
    AuthSvc->>AuthSvc: Sign new JWT Access Token (15m)
    AuthSvc-->>API: { accessToken, refreshTokenPlain }
    API-->>Candidate: HTTP 200 OK + Set-Cookie: new refreshToken
```

---

## 7. Sequence Diagram 3: Adaptive Interview Session Lifecycle & Evaluation

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as Express API (/sessions)
    participant IntSvc as InterviewService
    participant LLMSvc as LlmService
    participant Gemini as Google Gemini 1.5
    participant DB as PostgreSQL

    Candidate->>API: POST /api/v1/sessions (role, type: TECHNICAL, difficulty: EASY, count: 5)
    API->>IntSvc: createSession(userId, input)
    IntSvc->>DB: create Session (status: IN_PROGRESS, currentDifficulty: EASY)
    IntSvc->>LLMSvc: generateQuestion(role, TECHNICAL, EASY, excluded)
    alt Gemini Online
        LLMSvc->>Gemini: POST /models/gemini-1.5-flash:generateContent
        Gemini-->>LLMSvc: JSON { text, idealAnswer }
    else Gemini Offline / Timeout
        LLMSvc->>DB: Query Question Bank (TECHNICAL, EASY, unasked)
        DB-->>LLMSvc: seeded Question
    end
    IntSvc->>DB: create SessionQuestion (index: 0, text)
    IntSvc-->>API: { sessionId, question: { index: 1, text }, total: 5 }
    API-->>Candidate: HTTP 201 Created

    Candidate->>API: POST /api/v1/sessions/:id/answers (questionId, answerText) [Idempotency-Key]
    API->>IntSvc: submitAnswer(userId, sessionId, input, key)
    IntSvc->>DB: create Answer (evalStatus: PENDING, idempotencyKey)
    IntSvc-->>API: HTTP 202 Accepted { answerId, evalStatus: PENDING }
    API-->>Candidate: HTTP 202 Accepted (Enqueued)

    par Background Evaluation Worker
        IntSvc->>LLMSvc: evaluateAnswer(qText, aText, role, EASY)
        alt Gemini Online
            LLMSvc->>Gemini: POST evaluateAnswer prompt
            Gemini-->>LLMSvc: { relevance: 8.5, correctness: 9.0, clarity: 8.0, completeness: 8.5 }
        else Gemini Offline
            LLMSvc->>LLMSvc: mockEvaluateAnswer(wordCount, syntax)
        end
        IntSvc->>DB: update Answer (evalStatus: DONE, overall: 8.5, feedback, sampleAnswer)
        IntSvc->>IntSvc: computeNextDifficulty(current: EASY, lastTwo: [8.5])
        IntSvc->>LLMSvc: pre-generate Question 2 (difficulty: EASY)
        IntSvc->>DB: create SessionQuestion (index: 1, text: Q2)
    end

    Candidate->>API: GET /api/v1/sessions/:id/answers/:answerId
    API->>IntSvc: getAnswerEvaluation(userId, sessionId, answerId)
    IntSvc->>DB: findUnique Answer
    DB-->>IntSvc: Answer (evalStatus: DONE, overall: 8.5, feedback, nextQ)
    IntSvc-->>API: { evalStatus: DONE, scores, feedback, sampleAnswer, nextQuestion }
    API-->>Candidate: HTTP 200 OK (Render feedback & display Question 2)
```

---

## 8. Sequence Diagram 4: Coding Sandbox Execution Pipeline (Judge0 vs Local Sandbox)

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as Express API (/coding)
    participant CodeSvc as CodingService
    participant Runner as CodeRunnerService
    participant Judge0 as Judge0 Engine
    participant LocalBox as Isolated Child-Process
    participant DB as PostgreSQL

    Candidate->>API: POST /api/v1/coding/problems/:id/submit (language: "python", code) [Idempotency-Key]
    API->>CodeSvc: submitCode(userId, problemId, input, idempotencyKey)
    CodeSvc->>DB: findUnique Problem + include TestCases (sample + hidden)
    DB-->>CodeSvc: problem entity + all test cases
    CodeSvc->>DB: create CodingAttempt (status: "RUNNING", idempotencyKey)
    CodeSvc->>Runner: runBatch(python, code, testCases)

    alt Judge0 Engine Available
        Runner->>Judge0: POST /submissions/batch (submissions array)
        Judge0-->>Runner: [ { token: "tok_1" }, { token: "tok_2" } ]
        Runner->>Judge0: GET /submissions/batch?tokens=tok_1,tok_2
        Judge0-->>Runner: { submissions: [ { status_id: 3, time: 0.05 }, ... ] }
    else Judge0 Offline (Automatic Fallback)
        Runner->>LocalBox: mkdtemp(/tmp/sdp_code_XXXXXX)
        Runner->>LocalBox: Write solution.py
        loop For Each Test Case
            Runner->>LocalBox: spawn("python3", stdin, timeout: 5000ms)
            LocalBox-->>Runner: stdout (max 64KB), stderr, exitCode
            Runner->>Runner: Compare normalized stdout with expectedOutput
        end
        Runner->>LocalBox: rm -rf(/tmp/sdp_code_XXXXXX)
    end

    Runner-->>CodeSvc: { passedCount: 5, total: 5, results: [ verdicts ] }
    CodeSvc->>DB: update CodingAttempt (status: "PASSED", passedCount: 5, total: 5, results)
    CodeSvc-->>API: CodingAttempt entity
    API-->>Candidate: HTTP 200 OK { status: "PASSED", passed: 5, total: 5, results }
```

---

## 9. Sequence Diagram 5: PDF Readiness Report Generation & Download

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant API as Express API (/reports)
    participant RepSvc as PdfReportService
    participant DB as PostgreSQL
    participant Disk as Local File Storage

    Candidate->>API: POST /api/v1/reports (from, to)
    API->>RepSvc: queueReport(userId, from, to)
    RepSvc->>DB: count Sessions (userId, from/to)
    DB-->>RepSvc: 12 sessions found
    RepSvc->>DB: create Report (status: QUEUED, expiresAt: +24h)
    RepSvc-->>API: { reportId, status: QUEUED }
    API-->>Candidate: HTTP 202 Accepted { reportId }

    par Asynchronous PDF Generation
        RepSvc->>RepSvc: generatePdf(reportId)
        RepSvc->>DB: findMany Sessions + SessionQuestions + Answers
        DB-->>RepSvc: complete candidate interview history
        RepSvc->>Disk: Initialize PDFDocument (pdfkit) -> reports/generated/report_<id>.pdf
        RepSvc->>Disk: Write Header, Executive Summary, Score Averages, Strengths, Session Archives
        RepSvc->>Disk: doc.end() -> File Written
        RepSvc->>DB: update Report (status: READY, filePath, downloadUrl)
    end

    Candidate->>API: GET /api/v1/reports/:id/download
    API->>RepSvc: getReportStream(reportId, userId)
    RepSvc->>DB: findUnique Report (verify userId and expiresAt > NOW)
    DB-->>RepSvc: verified report
    RepSvc->>Disk: fs.createReadStream(filePath)
    RepSvc-->>API: readStream
    API-->>Candidate: HTTP 200 OK (Content-Type: application/pdf, Content-Disposition: attachment)
```

---

## 10. Sequence Diagram 6: Admin Bulk CSV Question Ingestion Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator Browser
    participant API as Express API (/admin)
    participant AdmSvc as AdminService
    participant DB as PostgreSQL

    Admin->>API: POST /api/v1/admin/questions/bulk (multipart CSV data)
    API->>AdmSvc: bulkUploadQuestions(csvContent, adminId, ip)
    AdmSvc->>AdmSvc: Split rows, validate headers (text, type, role, difficulty)
    loop For Each CSV Line (Row 1 to N)
        AdmSvc->>AdmSvc: Parse line (handle quoted delimiters)
        alt Syntax / Schema Error
            AdmSvc->>AdmSvc: Record failure { row: i, reason: "Invalid type" }
        else Valid Row
            AdmSvc->>AdmSvc: normalizeQuestionText(text)
            AdmSvc->>DB: findFirst(normalizedText)
            alt Duplicate Found
                AdmSvc->>AdmSvc: Record failure { row: i, reason: "Duplicate question" }
            else Unique
                AdmSvc->>DB: create Question
                AdmSvc->>AdmSvc: insertedCount++
            end
        end
    end
    AdmSvc->>DB: create AuditLog (ADMIN_BULK_UPLOAD_QUESTIONS, details: { inserted, failed })
    AdmSvc-->>API: { inserted: 45, failedCount: 2, failed: [ ... ] }
    API-->>Admin: HTTP 200 OK { data: { inserted: 45, failed: [ { row: 12, reason: "..." } ] } }
```

---

## 11. State Machine Diagram: Interview Session State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS : Candidate initiates session (POST /sessions)
    IN_PROGRESS --> PAUSED : Candidate pauses session (POST /pause)
    PAUSED --> IN_PROGRESS : Candidate resumes session (POST /resume)

    IN_PROGRESS --> ENDED_EARLY : Candidate quits session prematurely (POST /end)
    IN_PROGRESS --> COMPLETED : All questions answered / skipped (POST /end)

    ENDED_EARLY --> [*] : Session Archived & Scored
    COMPLETED --> [*] : Results Compiled & Summary Generated
```

---

## 12. State Machine Diagram: User Account Status & GDPR Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE_UNVERIFIED : Candidate registers (POST /auth/register)
    ACTIVE_UNVERIFIED --> ACTIVE_VERIFIED : 6-digit OTP verified (POST /auth/verify-otp)
    ACTIVE_UNVERIFIED --> [*] : 3 Failed OTP attempts / Expired

    ACTIVE_VERIFIED --> BLOCKED : Administrator blocks account (PATCH /admin/users/:id/status)
    BLOCKED --> ACTIVE_VERIFIED : Administrator unblocks account

    ACTIVE_VERIFIED --> MARKED_FOR_DELETION : Candidate requests account deletion (DELETE /me)
    MARKED_FOR_DELETION --> ACTIVE_VERIFIED : Candidate logs in within 30 days (Auto-reactivated)
    MARKED_FOR_DELETION --> PURGED : 30 days elapsed -> purgeDeletedAccountsJob runs
    PURGED --> [*] : Cascading permanent purge of all user records
```

---

## 13. State Machine Diagram: Coding Attempt Verdict State Machine

```mermaid
stateDiagram-v2
    [*] --> QUEUED : Code submitted by candidate
    QUEUED --> RUNNING : Picked up by Judge0 or local runner

    RUNNING --> COMPILE_ERROR : javac / g++ compilation exited non-zero
    RUNNING --> TLE : Process runtime exceeded 5000ms
    RUNNING --> RUNTIME_ERROR : Unhandled exception / Segfault (exit != 0)
    RUNNING --> WRONG_ANSWER : stdout differs from expectedOutput
    RUNNING --> PASSED : All test cases stdout matched expectedOutput

    COMPILE_ERROR --> [*]
    TLE --> [*]
    RUNTIME_ERROR --> [*]
    WRONG_ANSWER --> [*]
    PASSED --> [*] : Problem marked as Solved for user
```

---

## 14. Activity Diagram: Candidate Adaptive Mock Interview Execution

```mermaid
flowchart TD
    Start([Candidate Enters Interview]) --> Config[Select Role, Type, Difficulty & Question Count]
    Config --> SubmitConfig[Submit Session Configuration]
    SubmitConfig --> InitQ1[System Generates Question 1 via Gemini / Bank]
    InitQ1 --> DisplayQ[Display Question & Start Optional Timer]

    DisplayQ --> Choice{Candidate Action?}
    Choice -->|Skip Question| SkipAction[Record Skip with Score 0.0]
    Choice -->|Submit Text Answer| AnsAction[Submit Answer Payload with Idempotency Key]

    SkipAction --> CheckEnd{Is Current Index >= Question Count?}
    AnsAction --> EnqueueEval[System Returns HTTP 202 Accepted]
    EnqueueEval --> AsyncEval[Async Worker Evaluates 4 Rubric Criteria via LLM]
    AsyncEval --> AdaptDiff[Compute Next Difficulty from Last Two Scores]
    AdaptDiff --> PreGen[Pre-Generate Next Question in Background]
    PreGen --> PollResult[Candidate Polls and Receives Feedback & Next Question]
    PollResult --> CheckEnd

    CheckEnd -->|No| NextQ[Advance Current Index & Display Next Question]
    NextQ --> DisplayQ

    CheckEnd -->|Yes| FinishSession[Transition Session to COMPLETED]
    FinishSession --> GenSummary[Compute Overall Average Score & Strengths/Suggestions]
    GenSummary --> ViewResults([Candidate Reviews Complete Results Breakdown])
```

---

## 15. Activity Diagram: Sandboxed Code Execution & Security Pipeline

```mermaid
flowchart TD
    Start([Candidate Submits Code]) --> LangCheck{Supported Language?}
    LangCheck -->|No| RejectLang[Reject with HTTP 400 Validation Error]
    LangCheck -->|Yes: Python / Java / C++| BufferCheck{Code Size <= 64KB?}
    BufferCheck -->|No| RejectBuffer[Reject with HTTP 400 Payload Too Large]
    BufferCheck -->|Yes| Judge0Check{Is Judge0 Service Healthy?}

    Judge0Check -->|Yes| ExecJudge0[Dispatch Batch Submissions to Judge0 API]
    Judge0Check -->|No| LocalSandbox[Initialize Local Isolated Directory: /tmp/sdp_code_XXXX]

    LocalSandbox --> CompileStep{Requires Compilation? C++ / Java}
    CompileStep -->|Yes: C++ / Java| CompileCode[Run g++ -O2 or javac with 5s Timeout]
    CompileStep -->|No: Python| RunScript[Direct Interpreter Invocation: python3]

    CompileCode --> CompileSuccess{Exit Code == 0?}
    CompileSuccess -->|No| SetCompileError[Set Verdict: COMPILE_ERROR & Extract Stderr]
    CompileSuccess -->|Yes| RunBinary[Execute Compiled Binary with 5s Timeout]

    RunBinary --> RunLoop[Pipe Stdin for Test Case & Capture Stdout/Stderr]
    RunScript --> RunLoop
    ExecJudge0 --> CollectResults[Map Judge0 Status Codes to System Verdicts]

    RunLoop --> TimeoutCheck{Did Process Exceed 5000ms?}
    TimeoutCheck -->|Yes| SetTLE[Set Verdict: TLE & Kill Process SIGKILL]
    TimeoutCheck -->|No| ExitCheck{Exit Code == 0?}
    ExitCheck -->|No| SetRuntimeError[Set Verdict: RUNTIME_ERROR & Truncate Stderr to 64KB]
    ExitCheck -->|Yes| CompareOutput{Stdout Matched Expected Output?}

    CompareOutput -->|Yes| SetPassed[Set Verdict: PASSED]
    CompareOutput -->|No| SetWA[Set Verdict: WRONG_ANSWER]

    SetCompileError --> Finalize[Clean up Temp Directory & Save CodingAttempt Record]
    SetTLE --> Finalize
    SetRuntimeError --> Finalize
    SetPassed --> Finalize
    SetWA --> Finalize
    CollectResults --> Finalize

    Finalize --> ReturnResult([Return Filtered Results to Candidate - Hidden Cases Omitted])
```

---

## 16. Deployment Diagram: Container Topology & Infrastructure

```mermaid
deploymentDiagram
    node "Production Host / VM (Ubuntu Linux 22.04 LTS)" {
        node "Docker Engine" {
            node "Container: sdp_web" {
                artifact "Next.js 14 App Router" as WebApp
                note right of WebApp: Port 3000 (Internal / Reverse Proxy)
            }

            node "Container: sdp_api" {
                artifact "Node.js Express REST API" as ApiApp
                artifact "PDFKit Stream Engine" as PDFEngine
                artifact "Isolated Runner (child_process)" as LocalRunner
                note right of ApiApp: Port 4001 (Internal / Reverse Proxy)
            }

            node "Container: sdp_postgres" {
                database "PostgreSQL 16 Server" as PGServer
                note right of PGServer: Port 5435 (Host) -> 5432 (Internal)
            }

            node "Container: sdp_redis" {
                database "Redis 7 Server" as RedisSvc
                note right of RedisSvc: Port 6385 (Host) -> 6379 (Internal)
            }

            node "Docker Volumes" {
                storage "sdp_postgres_data" as PGVolume
                storage "sdp_redis_data" as RedisVolume
                storage "reports/generated" as ReportsVolume
            }
        }
    }

    cloud "Third-Party Cloud Services" {
        node "Google Cloud" {
            artifact "Gemini 1.5 Flash API" as GeminiSvc
        }
        node "Judge0 Host / Cluster" {
            artifact "Judge0 Batch API" as Judge0Cluster
        }
        node "Email Relay" {
            artifact "SMTP Mail Relay" as SmtpSvc
        }
    }

    WebApp -->|HTTP / API Requests| ApiApp
    ApiApp -->|TCP: 5432| PGServer
    ApiApp -->|TCP: 6379| RedisSvc
    ApiApp -->|HTTPS REST| GeminiSvc
    ApiApp -->|HTTP REST| Judge0Cluster
    ApiApp -->|SMTP: 587| SmtpSvc

    PGServer --> PGVolume : mounts
    RedisSvc --> RedisVolume : mounts
    ApiApp --> ReportsVolume : stores generated PDFs
```

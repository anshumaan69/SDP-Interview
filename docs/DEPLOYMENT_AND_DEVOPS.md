# Deployment, DevOps & Operations Runbook
## AI-Assisted Interview Preparation & Coding Practice Platform
**Document Identifier:** `SDP-OPS-2026-V2`  
**System Version:** 2.0.0  
**Target Environments:** Local Development, Docker Compose, Production Linux  

---

## 1. Environment Configuration Matrix

The platform is configured via environment variables defined in `.env` and validated at startup by `apps/api/src/config/env.ts`.

| Variable Name | Default Value | Required in Prod | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | Yes | Runtime mode (`development`, `test`, `production`) |
| `PORT` | `4001` | No | HTTP listening port for Express API |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5435/sdp_interview?schema=public` | Yes | PostgreSQL connection string with credentials and pool flags |
| `REDIS_URL` | `redis://localhost:6385` | Yes | Redis connection URI |
| `JWT_ACCESS_SECRET`| `dev_sdp_access_secret_key_1234567890` | **Yes (32+ chars)**| Secret key used to sign short-lived JWT access tokens |
| `JWT_REFRESH_SECRET`| `dev_sdp_refresh_secret_key_1234567890` | **Yes (32+ chars)**| Secret key used to hash refresh tokens |
| `CORS_ORIGIN` | `http://localhost:3000` | Yes | Allowed frontend origin for CORS headers |
| `LLM_PROVIDER` | `mock` | Yes (`gemini`) | LLM provider (`gemini` or `mock` for deterministic testing) |
| `GEMINI_API_KEY` | `""` | Yes | Google Generative AI API key for Gemini 1.5 Flash |
| `JUDGE0_URL` | `http://localhost:2358` | No | Endpoint of Judge0 code execution service |
| `SMTP_HOST` | `smtp.ethereal.email` | Yes | SMTP server hostname for OTP email delivery |
| `SMTP_PORT` | `587` | Yes | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | `""` | Yes | SMTP authentication username |
| `SMTP_PASS` | `""` | Yes | SMTP authentication password |
| `EMAIL_FROM` | `noreply@ai-interview-prep.com` | Yes | Outgoing email sender address |

---

## 2. Infrastructure & Docker Compose Architecture

The platform relies on `docker-compose.yml` to orchestrate isolated persistence services.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: sdp_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-sdp_interview}
    ports:
      - "${POSTGRES_PORT:-5435}:5432"
    volumes:
      - sdp_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-sdp_interview}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sdp_redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6385}:6379"
    volumes:
      - sdp_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  sdp_postgres_data:
  sdp_redis_data:
```

> **Collision Prevention:** PostgreSQL is mapped to host port `5435` (container `5432`) and Redis to host port `6385` (container `6379`) to avoid collisions with pre-existing local daemons.

---

## 3. Monorepo Operations & Build Commands

All operations are executed from the repository root using `pnpm`:

```bash
# 1. Install all dependencies across monorepo
pnpm install

# 2. Start PostgreSQL and Redis containers
docker compose up -d

# 3. Synchronize database schema and run seeders
pnpm --filter "@sdp/api" db:push
pnpm --filter "@sdp/api" db:seed

# 4. Run typecheck across all workspaces (web, api, shared)
pnpm typecheck

# 5. Execute all integration and unit test suites
pnpm test

# 6. Build production bundles
pnpm build

# 7. Start both frontend and backend concurrently in development mode
pnpm dev
```

---

## 4. Continuous Integration (CI) Workflow

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every `push` and `pull_request` targeting `main`.

```mermaid
flowchart LR
    Trigger([Push / PR to main]) --> Checkout[Checkout Repo]
    Checkout --> SetupEnv[Setup Node.js 22 & pnpm 12]
    SetupEnv --> Services[Start Postgres 16 & Redis 7 Service Containers]
    Services --> Install[pnpm install]
    Install --> GenPrisma[pnpm db:generate]
    GenPrisma --> Typecheck[pnpm typecheck]
    Typecheck --> RunTests[pnpm test (55+ Jest Tests)]
    RunTests --> Build[pnpm build (Next.js & tsc)]
    Build --> Complete([CI Success Badge Issued])
```

---

## 5. Background Maintenance Jobs

### 5.1 Account Purge Job (`apps/api/src/jobs/purgeAccountsJob.ts`)
- **Objective:** Enforce GDPR Compliance by permanently deleting user accounts that have been in soft-deletion state for more than 30 days.
- **Execution:** Invoked via Node cron or an external worker scheduler (e.g. systemd timer, Kubernetes CronJob):
  ```typescript
  import { purgeDeletedAccounts } from "./jobs/purgeAccountsJob";
  
  // Scheduled daily at midnight UTC
  await purgeDeletedAccounts();
  ```
- **Cascading Effects:** PostgreSQL cascading foreign keys automatically purge all linked refresh tokens, password resets, interview sessions, answers, coding attempts, and reports.

---

## 6. Observability, Health Checks & Logging

### 6.1 Structured JSON Logging
The backend uses **Pino** (`pino-http`) for high-throughput, structured JSON logging. Every log entry includes:
- `req.id`: Request correlation UUID.
- `req.method` & `req.url`: HTTP request metadata.
- `res.statusCode`: Output HTTP status.
- `responseTime`: Elapsed processing time in milliseconds.

### 6.2 Health Check Endpoint
- **URL:** `GET /api/v1/health`
- **Output:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-17T14:30:00.000Z",
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
  ```
- **Error Response (503 Service Unavailable):** Returned if either PostgreSQL or Redis fails to respond within 2000 ms.

---

## 7. Production Incident Runbooks

### Runbook 1: Clearing Candidate Account Lockout
- **Symptom:** Candidate reports inability to log in, receiving HTTP 423 Locked.
- **Root Cause:** 5 consecutive incorrect password submissions recorded in Redis key `lockout:<email>`.
- **Resolution:**
  ```bash
  # Connect to Redis CLI
  docker exec -it sdp_redis redis-cli

  # Verify lockout key exists
  GET lockout:candidate@sdp.com

  # Clear lockout key
  DEL lockout:candidate@sdp.com
  DEL failed_login:candidate@sdp.com
  ```

### Runbook 2: Judge0 Sandboxed Execution Downtime
- **Symptom:** Network connectivity failure between API gateway and Judge0 cluster.
- **Mitigation:** The system features automated fallback to the local isolated child-process runner (`codeRunnerService.ts`). Ensure local host environment has `python3`, `javac`/`java`, and `g++` installed.
- **Verification:** Run `POST /api/v1/coding/problems/:id/run` to confirm the local runner evaluates test cases without throwing HTTP 500.

### Runbook 3: Google Gemini API Quota Exhaustion
- **Symptom:** Gemini returns HTTP 429 Too Many Requests.
- **Mitigation:** The platform's two-tier fallback engine automatically captures the error, logs a warning, and picks an unasked question from the 230+ seeded Question Bank. Mock evaluation rubric calculates candidate scores offline based on substance, syntax, and word count. Candidates experience zero interruption.

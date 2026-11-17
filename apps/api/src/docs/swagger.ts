import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "AI Interview Preparation Platform API",
    version: "2.0.0",
    description:
      "Production-grade REST API for AI-assisted adaptive mock interviews, coding practice sandbox, aggregated analytics, and PDF reports.",
    contact: {
      name: "SDP Platform Team",
      email: "support@sdp-interview.com",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "API v1 Endpoint",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid request payload" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    issue: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Check service health",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "Service status (database and Redis)",
          },
        },
      },
    },
    "/meta/options": {
      get: {
        summary: "Retrieve predefined metadata options (roles, types, difficulties, topics)",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "Cached metadata options",
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Candidate registration with 6-digit email OTP verification",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "targetRole", "experienceLevel"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", example: "SecurePass123!" },
                  targetRole: { type: "string", example: "Software Engineer" },
                  experienceLevel: {
                    type: "string",
                    enum: ["FRESHER", "0_1_YEARS", "1_3_YEARS"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered; OTP dispatched" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        summary: "Verify email with 6-digit OTP",
        tags: ["Auth"],
        security: [],
        responses: {
          "200": { description: "Email verified successfully" },
          "400": { description: "Invalid or expired OTP" },
          "429": { description: "Maximum verification attempts exceeded" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Candidate/Admin authentication with lockout protection and sliding cookie refresh",
        tags: ["Auth"],
        security: [],
        responses: {
          "200": { description: "JWT Access token and user payload" },
          "401": { description: "Invalid credentials" },
          "423": { description: "Account temporarily locked" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Rotate sliding session refresh token",
        tags: ["Auth"],
        security: [],
        responses: {
          "200": { description: "New access token" },
          "401": { description: "Session expired or revoked" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Revoke session refresh token",
        tags: ["Auth"],
        security: [],
        responses: {
          "204": { description: "Logged out successfully" },
        },
      },
    },
    "/me": {
      get: {
        summary: "Fetch authenticated profile",
        tags: ["Profile"],
        responses: {
          "200": { description: "User profile data" },
        },
      },
      patch: {
        summary: "Update profile details (name, targetRole, experienceLevel, skills)",
        tags: ["Profile"],
        responses: {
          "200": { description: "Updated user profile" },
        },
      },
      delete: {
        summary: "Mark account for deletion (30-day purge grace period)",
        tags: ["Profile"],
        responses: {
          "202": { description: "Account marked for deletion" },
        },
      },
    },
    "/sessions": {
      post: {
        summary: "Create adaptive mock interview session and pre-generate first question",
        tags: ["Interview"],
        responses: {
          "201": { description: "Session created with first question" },
          "503": { description: "AI and question bank unavailable" },
        },
      },
      get: {
        summary: "List resumable in-progress or paused interview sessions",
        tags: ["Interview"],
        responses: {
          "200": { description: "List of resumable sessions" },
        },
      },
    },
    "/sessions/{id}": {
      get: {
        summary: "Get current interview session state and active question",
        tags: ["Interview"],
        responses: {
          "200": { description: "Active session and current question" },
        },
      },
    },
    "/sessions/{id}/answers": {
      post: {
        summary: "Submit text answer for evaluation with Idempotency-Key support",
        tags: ["Interview"],
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            schema: { type: "string" },
          },
        ],
        responses: {
          "202": { description: "Answer accepted; evaluation enqueued" },
        },
      },
    },
    "/sessions/{id}/skip": {
      post: {
        summary: "Skip active question (recorded with score 0, excluded from session mean)",
        tags: ["Interview"],
        responses: {
          "200": { description: "Question skipped and next question advanced" },
        },
      },
    },
    "/sessions/{id}/result": {
      get: {
        summary: "Get comprehensive summary report, rubric averages, strengths & weak areas",
        tags: ["Interview"],
        responses: {
          "200": { description: "Interview completion results and question breakdowns" },
        },
      },
    },
    "/dashboard/summary": {
      get: {
        summary: "Get aggregate metrics (completed interviews, overall average, practice days)",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Dashboard KPI summary" },
        },
      },
    },
    "/dashboard/trend": {
      get: {
        summary: "Get score progression trend grouped by day or week",
        tags: ["Dashboard"],
        responses: {
          "200": { description: "Time-series score points" },
        },
      },
    },
    "/reports": {
      get: {
        summary: "List candidate generated PDF reports",
        tags: ["Reports"],
        responses: {
          "200": { description: "Reports archive" },
        },
      },
      post: {
        summary: "Trigger PDF readiness report generation",
        tags: ["Reports"],
        responses: {
          "202": { description: "Report queued for generation" },
        },
      },
    },
    "/coding/topics": {
      get: {
        summary: "Get curated coding topics breakdown with difficulty counts",
        tags: ["Coding"],
        responses: {
          "200": { description: "Topics and difficulty distribution" },
        },
      },
    },
    "/coding/problems": {
      get: {
        summary: "List coding problems with solved status and attempt counts",
        tags: ["Coding"],
        responses: {
          "200": { description: "Paginated coding problems list" },
        },
      },
    },
    "/coding/problems/{id}": {
      get: {
        summary: "Get coding problem statement, constraints, visible test cases, and starter code",
        tags: ["Coding"],
        responses: {
          "200": { description: "Problem details (never leaks hidden cases)" },
        },
      },
    },
    "/coding/problems/{id}/run": {
      post: {
        summary: "Execute code against sample cases or custom stdin input in sandbox",
        tags: ["Coding"],
        responses: {
          "200": { description: "Execution stdout, stderr, and verdict" },
        },
      },
    },
    "/coding/problems/{id}/submit": {
      post: {
        summary: "Submit solution against all test cases (visible + hidden) with idempotency",
        tags: ["Coding"],
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Submission attempt verdict and test results" },
        },
      },
    },
  },
};

const router = Router();
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;

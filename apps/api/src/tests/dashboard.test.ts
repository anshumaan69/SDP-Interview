import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

describe("Phase 4: Dashboard, History & PDF Reports API", () => {
  let candidateToken: string;
  let candidateId: string;
  let reportId: string;
  let sessionId: string;

  beforeAll(async () => {
    const candidate = await prisma.user.findUnique({
      where: { email: "candidate@sdp.com" },
    });
    candidateId = candidate!.id;

    candidateToken = jwt.sign(
      { userId: candidateId, email: candidate!.email, role: Role.CANDIDATE, name: candidate!.name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    // Create a completed session for the candidate to ensure data exists for charts & reports
    const session = await prisma.session.create({
      data: {
        userId: candidateId,
        role: "Software Engineer",
        type: "TECHNICAL",
        difficulty: "MEDIUM",
        currentDifficulty: "MEDIUM",
        questionCount: 5,
        status: "COMPLETED",
        resultStatus: "READY",
        overallScore: 8.5,
        criteriaScores: {
          relevance: 9.0,
          correctness: 8.5,
          clarity: 8.0,
          completeness: 8.5,
        },
        strengths: ["Clear communication"],
        weakAreas: ["Edge cases"],
        suggestions: ["Study concurrency"],
      },
    });

    sessionId = session.id;
  });

  describe("Dashboard Aggregates", () => {
    it("GET /dashboard/summary returns computed metrics", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSessions).toBeGreaterThanOrEqual(1);
      expect(res.body.data.completedSessions).toBeGreaterThanOrEqual(1);
      expect(res.body.data.averageScore).toBeGreaterThan(0);
      expect(res.body.data.bestScore).toBeGreaterThan(0);
    });

    it("GET /dashboard/trend returns time-series data", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/trend?granularity=day")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty("date");
      expect(res.body.data[0]).toHaveProperty("averageScore");
    });

    it("GET /dashboard/categories returns breakdowns by type and criterion", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/categories")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("byType");
      expect(res.body.data).toHaveProperty("byCriterion");
      expect(res.body.data.byCriterion).toHaveProperty("relevance");
    });
  });

  describe("History & Session Review", () => {
    it("GET /history returns past sessions list", async () => {
      const res = await request(app)
        .get("/api/v1/history?page=1&limit=10")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty("total");
    });

    it("GET /history/:sessionId returns detailed session report", async () => {
      const res = await request(app)
        .get(`/api/v1/history/${sessionId}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("overallScore");
      expect(res.body.data).toHaveProperty("criteriaAverages");
    });
  });

  describe("PDF Report Generation & Download", () => {
    it("POST /reports rejects request when period has no data", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          from: "2010-01-01",
          to: "2010-01-02",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0].issue).toBe("NO_DATA");
    });

    it("POST /reports queues a valid PDF generation job", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({});

      expect(res.status).toBe(202);
      expect(res.body.data).toHaveProperty("reportId");
      expect(res.body.data.status).toBe("QUEUED");
      reportId = res.body.data.reportId;
    });

    it("GET /reports/:id checks status and GET /reports/:id/download streams PDF", async () => {
      // Allow PDF generator to finish
      await new Promise((r) => setTimeout(r, 600));

      const statusRes = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(statusRes.status).toBe(200);

      const downloadRes = await request(app)
        .get(`/api/v1/reports/${reportId}/download`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.header["content-type"]).toBe("application/pdf");
    });
  });
});

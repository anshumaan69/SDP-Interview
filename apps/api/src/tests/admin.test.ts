import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

describe("Phase 2: Admin & Question Bank API", () => {
  let adminToken: string;
  let candidateToken: string;
  let adminId: string;
  let candidateId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findUnique({ where: { email: "admin@sdp.com" } });
    const candidate = await prisma.user.findUnique({ where: { email: "candidate@sdp.com" } });

    adminId = admin!.id;
    candidateId = candidate!.id;

    adminToken = jwt.sign(
      { userId: adminId, email: admin!.email, role: Role.ADMIN, name: admin!.name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    candidateToken = jwt.sign(
      { userId: candidateId, email: candidate!.email, role: Role.CANDIDATE, name: candidate!.name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );
  });

  describe("Role Enforcement", () => {
    it("returns 403 Forbidden when a Candidate accesses /admin routes", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 OK when an Admin accesses /admin/stats", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("totalUsers");
      expect(res.body.data).toHaveProperty("totalQuestions");
    });
  });

  describe("Question Bank CRUD & Deduplication", () => {
    let createdQuestionId: string;
    const uniqueText = `How do you handle distributed transactions in microservices without 2PC? ${Date.now()}`;

    it("creates a new question", async () => {
      const res = await request(app)
        .post("/api/v1/admin/questions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          text: uniqueText,
          type: "TECHNICAL",
          role: "Backend Engineer",
          difficulty: "HARD",
          idealAnswer: "Use the Saga pattern with compensating transactions and outbox event streaming.",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      createdQuestionId = res.body.data.id;
    });

    it("blocks duplicate question creation via normalized text", async () => {
      // Different casing and whitespace
      const duplicateText = `  ${uniqueText.toUpperCase()}   `;

      const res = await request(app)
        .post("/api/v1/admin/questions")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          text: duplicateText,
          type: "TECHNICAL",
          role: "Backend Engineer",
          difficulty: "HARD",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("DUPLICATE_QUESTION");
    });

    it("updates question details", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/questions/${createdQuestionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          difficulty: "MEDIUM",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.difficulty).toBe("MEDIUM");
    });

    it("deletes a question", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/questions/${createdQuestionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe("Bulk CSV Operations", () => {
    it("downloads CSV template", async () => {
      const res = await request(app)
        .get("/api/v1/admin/questions/bulk/template")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.header["content-type"]).toContain("text/csv");
      expect(res.text).toContain("text,type,role,difficulty,idealAnswer");
    });

    it("uploads bulk CSV with error reporting", async () => {
      const uniqueRow = `Custom Question Bulk ${Date.now()}`;
      const csvData = Buffer.from(
        `text,type,role,difficulty,idealAnswer\n"${uniqueRow}",TECHNICAL,"Software Engineer",EASY,"Sample Answer"\n"Short",INVALID_TYPE,"Software Engineer",HARD,"Bad Row"\n`
      );

      const res = await request(app)
        .post("/api/v1/admin/questions/bulk")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", csvData, "test.csv");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data.inserted).toBeGreaterThanOrEqual(1);
      expect(res.body.data.failed.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("User Management & Blocking", () => {
    it("lists users with pagination and search", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty("total");
    });

    it("blocks a user and prevents self-deletion", async () => {
      // Self-deletion check
      const selfDelRes = await request(app)
        .delete(`/api/v1/admin/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(selfDelRes.status).toBe(400);
      expect(selfDelRes.body.error.details[0].issue).toBe("CANNOT_DELETE_SELF");

      // Block candidate
      const blockRes = await request(app)
        .patch(`/api/v1/admin/users/${candidateId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "BLOCKED" });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.data.status).toBe("BLOCKED");

      // Unblock candidate to restore state
      await request(app)
        .patch(`/api/v1/admin/users/${candidateId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "ACTIVE" });
    });
  });

  describe("Audit Logs", () => {
    it("fetches audit logs without exposing passwords", async () => {
      const res = await request(app)
        .get("/api/v1/admin/audit-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const str = JSON.stringify(res.body.data);
      expect(str).not.toContain("password");
    });
  });
});

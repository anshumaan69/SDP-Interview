import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";
import { computeNextDifficulty } from "../services/interview/interviewService";
import { Difficulty } from "@sdp/shared";

describe("Phase 3: Mock Interview API (MVP)", () => {
  let candidateToken: string;
  let candidateId: string;
  let createdSessionId: string;
  let firstQuestionId: string;
  let answerId: string;

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
  });

  describe("Session Setup & Adaptive Difficulty Unit Logic", () => {
    it("correctly computes adaptive difficulty transitions", () => {
      // 2 high scores increase difficulty
      expect(computeNextDifficulty(Difficulty.EASY, [8.0, 7.5])).toBe(Difficulty.MEDIUM);
      expect(computeNextDifficulty(Difficulty.MEDIUM, [8.5, 9.0])).toBe(Difficulty.HARD);
      expect(computeNextDifficulty(Difficulty.HARD, [8.0, 8.0])).toBe(Difficulty.HARD);

      // 2 low scores decrease difficulty
      expect(computeNextDifficulty(Difficulty.HARD, [3.5, 4.0])).toBe(Difficulty.MEDIUM);
      expect(computeNextDifficulty(Difficulty.MEDIUM, [2.0, 4.0])).toBe(Difficulty.EASY);
      expect(computeNextDifficulty(Difficulty.EASY, [3.0, 1.0])).toBe(Difficulty.EASY);

      // Mixed scores maintain difficulty
      expect(computeNextDifficulty(Difficulty.MEDIUM, [8.0, 4.0])).toBe(Difficulty.MEDIUM);
      expect(computeNextDifficulty(Difficulty.MEDIUM, [6.5, 6.0])).toBe(Difficulty.MEDIUM);
    });

    it("rejects invalid question counts (< 5 or > 20)", async () => {
      const res = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          role: "Software Engineer",
          type: "TECHNICAL",
          difficulty: "MEDIUM",
          questionCount: 3,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("creates a new interview session and synchronously generates 1st question", async () => {
      const res = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          role: "Software Engineer",
          type: "TECHNICAL",
          difficulty: "MEDIUM",
          questionCount: 5,
          timerSeconds: 120,
          mode: "TEXT",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("sessionId");
      expect(res.body.data.status).toBe("IN_PROGRESS");
      expect(res.body.data.question).toBeDefined();
      expect(res.body.data.question.text.length).toBeGreaterThan(10);

      createdSessionId = res.body.data.sessionId;
      firstQuestionId = res.body.data.question.id;
    });
  });

  describe("Interview Room & Answer Processing", () => {
    it("GET /sessions/:id restores current state", async () => {
      const res = await request(app)
        .get(`/api/v1/sessions/${createdSessionId}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdSessionId);
      expect(res.body.data.question.id).toBe(firstQuestionId);
    });

    it("submits an answer with idempotency-key and triggers evaluation", async () => {
      const idempotencyKey = `idemp-${Date.now()}`;
      const res = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/answers`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          questionId: firstQuestionId,
          answerText: "In JavaScript, the event loop continuously monitors the call stack and message queues, processing microtasks like Promises before macrotasks.",
          timeTakenSeconds: 35,
        });

      expect(res.status).toBe(202);
      expect(res.body.data).toHaveProperty("answerId");
      expect(res.body.data.evalStatus).toBe("PENDING");
      answerId = res.body.data.answerId;

      // Idempotency check: repeated submit returns same answerId
      const dupeRes = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/answers`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          questionId: firstQuestionId,
          answerText: "Duplicate text",
          timeTakenSeconds: 35,
        });

      expect(dupeRes.status).toBe(202);
      expect(dupeRes.body.data.answerId).toBe(answerId);
    });

    it("polls answer evaluation until DONE", async () => {
      // In-process evaluator runs immediately; wait up to 3s if needed
      let done = false;
      let evalData: any;

      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get(`/api/v1/sessions/${createdSessionId}/answers/${answerId}`)
          .set("Authorization", `Bearer ${candidateToken}`);

        expect(res.status).toBe(200);
        if (res.body.data.evalStatus === "DONE") {
          done = true;
          evalData = res.body.data;
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      expect(done).toBe(true);
      expect(evalData.scores.overall).toBeGreaterThan(0);
      expect(evalData.scores).toHaveProperty("relevance");
      expect(evalData.scores).toHaveProperty("correctness");
      expect(evalData.scores).toHaveProperty("clarity");
      expect(evalData.scores).toHaveProperty("completeness");
      expect(evalData.feedback).toBeDefined();
    });

    it("pauses and resumes the session", async () => {
      const pauseRes = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/pause`)
        .set("Authorization", `Bearer ${candidateToken}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe("PAUSED");

      const resumeRes = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/resume`)
        .set("Authorization", `Bearer ${candidateToken}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.status).toBe("IN_PROGRESS");
    });

    it("skips a question scoring 0 and advances to next", async () => {
      const sessionState = await request(app)
        .get(`/api/v1/sessions/${createdSessionId}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      const nextQId = sessionState.body.data.question.id;

      const skipRes = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/skip`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({ questionId: nextQId });

      expect(skipRes.status).toBe(200);
    });
  });

  describe("Session Completion & Result Summary", () => {
    it("ends session and generates result summary", async () => {
      const endRes = await request(app)
        .post(`/api/v1/sessions/${createdSessionId}/end`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(endRes.status).toBe(200);

      const resultRes = await request(app)
        .get(`/api/v1/sessions/${createdSessionId}/result`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(resultRes.status).toBe(200);
      expect(resultRes.body.data).toHaveProperty("overallScore");
      expect(resultRes.body.data.criteriaAverages).toBeDefined();
      expect(resultRes.body.data.strengths.length).toBeGreaterThan(0);
      expect(resultRes.body.data.weakAreas.length).toBeGreaterThan(0);
      expect(resultRes.body.data.suggestions.length).toBeGreaterThan(0);
      expect(Array.isArray(resultRes.body.data.questions)).toBe(true);

      // Skipped question is listed with 0 score
      const skippedQ = resultRes.body.data.questions.find((q: any) => q.skipped === true);
      expect(skippedQ).toBeDefined();
    });
  });
});

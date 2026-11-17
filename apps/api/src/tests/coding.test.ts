import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

describe("Phase 5: Coding Practice API", () => {
  let candidateToken: string;
  let candidateId: string;
  let otherCandidateToken: string;
  let problemId: string;
  let problemSlug: string;
  let attemptId: string;

  beforeAll(async () => {
    const candidate = await prisma.user.findUnique({
      where: { email: "candidate@sdp.com" },
    });
    candidateId = candidate!.id;

    candidateToken = jwt.sign(
      {
        userId: candidateId,
        email: candidate!.email,
        role: Role.CANDIDATE,
        name: candidate!.name,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    // Create a second candidate for authorization tests
    const otherCandidate = await prisma.user.upsert({
      where: { email: "other_candidate@sdp.com" },
      update: {},
      create: {
        name: "Other Candidate",
        email: "other_candidate@sdp.com",
        passwordHash: "hash",
        role: Role.CANDIDATE,
        emailVerified: true,
      },
    });

    otherCandidateToken = jwt.sign(
      {
        userId: otherCandidate.id,
        email: otherCandidate.email,
        role: Role.CANDIDATE,
        name: otherCandidate.name,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "1h" }
    );

    // Pick a seeded problem
    const problem = await prisma.codingProblem.findFirst({
      where: { slug: "contains-duplicate" },
    });
    if (problem) {
      problemId = problem.id;
      problemSlug = problem.slug;
    } else {
      const anyProblem = await prisma.codingProblem.findFirst();
      problemId = anyProblem!.id;
      problemSlug = anyProblem!.slug;
    }
  });

  describe("Topics & Problem Listing", () => {
    it("GET /coding/topics returns topic breakdown with difficulty counts", async () => {
      const res = await request(app)
        .get("/api/v1/coding/topics")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const firstTopic = res.body.data[0];
      expect(firstTopic).toHaveProperty("topic");
      expect(firstTopic).toHaveProperty("total");
      expect(firstTopic).toHaveProperty("easy");
      expect(firstTopic).toHaveProperty("medium");
      expect(firstTopic).toHaveProperty("hard");
      expect(firstTopic.total).toBe(
        firstTopic.easy + firstTopic.medium + firstTopic.hard
      );
    });

    it("GET /coding/problems lists problems with solved status", async () => {
      const res = await request(app)
        .get("/api/v1/coding/problems?page=1&limit=10")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty("total");
      expect(res.body.meta).toHaveProperty("page", 1);
      expect(res.body.meta).toHaveProperty("limit", 10);

      const p = res.body.data[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("title");
      expect(p).toHaveProperty("slug");
      expect(p).toHaveProperty("difficulty");
      expect(p).toHaveProperty("isSolved");
      expect(p).toHaveProperty("attemptCount");
    });

    it("GET /coding/problems filters by topic and difficulty", async () => {
      const res = await request(app)
        .get("/api/v1/coding/problems?difficulty=EASY")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((item: any) => {
        expect(item.difficulty).toBe("EASY");
      });
    });

    it("GET /coding/problems/random returns a single problem", async () => {
      const res = await request(app)
        .get("/api/v1/coding/problems/random?difficulty=EASY")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("statement");
      expect(res.body.data).toHaveProperty("constraints");
      expect(res.body.data).toHaveProperty("starterCode");
      expect(res.body.data.difficulty).toBe("EASY");
    });

    it("GET /coding/problems/:id returns problem and NEVER leaks hidden test cases", async () => {
      const res = await request(app)
        .get(`/api/v1/coding/problems/${problemSlug}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(problemId);
      expect(res.body.data.slug).toBe(problemSlug);
      expect(res.body.data).toHaveProperty("sampleCases");
      expect(res.body.data).toHaveProperty("visibleTestCases");

      // Check that hidden test cases are not present in visibleTestCases
      const visible = res.body.data.visibleTestCases;
      expect(Array.isArray(visible)).toBe(true);
      visible.forEach((tc: any) => {
        expect(tc).not.toHaveProperty("isHidden");
      });
    });

    it("GET /coding/problems/:id returns 404 for unknown ID", async () => {
      const res = await request(app)
        .get("/api/v1/coding/problems/non-existent-problem-id")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Code Execution: Run & Submit", () => {
    it("POST /coding/problems/:id/run executes sample code against visible cases", async () => {
      const pythonCode = `import json, sys

def contains_duplicate(nums):
    return len(nums) != len(set(nums))

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        nums = json.loads(lines[0])
        print(str(contains_duplicate(nums)).lower())
`;

      const res = await request(app)
        .post(`/api/v1/coding/problems/${problemId}/run`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          language: "python",
          code: pythonCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("passedCount");
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data).toHaveProperty("results");
      expect(res.body.data.passedCount).toBeGreaterThanOrEqual(1);
    });

    it("POST /coding/problems/:id/run with custom input executes single case", async () => {
      const pythonCode = `import json, sys

lines = sys.stdin.read().splitlines()
if lines:
    nums = json.loads(lines[0])
    print(str(len(nums) != len(set(nums))).lower())
`;

      const res = await request(app)
        .post(`/api/v1/coding/problems/${problemId}/run`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          language: "python",
          code: pythonCode,
          customInput: "[1,2,3,4,5,1]",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.results.length).toBe(1);
      expect(res.body.data.results[0].actual).toBe("true");
    });

    it("POST /coding/problems/:id/submit executes all cases and records attempt", async () => {
      const pythonCode = `import json, sys

def contains_duplicate(nums):
    return len(nums) != len(set(nums))

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if lines:
        nums = json.loads(lines[0])
        print(str(contains_duplicate(nums)).lower())
`;

      const idempotencyKey = `sub-test-${Date.now()}`;
      const res = await request(app)
        .post(`/api/v1/coding/problems/${problemId}/submit`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          language: "python",
          code: pythonCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("status");
      expect(res.body.data.status).toBe("PASSED");
      expect(res.body.data.passedCount).toBe(res.body.data.totalCount);
      expect(res.body.data.totalCount).toBeGreaterThanOrEqual(2);

      attemptId = res.body.data.id;

      // Crucial: check that hidden test cases NEVER leak expected, actual, or stderr!
      const results = res.body.data.results;
      const hiddenResults = results.filter((r: any) => !r.visible);
      expect(hiddenResults.length).toBeGreaterThan(0);
      hiddenResults.forEach((hr: any) => {
        expect(hr).not.toHaveProperty("expected");
        expect(hr).not.toHaveProperty("actual");
        expect(hr).not.toHaveProperty("stderr");
        expect(hr).toHaveProperty("verdict");
        expect(hr).toHaveProperty("runtimeMs");
      });

      // Test Idempotency: submitting with same Idempotency-Key returns existing attempt
      const resIdempotent = await request(app)
        .post(`/api/v1/coding/problems/${problemId}/submit`)
        .set("Authorization", `Bearer ${candidateToken}`)
        .set("Idempotency-Key", idempotencyKey)
        .send({
          language: "python",
          code: pythonCode,
        });

      expect(resIdempotent.status).toBe(200);
      expect(resIdempotent.body.data.id).toBe(attemptId);
    });

    it("GET /coding/attempts/:id retrieves attempt and enforces access control", async () => {
      const res = await request(app)
        .get(`/api/v1/coding/attempts/${attemptId}`)
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(attemptId);
      expect(res.body.data.status).toBe("PASSED");

      // Verify other candidate cannot view this attempt
      const otherRes = await request(app)
        .get(`/api/v1/coding/attempts/${attemptId}`)
        .set("Authorization", `Bearer ${otherCandidateToken}`);

      expect(otherRes.status).toBe(404);
    });

    it("GET /coding/attempts lists user past attempts", async () => {
      const res = await request(app)
        .get("/api/v1/coding/attempts?page=1&limit=10")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty("problem");
    });
  });
});

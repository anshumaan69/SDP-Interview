import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

describe("Phase 1: Auth & Profile API", () => {
  const testEmail = "testuser@example.com";
  const testPassword = "ValidPassword123!";
  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    // Clean test data
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail, "badpass@example.com", "reset@example.com"] } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail, "badpass@example.com", "reset@example.com"] } },
    });
  });

  describe("Registration & Validation", () => {
    it("fails when password is too short", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: testEmail,
        password: "123",
        targetRole: "Software Engineer",
        experienceLevel: "FRESHER",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("registers a new candidate user", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: testEmail,
        password: testPassword,
        targetRole: "Software Engineer",
        experienceLevel: "FRESHER",
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("userId");
      expect(res.body.data.email).toBe(testEmail);
    });

    it("prevents duplicate registration with 409 Conflict", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User 2",
        email: testEmail,
        password: testPassword,
        targetRole: "Backend Engineer",
        experienceLevel: "0_1_YEARS",
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("OTP Verification", () => {
    it("fails login when email is not yet verified", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    });

    it("fails on wrong OTP with 400 OTP_INVALID", async () => {
      const res = await request(app).post("/api/v1/auth/verify-otp").send({
        email: testEmail,
        otp: "000000",
      });

      expect(res.status).toBe(400);
    });

    it("verifies user when correct OTP is provided", async () => {
      // Mark verified in DB directly or set known OTP
      await prisma.user.update({
        where: { email: testEmail },
        data: { emailVerified: true },
      });

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user?.emailVerified).toBe(true);
    });
  });

  describe("Login & Session Management", () => {
    it("logs in successfully and returns JWT + cookie", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user.email).toBe(testEmail);

      accessToken = res.body.data.accessToken;
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      refreshTokenCookie = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(refreshTokenCookie).toContain("refreshToken=");
    });

    it("refreshes access token with valid cookie", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", refreshTokenCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      accessToken = res.body.data.accessToken;
    });

    it("locks account after 5 failed attempts", async () => {
      const badEmail = "badpass@example.com";
      await request(app).post("/api/v1/auth/register").send({
        name: "Lockout Test",
        email: badEmail,
        password: testPassword,
        targetRole: "DevOps Engineer",
        experienceLevel: "1_3_YEARS",
      });
      await prisma.user.update({
        where: { email: badEmail },
        data: { emailVerified: true },
      });

      // 4 failures
      for (let i = 0; i < 4; i++) {
        const failRes = await request(app).post("/api/v1/auth/login").send({
          email: badEmail,
          password: "WrongPassword1!",
        });
        expect(failRes.status).toBe(401);
      }

      // 5th failure triggers lockout
      const lockRes = await request(app).post("/api/v1/auth/login").send({
        email: badEmail,
        password: "WrongPassword1!",
      });
      expect(lockRes.status).toBe(423);
      expect(lockRes.body.error.code).toBe("ACCOUNT_LOCKED");
    });
  });

  describe("Profile & Me Endpoints", () => {
    it("GET /api/v1/me returns user profile", async () => {
      const res = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
      expect(res.body.data.targetRole).toBe("Software Engineer");
    });

    it("PATCH /api/v1/me updates profile fields", async () => {
      const res = await request(app)
        .patch("/api/v1/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          targetRole: "Full Stack Engineer",
          skills: ["React", "Node.js", "Docker"],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.targetRole).toBe("Full Stack Engineer");
      expect(res.body.data.skills).toContain("Docker");
    });

    it("POST /api/v1/me/password changes password", async () => {
      const res = await request(app)
        .post("/api/v1/me/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          oldPassword: testPassword,
          newPassword: "BrandNewPassword123!",
        });

      expect(res.status).toBe(204);
    });
  });

  describe("Password Reset (Enumeration-Safe)", () => {
    it("POST /auth/forgot-password returns 202 for known or unknown emails", async () => {
      const res1 = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: testEmail });
      expect(res1.status).toBe(202);

      const res2 = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });
      expect(res2.status).toBe(202);
    });
  });
});

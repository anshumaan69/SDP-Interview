import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { AppError, ConflictError, ForbiddenError, UnauthorizedError, ValidationError } from "../../lib/errors";
import { emailProvider } from "../email/emailProvider";
import {
  ChangePasswordInput,
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from "@sdp/shared";
import { ExperienceLevel, Role, UserStatus } from "@prisma/client";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function mapExperienceLevel(val?: string): ExperienceLevel {
  if (val === "0_1_YEARS" || val === ExperienceLevel.ZERO_TO_ONE) return ExperienceLevel.ZERO_TO_ONE;
  if (val === "1_3_YEARS" || val === ExperienceLevel.ONE_TO_THREE) return ExperienceLevel.ONE_TO_THREE;
  return ExperienceLevel.FRESHER;
}

export function formatExperienceLevel(val: ExperienceLevel): string {
  if (val === ExperienceLevel.ZERO_TO_ONE) return "0_1_YEARS";
  if (val === ExperienceLevel.ONE_TO_THREE) return "1_3_YEARS";
  return "FRESHER";
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError("Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        targetRole: input.targetRole,
        experienceLevel: mapExperienceLevel(input.experienceLevel),
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
      },
    });

    await this.sendVerificationOtp(user.email);

    return {
      userId: user.id,
      email: user.email,
    };
  }

  async sendVerificationOtp(email: string) {
    // Mock OTP service: 123456 for time being
    const otp = "123456";
    const otpHash = await bcrypt.hash(otp, 8);

    // 10 minutes TTL in Redis
    const redisKey = `otp:${email}`;
    await redis.set(
      redisKey,
      JSON.stringify({ hash: otpHash, attempts: 0 }),
      "EX",
      600
    );

    // 60 seconds cooldown for resend
    await redis.set(`otp_cooldown:${email}`, "1", "EX", 60);

    await emailProvider.sendEmail({
      to: email,
      subject: "Your Verification Code - InterviewAI",
      text: `Your 6-digit verification code is: ${otp}. It expires in 10 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Verify your email</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="letter-spacing: 5px; color: #16a34a;">${otp}</h1>
        <p>This code expires in 10 minutes. (Mock code: 123456)</p>
      </div>`,
    });
  }

  async verifyOtp(input: VerifyOtpInput) {
    // Fast path for mock OTP 123456
    if (input.otp === "123456") {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (user) {
        await redis.del(`otp:${input.email}`);
        await prisma.user.update({
          where: { email: input.email },
          data: { emailVerified: true },
        });
        return { verified: true };
      }
    }

    const redisKey = `otp:${input.email}`;
    const rawData = await redis.get(redisKey);

    if (!rawData) {
      throw new ValidationError("OTP expired or not found. Please request a new one.", [
        { field: "otp", issue: "OTP_EXPIRED" },
      ]);
    }

    const data: { hash: string; attempts: number } = JSON.parse(rawData);

    if (data.attempts >= 3) {
      await redis.del(redisKey);
      const err = new AppError(429, "OTP_ATTEMPTS_EXCEEDED", "Maximum OTP attempts exceeded. Request a new OTP.");
      throw err;
    }

    const isMatch = await bcrypt.compare(input.otp, data.hash);

    if (!isMatch) {
      data.attempts += 1;
      if (data.attempts >= 3) {
        await redis.del(redisKey);
        const err = new AppError(429, "OTP_ATTEMPTS_EXCEEDED", "Maximum OTP attempts exceeded. Request a new OTP.");
        throw err;
      } else {
        await redis.set(redisKey, JSON.stringify(data), "EX", 600);
      }
      throw new ValidationError("Invalid OTP code", [{ field: "otp", issue: "OTP_INVALID" }]);
    }

    // Success
    await redis.del(redisKey);
    await prisma.user.update({
      where: { email: input.email },
      data: { emailVerified: true },
    });

    return { verified: true };
  }

  async resendOtp(email: string) {
    const cooldownKey = `otp_cooldown:${email}`;
    const inCooldown = await redis.get(cooldownKey);

    if (inCooldown) {
      const err = new AppError(429, "RESEND_COOLDOWN", "Please wait before requesting another OTP", [
        { field: "retryAfterSeconds", issue: "60" },
      ]);
      throw err;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return; // Safe return
    }

    await this.sendVerificationOtp(email);
  }

  async login(input: LoginInput, ip?: string) {
    const lockoutKey = `lockout:${input.email}`;
    const locked = await redis.get(lockoutKey);

    if (locked) {
      const err = new AppError(423, "ACCOUNT_LOCKED", "Account temporarily locked due to multiple failed login attempts", [
        { field: "retryAfterSeconds", issue: "900" },
      ]);
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    const failedKey = `failed_login:${input.email}`;

    if (!user) {
      await this.recordFailedLogin(input.email, failedKey, ip);
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      await this.recordFailedLogin(input.email, failedKey, ip, user.id);
      throw new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    // Clear failed attempts upon successful login
    await redis.del(failedKey);

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenError("Your account has been blocked. Please contact support.", "ACCOUNT_BLOCKED");
    }

    if (!user.emailVerified) {
      throw new ForbiddenError("Please verify your email before logging in.", "EMAIL_NOT_VERIFIED");
    }

    // Reactivate account if marked for deletion within 30 days
    if (user.markedForDeletionAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { markedForDeletionAt: null },
      });
    }

    // Issue Access Token (15 min)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // Issue Refresh Token (30 min sliding expiry)
    const refreshTokenPlain = crypto.randomBytes(40).toString("hex");
    const refreshHash = hashToken(refreshTokenPlain);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        event: "LOGIN",
        ip: ip || null,
        details: { email: user.email },
      },
    });

    return {
      accessToken,
      refreshTokenPlain,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  private async recordFailedLogin(email: string, failedKey: string, ip?: string, userId?: string) {
    const count = await redis.incr(failedKey);
    await redis.expire(failedKey, 900); // 15 mins

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        event: "LOGIN_FAILED",
        ip: ip || null,
        details: { email, attemptCount: count },
      },
    });

    if (count >= 5) {
      await redis.set(`lockout:${email}`, "1", "EX", 900);
      const err = new AppError(423, "ACCOUNT_LOCKED", "Account locked due to 5 failed attempts. Try again in 15 minutes.", [
        { field: "retryAfterSeconds", issue: "900" },
      ]);
      throw err;
    }
  }

  async refresh(refreshTokenPlain: string) {
    if (!refreshTokenPlain) {
      throw new UnauthorizedError("Refresh token missing", "SESSION_EXPIRED");
    }

    const hashed = hashToken(refreshTokenPlain);

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashed,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!tokenRecord || !tokenRecord.user || tokenRecord.user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedError("Session expired or invalid", "SESSION_EXPIRED");
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Create new refresh token with 30 min sliding window
    const newRefreshPlain = crypto.randomBytes(40).toString("hex");
    const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash: hashToken(newRefreshPlain),
        expiresAt: newExpiresAt,
      },
    });

    // Generate new 15m access token
    const accessToken = jwt.sign(
      {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        name: tokenRecord.user.name,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return {
      accessToken,
      newRefreshPlain,
    };
  }

  async logout(refreshTokenPlain: string) {
    if (refreshTokenPlain) {
      const hashed = hashToken(refreshTokenPlain);
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashed, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Enumeration-safe: return success without leaking existence
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    await emailProvider.sendEmail({
      to: email,
      subject: "Password Reset Request - InterviewAI",
      text: `Reset your password by visiting: ${resetUrl}. This link expires in 30 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Password Reset</h2>
        <p>You requested a password reset for InterviewAI.</p>
        <p><a href="${resetUrl}" style="padding: 10px 18px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>`,
    });
  }

  async resetPassword(input: ResetPasswordInput, ip?: string) {
    const tokenHash = hashToken(input.token);

    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord || !resetRecord.user) {
      throw new ValidationError("Invalid or expired password reset token", [
        { field: "token", issue: "TOKEN_INVALID_OR_EXPIRED" },
      ]);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: resetRecord.userId,
          event: "PASSWORD_RESET",
          ip: ip || null,
          details: { email: resetRecord.user.email },
        },
      }),
    ]);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        targetRole: true,
        experienceLevel: true,
        skills: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return {
      ...user,
      experienceLevel: formatExperienceLevel(user.experienceLevel),
      skills: Array.isArray(user.skills) ? (user.skills as string[]) : [],
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.targetRole ? { targetRole: input.targetRole } : {}),
        ...(input.experienceLevel ? { experienceLevel: mapExperienceLevel(input.experienceLevel) } : {}),
        ...(input.skills ? { skills: input.skills } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        targetRole: true,
        experienceLevel: true,
        skills: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      experienceLevel: formatExperienceLevel(user.experienceLevel),
      skills: Array.isArray(user.skills) ? (user.skills as string[]) : [],
      createdAt: user.createdAt.toISOString(),
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError("User not found");

    const isMatch = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError("Current password is incorrect", [
        { field: "oldPassword", issue: "OLD_PASSWORD_WRONG" },
      ]);
    }

    const newHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async deleteAccount(userId: string, input: DeleteAccountInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError("User not found");

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError("Password is incorrect", [
        { field: "password", issue: "PASSWORD_WRONG" },
      ]);
    }

    // Marked for deletion, purged in 30 days per §3.4
    await prisma.user.update({
      where: { id: userId },
      data: { markedForDeletionAt: new Date() },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authService = new AuthService();

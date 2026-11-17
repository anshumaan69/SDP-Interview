import { prisma } from "../../lib/prisma";
import { AppError, ConflictError, NotFoundError, ValidationError } from "../../lib/errors";
import {
  CreateQuestionInput,
  Difficulty,
  InterviewType,
  UpdateQuestionInput,
  UserStatus,
} from "@sdp/shared";
import { Role } from "@prisma/client";

export function normalizeQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export class AdminService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, totalSessions, totalQuestions, sessionsToday] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.CANDIDATE } }),
        prisma.user.count({ where: { role: Role.CANDIDATE, status: UserStatus.ACTIVE } }),
        prisma.session.count(),
        prisma.question.count(),
        prisma.session.count({
          where: {
            createdAt: { gte: today },
          },
        }),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      totalQuestions,
      sessionsToday,
    };
  }

  async getQuestions(params: {
    q?: string;
    type?: string;
    role?: string;
    difficulty?: string;
    page: number;
    limit: number;
  }) {
    const { q, type, role, difficulty, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.text = { contains: q, mode: "insensitive" };
    }
    if (type) {
      where.type = type as InterviewType;
    }
    if (role) {
      where.role = { contains: role, mode: "insensitive" };
    }
    if (difficulty) {
      where.difficulty = difficulty as Difficulty;
    }

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async createQuestion(input: CreateQuestionInput, adminId: string, ip?: string) {
    const normalized = normalizeQuestionText(input.text);

    const existing = await prisma.question.findFirst({
      where: { normalizedText: normalized },
    });

    if (existing) {
      throw new ConflictError("A question with identical content already exists", "DUPLICATE_QUESTION");
    }

    const question = await prisma.question.create({
      data: {
        text: input.text,
        normalizedText: normalized,
        type: input.type as InterviewType,
        role: input.role,
        difficulty: input.difficulty as Difficulty,
        idealAnswer: input.idealAnswer || null,
        isSeeded: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_CREATE_QUESTION",
        ip: ip || null,
        details: { questionId: question.id, role: question.role },
      },
    });

    return question;
  }

  async updateQuestion(id: string, input: UpdateQuestionInput, adminId: string, ip?: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    let normalized = question.normalizedText;
    if (input.text) {
      normalized = normalizeQuestionText(input.text);
      if (normalized !== question.normalizedText) {
        const existing = await prisma.question.findFirst({
          where: { normalizedText: normalized, id: { not: id } },
        });
        if (existing) {
          throw new ConflictError("Another question already has this exact content", "DUPLICATE_QUESTION");
        }
      }
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(input.text ? { text: input.text, normalizedText: normalized } : {}),
        ...(input.type ? { type: input.type as InterviewType } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty as Difficulty } : {}),
        ...(input.idealAnswer !== undefined ? { idealAnswer: input.idealAnswer } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_UPDATE_QUESTION",
        ip: ip || null,
        details: { questionId: id },
      },
    });

    return updated;
  }

  async deleteQuestion(id: string, adminId: string, ip?: string) {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    await prisma.question.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_DELETE_QUESTION",
        ip: ip || null,
        details: { questionId: id },
      },
    });
  }

  async bulkUploadQuestions(csvContent: string, adminId: string, ip?: string) {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new ValidationError("CSV file must contain a header row and at least one data row", [
        { field: "file", issue: "INVALID_CSV" },
      ]);
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const textIdx = header.indexOf("text");
    const typeIdx = header.indexOf("type");
    const roleIdx = header.indexOf("role");
    const diffIdx = header.indexOf("difficulty");
    const idealIdx = header.indexOf("idealanswer");

    if (textIdx === -1 || typeIdx === -1 || roleIdx === -1 || diffIdx === -1) {
      throw new ValidationError("CSV must include columns: text, type, role, difficulty", [
        { field: "file", issue: "INVALID_CSV" },
      ]);
    }

    let inserted = 0;
    const failed: Array<{ row: number; reason: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split handling quotes
      const parts: string[] = [];
      let inQuotes = false;
      let current = "";
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          parts.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      const text = parts[textIdx]?.replace(/^"|"$/g, "");
      const type = parts[typeIdx]?.replace(/^"|"$/g, "").toUpperCase();
      const role = parts[roleIdx]?.replace(/^"|"$/g, "");
      const difficulty = parts[diffIdx]?.replace(/^"|"$/g, "").toUpperCase();
      const idealAnswer = idealIdx !== -1 ? parts[idealIdx]?.replace(/^"|"$/g, "") : null;

      if (!text || text.length < 10) {
        failed.push({ row: i, reason: "Text must be at least 10 characters" });
        continue;
      }

      if (!Object.values(InterviewType).includes(type as any)) {
        failed.push({ row: i, reason: `Invalid type '${type}'` });
        continue;
      }

      if (!Object.values(Difficulty).includes(difficulty as any)) {
        failed.push({ row: i, reason: `Invalid difficulty '${difficulty}'` });
        continue;
      }

      const normalized = normalizeQuestionText(text);
      const exists = await prisma.question.findFirst({ where: { normalizedText: normalized } });
      if (exists) {
        failed.push({ row: i, reason: "Duplicate question content" });
        continue;
      }

      await prisma.question.create({
        data: {
          text,
          normalizedText: normalized,
          type: type as InterviewType,
          role: role || "Software Engineer",
          difficulty: difficulty as Difficulty,
          idealAnswer: idealAnswer || null,
        },
      });
      inserted++;
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_BULK_UPLOAD_QUESTIONS",
        ip: ip || null,
        details: { totalRows: lines.length - 1, inserted, failedCount: failed.length },
      },
    });

    return {
      total: lines.length - 1,
      inserted,
      failed,
    };
  }

  async getUsers(params: { q?: string; status?: string; page: number; limit: number }) {
    const { q, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status as UserStatus;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      sessionCount: u._count.sessions,
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async updateUserStatus(targetUserId: string, status: UserStatus, adminId: string, ip?: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: true,
      },
    });

    // If blocking user, revoke all active refresh tokens immediately
    if (status === UserStatus.BLOCKED) {
      await prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_UPDATE_USER_STATUS",
        ip: ip || null,
        details: { targetUserId, newStatus: status },
      },
    });

    return updated;
  }

  async deleteUser(targetUserId: string, adminId: string, ip?: string) {
    if (targetUserId === adminId) {
      throw new ValidationError("Cannot delete your own admin account", [
        { field: "userId", issue: "CANNOT_DELETE_SELF" },
      ]);
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        event: "ADMIN_DELETE_USER",
        ip: ip || null,
        details: { targetUserId, email: user.email },
      },
    });
  }

  async getAuditLogs(params: {
    event?: string;
    userId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const { event, userId, from, to, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (event) where.event = { contains: event, mode: "insensitive" };
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user?.name || null,
        userEmail: l.user?.email || null,
        event: l.event,
        ip: l.ip,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}

export const adminService = new AdminService();

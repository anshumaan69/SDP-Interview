import { prisma } from "../../lib/prisma";
import { InterviewType, SessionStatus } from "@sdp/shared";

export class DashboardService {
  async getSummary(userId: string, from?: string, to?: string) {
    const where: any = { userId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [totalSessions, completedSessions, sessions] = await Promise.all([
      prisma.session.count({ where }),
      prisma.session.count({
        where: {
          ...where,
          status: SessionStatus.COMPLETED,
        },
      }),
      prisma.session.findMany({
        where: {
          ...where,
          overallScore: { not: null },
        },
        select: {
          overallScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const scored = sessions.map((s) => s.overallScore as number);
    const averageScore =
      scored.length > 0
        ? Number((scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1))
        : 0;
    const bestScore = scored.length > 0 ? Math.max(...scored) : 0;
    const lastSessionAt = sessions.length > 0 ? sessions[0].createdAt.toISOString() : null;

    return {
      totalSessions,
      completedSessions,
      averageScore,
      bestScore,
      lastSessionAt,
    };
  }

  async getTrend(
    userId: string,
    from?: string,
    to?: string,
    granularity: "day" | "week" = "day"
  ) {
    const where: any = {
      userId,
      overallScore: { not: null },
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const sessions = await prisma.session.findMany({
      where,
      select: {
        overallScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped = new Map<string, { totalScore: number; count: number }>();

    for (const s of sessions) {
      const d = s.createdAt;
      let key: string;

      if (granularity === "week") {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
      } else {
        key = d.toISOString().split("T")[0];
      }

      const existing = grouped.get(key) || { totalScore: 0, count: 0 };
      grouped.set(key, {
        totalScore: existing.totalScore + (s.overallScore || 0),
        count: existing.count + 1,
      });
    }

    const result: Array<{ date: string; averageScore: number; sessions: number }> = [];
    grouped.forEach((val, dateKey) => {
      result.push({
        date: dateKey,
        averageScore: Number((val.totalScore / val.count).toFixed(1)),
        sessions: val.count,
      });
    });

    return result;
  }

  async getCategories(userId: string, from?: string, to?: string) {
    const where: any = {
      userId,
      overallScore: { not: null },
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const sessions = await prisma.session.findMany({
      where,
      select: {
        type: true,
        overallScore: true,
        criteriaScores: true,
      },
    });

    const typeGrouped = new Map<string, { total: number; count: number }>();
    const criteriaSums = {
      relevance: 0,
      correctness: 0,
      clarity: 0,
      completeness: 0,
    };
    let criteriaCount = 0;

    for (const s of sessions) {
      const tKey = s.type;
      const existing = typeGrouped.get(tKey) || { total: 0, count: 0 };
      typeGrouped.set(tKey, {
        total: existing.total + (s.overallScore || 0),
        count: existing.count + 1,
      });

      if (s.criteriaScores) {
        const c = s.criteriaScores as {
          relevance: number;
          correctness: number;
          clarity: number;
          completeness: number;
        };
        criteriaSums.relevance += c.relevance || 0;
        criteriaSums.correctness += c.correctness || 0;
        criteriaSums.clarity += c.clarity || 0;
        criteriaSums.completeness += c.completeness || 0;
        criteriaCount++;
      }
    }

    const byType = Array.from(typeGrouped.entries()).map(([type, val]) => ({
      type,
      averageScore: Number((val.total / val.count).toFixed(1)),
      sessions: val.count,
    }));

    const byCriterion = {
      relevance: criteriaCount > 0 ? Number((criteriaSums.relevance / criteriaCount).toFixed(1)) : 0,
      correctness: criteriaCount > 0 ? Number((criteriaSums.correctness / criteriaCount).toFixed(1)) : 0,
      clarity: criteriaCount > 0 ? Number((criteriaSums.clarity / criteriaCount).toFixed(1)) : 0,
      completeness: criteriaCount > 0 ? Number((criteriaSums.completeness / criteriaCount).toFixed(1)) : 0,
    };

    return {
      byType,
      byCriterion,
    };
  }

  async getHistory(params: {
    userId: string;
    from?: string;
    to?: string;
    type?: string;
    role?: string;
    page: number;
    limit: number;
  }) {
    const { userId, from, to, type, role, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type as InterviewType;
    if (role) where.role = { contains: role, mode: "insensitive" };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          role: true,
          type: true,
          difficulty: true,
          overallScore: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.session.count({ where }),
    ]);

    const items = sessions.map((s) => ({
      sessionId: s.id,
      date: s.createdAt.toISOString(),
      role: s.role,
      type: s.type,
      difficulty: s.difficulty,
      overallScore: s.overallScore || 0,
      status: s.status,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}

export const dashboardService = new DashboardService();

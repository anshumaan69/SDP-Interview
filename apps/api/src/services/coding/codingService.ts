import { prisma } from "../../lib/prisma";
import { AppError, NotFoundError } from "../../lib/errors";
import { CodingLanguage, CodingVerdict, Difficulty } from "@sdp/shared";
import { codeRunnerService, TestCaseExecution } from "./codeRunnerService";
import { logger } from "../../lib/logger";

export interface CodingTopicSummary {
  topic: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
}

export class CodingService {
  /**
   * Group problems by topic, counting EASY, MEDIUM, HARD
   */
  async getTopics(): Promise<CodingTopicSummary[]> {
    const problems = await prisma.codingProblem.findMany({
      select: {
        topic: true,
        difficulty: true,
      },
    });

    const topicMap: Record<
      string,
      { total: number; easy: number; medium: number; hard: number }
    > = {};

    for (const p of problems) {
      if (!topicMap[p.topic]) {
        topicMap[p.topic] = { total: 0, easy: 0, medium: 0, hard: 0 };
      }
      topicMap[p.topic].total++;
      if (p.difficulty === Difficulty.EASY) topicMap[p.topic].easy++;
      else if (p.difficulty === Difficulty.MEDIUM) topicMap[p.topic].medium++;
      else if (p.difficulty === Difficulty.HARD) topicMap[p.topic].hard++;
    }

    return Object.entries(topicMap).map(([topic, counts]) => ({
      topic,
      ...counts,
    }));
  }

  /**
   * List problems with solved status and attempt counts for candidate
   */
  async getProblems(
    userId: string,
    params: {
      topic?: string;
      difficulty?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.topic) where.topic = params.topic;
    if (params.difficulty) where.difficulty = params.difficulty as Difficulty;

    const [total, problems, userAttempts] = await Promise.all([
      prisma.codingProblem.count({ where }),
      prisma.codingProblem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ topic: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          topic: true,
          difficulty: true,
          createdAt: true,
        },
      }),
      prisma.codingAttempt.findMany({
        where: { userId },
        select: {
          problemId: true,
          status: true,
        },
      }),
    ]);

    const solvedProblemIds = new Set<string>();
    const attemptedCounts: Record<string, number> = {};

    for (const att of userAttempts) {
      attemptedCounts[att.problemId] = (attemptedCounts[att.problemId] || 0) + 1;
      if (att.status === "PASSED") {
        solvedProblemIds.add(att.problemId);
      }
    }

    const items = problems.map((p) => ({
      ...p,
      isSolved: solvedProblemIds.has(p.id),
      attemptCount: attemptedCounts[p.id] || 0,
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get random problem, preferring unsolved problems matching criteria
   */
  async getRandomProblem(
    userId: string,
    topic?: string,
    difficulty?: string
  ) {
    const where: any = {};
    if (topic) where.topic = topic;
    if (difficulty) where.difficulty = difficulty as Difficulty;

    const problems = await prisma.codingProblem.findMany({
      where,
      select: { id: true, slug: true },
    });

    if (problems.length === 0) {
      throw new NotFoundError("No coding problems match the given criteria");
    }

    // Check solved status to prioritize unsolved
    const solvedAttempts = await prisma.codingAttempt.findMany({
      where: {
        userId,
        problemId: { in: problems.map((p) => p.id) },
        status: "PASSED",
      },
      select: { problemId: true },
    });
    const solvedIds = new Set(solvedAttempts.map((s) => s.problemId));

    const unsolved = problems.filter((p) => !solvedIds.has(p.id));
    const pool = unsolved.length > 0 ? unsolved : problems;

    const selected = pool[Math.floor(Math.random() * pool.length)];
    return this.getProblemById(selected.id, userId);
  }

  /**
   * Get problem details by id or slug (never leaks hidden test cases)
   */
  async getProblemById(idOrSlug: string, userId: string) {
    const problem = await prisma.codingProblem.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        testCases: {
          where: { isHidden: false },
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            input: true,
            expectedOutput: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!problem) {
      throw new NotFoundError("Coding problem not found");
    }

    // Check user's solved status & attempts
    const attempts = await prisma.codingAttempt.findMany({
      where: { userId, problemId: problem.id },
      select: { status: true },
    });

    const isSolved = attempts.some((a) => a.status === "PASSED");
    const attemptCount = attempts.length;

    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      topic: problem.topic,
      difficulty: problem.difficulty,
      statement: problem.statement,
      constraints: problem.constraints,
      sampleCases: problem.sampleCases,
      starterCode: problem.starterCode,
      visibleTestCases: problem.testCases,
      isSolved,
      attemptCount,
      createdAt: problem.createdAt,
    };
  }

  /**
   * Run code against sample cases or custom input
   */
  async runCode(
    userId: string,
    problemId: string,
    input: {
      language: CodingLanguage;
      code: string;
      customInput?: string;
    }
  ) {
    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          where: { isHidden: false },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!problem) {
      throw new NotFoundError("Coding problem not found");
    }

    let casesToRun: TestCaseExecution[];

    if (input.customInput !== undefined && input.customInput.trim().length > 0) {
      casesToRun = [
        {
          input: input.customInput,
          expectedOutput: "",
          isHidden: false,
        },
      ];
    } else {
      casesToRun = problem.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: false,
      }));

      // Fallback to sampleCases json if no visible testCases
      if (casesToRun.length === 0 && Array.isArray(problem.sampleCases)) {
        casesToRun = (problem.sampleCases as Array<{ input: string; output: string }>).map(
          (sc) => ({
            input: sc.input,
            expectedOutput: sc.output,
            isHidden: false,
          })
        );
      }
    }

    const execResult = await codeRunnerService.runBatch(
      input.language,
      input.code,
      casesToRun
    );

    return execResult;
  }

  /**
   * Submit code against all test cases (sample + hidden)
   */
  async submitCode(
    userId: string,
    problemId: string,
    input: {
      language: CodingLanguage;
      code: string;
    },
    idempotencyKey?: string
  ) {
    // 1. Check idempotency
    if (idempotencyKey) {
      const existing = await prisma.codingAttempt.findUnique({
        where: { idempotencyKey },
        include: {
          problem: {
            select: { title: true, slug: true, difficulty: true },
          },
        },
      });
      if (existing) {
        return this.sanitizeAttempt(existing);
      }
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!problem) {
      throw new NotFoundError("Coding problem not found");
    }

    // 2. Prepare test cases
    const cases: TestCaseExecution[] = problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    }));

    // 3. Create Queued Attempt Record
    let attempt = await prisma.codingAttempt.create({
      data: {
        userId,
        problemId,
        language: input.language,
        code: input.code,
        status: "QUEUED",
        totalCount: cases.length,
        idempotencyKey: idempotencyKey || null,
      },
    });

    try {
      // 4. Execute test cases
      const execResult = await codeRunnerService.runBatch(
        input.language as CodingLanguage,
        input.code,
        cases
      );

      // Determine final status
      let finalStatus: string;
      if (execResult.compileError) {
        finalStatus = CodingVerdict.COMPILE_ERROR;
      } else if (execResult.passedCount === execResult.total && execResult.total > 0) {
        finalStatus = CodingVerdict.PASSED;
      } else {
        const firstFailure = execResult.results.find(
          (r) => r.verdict !== CodingVerdict.PASSED
        );
        finalStatus = firstFailure ? firstFailure.verdict : CodingVerdict.WRONG_ANSWER;
      }

      // 5. Update attempt
      attempt = await prisma.codingAttempt.update({
        where: { id: attempt.id },
        data: {
          status: finalStatus,
          passedCount: execResult.passedCount,
          totalCount: execResult.total,
          compileError: execResult.compileError || null,
          results: execResult.results as any,
        },
      });

      return this.sanitizeAttempt(attempt);
    } catch (err: any) {
      logger.error({ err, attemptId: attempt.id }, "Execution error during submitCode");
      attempt = await prisma.codingAttempt.update({
        where: { id: attempt.id },
        data: {
          status: CodingVerdict.RUNTIME_ERROR,
          compileError: err?.message || "Execution failed",
        },
      });
      return this.sanitizeAttempt(attempt);
    }
  }

  /**
   * Get attempt details by id (enforces ownership and sanitizes hidden cases)
   */
  async getAttempt(attemptId: string, userId: string, isAdmin = false) {
    const attempt = await prisma.codingAttempt.findUnique({
      where: { id: attemptId },
      include: {
        problem: {
          select: { id: true, title: true, slug: true, difficulty: true },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Coding attempt not found");
    }

    if (attempt.userId !== userId && !isAdmin) {
      throw new NotFoundError("Coding attempt not found");
    }

    return this.sanitizeAttempt(attempt);
  }

  /**
   * List candidate's past attempts
   */
  async getAttempts(
    userId: string,
    params: {
      problemId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (params.problemId) where.problemId = params.problemId;

    const [total, attempts] = await Promise.all([
      prisma.codingAttempt.count({ where }),
      prisma.codingAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          problem: {
            select: { id: true, title: true, slug: true, difficulty: true },
          },
        },
      }),
    ]);

    return {
      items: attempts.map((a) => this.sanitizeAttempt(a)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Ensures hidden test cases NEVER leak expected, actual, or stderr
   */
  private sanitizeAttempt(attempt: any) {
    let sanitizedResults = attempt.results;
    if (Array.isArray(sanitizedResults)) {
      sanitizedResults = sanitizedResults.map((r: any) => {
        if (!r.visible) {
          return {
            caseNo: r.caseNo,
            visible: false,
            verdict: r.verdict,
            runtimeMs: r.runtimeMs,
          };
        }
        return r;
      });
    }

    return {
      ...attempt,
      results: sanitizedResults,
    };
  }
}

export const codingService = new CodingService();

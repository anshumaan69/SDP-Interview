import { prisma } from "../../lib/prisma";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../lib/errors";
import { llmService } from "../llm/llmService";
import {
  CreateSessionInput,
  Difficulty,
  EvalStatus,
  InterviewType,
  ResultStatus,
  SessionStatus,
  SubmitAnswerInput,
} from "@sdp/shared";

export function computeNextDifficulty(
  current: Difficulty,
  lastTwoScores: number[]
): Difficulty {
  if (lastTwoScores.length < 2) return current;
  const [s1, s2] = lastTwoScores;

  // Adaptive difficulty rule
  if (s1 >= 7.5 && s2 >= 7.5) {
    if (current === Difficulty.EASY) return Difficulty.MEDIUM;
    if (current === Difficulty.MEDIUM) return Difficulty.HARD;
    return Difficulty.HARD;
  }

  if (s1 <= 4.0 && s2 <= 4.0) {
    if (current === Difficulty.HARD) return Difficulty.MEDIUM;
    if (current === Difficulty.MEDIUM) return Difficulty.EASY;
    return Difficulty.EASY;
  }

  return current;
}

export class InterviewService {
  async createSession(userId: string, input: CreateSessionInput) {
    // 1. Create Session record
    const session = await prisma.session.create({
      data: {
        userId,
        role: input.role,
        type: input.type as InterviewType,
        difficulty: input.difficulty as Difficulty,
        currentDifficulty: input.difficulty as Difficulty,
        questionCount: input.questionCount,
        currentIndex: 0,
        status: SessionStatus.IN_PROGRESS,
        timerSeconds: input.timerSeconds || null,
        mode: input.mode as any,
        resultStatus: ResultStatus.GENERATING,
      },
    });

    // 2. Synchronously generate first question (with bank fallback)
    const firstQ = await llmService.generateQuestion({
      userId,
      role: session.role,
      type: session.type,
      difficulty: session.currentDifficulty,
    });

    const sessionQuestion = await prisma.sessionQuestion.create({
      data: {
        sessionId: session.id,
        questionText: firstQ.text,
        type: session.type,
        difficulty: session.currentDifficulty,
        index: 0,
      },
    });

    return {
      sessionId: session.id,
      status: session.status,
      config: {
        role: session.role,
        type: session.type,
        difficulty: session.difficulty,
        questionCount: session.questionCount,
        timerSeconds: session.timerSeconds,
        mode: session.mode,
      },
      question: {
        id: sessionQuestion.id,
        index: 1,
        text: sessionQuestion.questionText,
        type: sessionQuestion.type,
        difficulty: sessionQuestion.difficulty,
      },
      total: session.questionCount,
    };
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    const currentSQ = session.sessionQuestions.find(
      (sq) => sq.index === session.currentIndex
    );

    const answeredCount = session.sessionQuestions.filter(
      (sq) => sq.answer && sq.answer.evalStatus !== "PENDING"
    ).length;

    return {
      id: session.id,
      status: session.status,
      config: {
        role: session.role,
        type: session.type,
        difficulty: session.difficulty,
        currentDifficulty: session.currentDifficulty,
        questionCount: session.questionCount,
        timerSeconds: session.timerSeconds,
        mode: session.mode,
      },
      currentIndex: session.currentIndex + 1,
      total: session.questionCount,
      answeredCount,
      question: currentSQ
        ? {
            id: currentSQ.id,
            index: currentSQ.index + 1,
            text: currentSQ.questionText,
            type: currentSQ.type,
            difficulty: currentSQ.difficulty,
          }
        : null,
    };
  }

  async getResumableSessions(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        status: { in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED] },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    input: SubmitAnswerInput,
    idempotencyKey?: string
  ) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new ConflictError("Session is not currently active", "SESSION_NOT_ACTIVE");
    }

    const sessionQuestion = await prisma.sessionQuestion.findUnique({
      where: { id: input.questionId },
      include: { answer: true },
    });

    if (!sessionQuestion || sessionQuestion.sessionId !== sessionId) {
      throw new NotFoundError("Question does not belong to this session");
    }

    if (sessionQuestion.answer) {
      if (idempotencyKey && sessionQuestion.answer.idempotencyKey === idempotencyKey) {
        return {
          answerId: sessionQuestion.answer.id,
          evalStatus: sessionQuestion.answer.evalStatus,
        };
      }
      throw new ConflictError("Question has already been answered", "ALREADY_ANSWERED");
    }

    // Create pending answer
    const answer = await prisma.answer.create({
      data: {
        sessionId,
        sessionQuestionId: sessionQuestion.id,
        answerText: input.answerText,
        timeTakenSeconds: input.timeTakenSeconds,
        evalStatus: EvalStatus.PENDING,
        idempotencyKey: idempotencyKey || null,
        rubricVersion: "2.0",
        promptVersion: "2.0",
      },
    });

    // Execute evaluation and pre-generation asynchronously or in-process
    this.processAnswerEvaluation(sessionId, sessionQuestion.id, answer.id).catch((err) => {
      console.error("Evaluation process error:", err);
    });

    return {
      answerId: answer.id,
      evalStatus: EvalStatus.PENDING,
    };
  }

  async processAnswerEvaluation(
    sessionId: string,
    sessionQuestionId: string,
    answerId: string
  ) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session) return;

    const sq = session.sessionQuestions.find((q) => q.id === sessionQuestionId);
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });

    if (!sq || !answer || !answer.answerText) return;

    // (a) Evaluate answer
    const evalResult = await llmService.evaluateAnswer({
      questionText: sq.questionText,
      answerText: answer.answerText,
      role: session.role,
      difficulty: sq.difficulty,
    });

    await prisma.answer.update({
      where: { id: answerId },
      data: {
        evalStatus: EvalStatus.DONE,
        relevance: evalResult.relevance,
        correctness: evalResult.correctness,
        clarity: evalResult.clarity,
        completeness: evalResult.completeness,
        overall: evalResult.overall,
        feedback: evalResult.feedback,
        sampleAnswer: evalResult.sampleAnswer,
      },
    });

    // (b) Compute next difficulty from last two answered scores
    const answered = session.sessionQuestions
      .filter((q) => q.answer && q.answer.overall !== null && !q.answer.skipped)
      .map((q) => q.answer!.overall as number);

    answered.push(evalResult.overall);
    const lastTwo = answered.slice(-2);
    const nextDiff = computeNextDifficulty(session.currentDifficulty, lastTwo);

    await prisma.session.update({
      where: { id: sessionId },
      data: { currentDifficulty: nextDiff },
    });

    // (c) Pre-generate next question if not at end
    const nextIndex = sq.index + 1;
    if (nextIndex < session.questionCount) {
      const existingNext = session.sessionQuestions.find((q) => q.index === nextIndex);
      if (!existingNext) {
        const nextQ = await llmService.generateQuestion({
          userId: session.userId,
          role: session.role,
          type: session.type,
          difficulty: nextDiff,
          excludedQuestionTexts: session.sessionQuestions.map((q) => q.questionText),
        });

        await prisma.sessionQuestion.create({
          data: {
            sessionId: session.id,
            questionText: nextQ.text,
            type: session.type,
            difficulty: nextDiff,
            index: nextIndex,
          },
        });
      }
    }
  }

  async getAnswerEvaluation(userId: string, sessionId: string, answerId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: { sessionQuestion: true },
    });

    if (!answer || answer.sessionId !== sessionId) {
      throw new NotFoundError("Answer not found");
    }

    if (answer.evalStatus !== EvalStatus.DONE) {
      return {
        evalStatus: answer.evalStatus,
        scores: null,
        feedback: null,
        sampleAnswer: null,
        nextDifficulty: session.currentDifficulty,
        nextQuestion: null,
        isLast: false,
      };
    }

    const currentIndex = answer.sessionQuestion.index;
    const isLast = currentIndex + 1 >= session.questionCount;

    // Advance session currentIndex
    if (currentIndex === session.currentIndex && !isLast) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { currentIndex: currentIndex + 1 },
      });
    }

    const nextSQ = session.sessionQuestions.find((q) => q.index === currentIndex + 1);

    return {
      evalStatus: answer.evalStatus,
      scores: {
        relevance: answer.relevance || 0,
        correctness: answer.correctness || 0,
        clarity: answer.clarity || 0,
        completeness: answer.completeness || 0,
        overall: answer.overall || 0,
      },
      feedback: answer.feedback,
      sampleAnswer: answer.sampleAnswer,
      nextDifficulty: session.currentDifficulty,
      nextQuestion: nextSQ
        ? {
            id: nextSQ.id,
            index: nextSQ.index + 1,
            text: nextSQ.questionText,
            type: nextSQ.type,
            difficulty: nextSQ.difficulty,
          }
        : null,
      isLast,
    };
  }

  async skipQuestion(userId: string, sessionId: string, questionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    const sq = session.sessionQuestions.find((q) => q.id === questionId);
    if (!sq) throw new NotFoundError("Question not found");

    if (!sq.answer) {
      await prisma.answer.create({
        data: {
          sessionId,
          sessionQuestionId: sq.id,
          skipped: true,
          evalStatus: EvalStatus.DONE,
          relevance: 0,
          correctness: 0,
          clarity: 0,
          completeness: 0,
          overall: 0,
          feedback: "Question skipped by candidate.",
          sampleAnswer: "Skipped.",
        },
      });
    }

    const isLast = sq.index + 1 >= session.questionCount;
    const nextIndex = sq.index + 1;

    let nextSQ: any = session.sessionQuestions.find((q) => q.index === nextIndex);

    if (!isLast && !nextSQ) {
      const nextQ = await llmService.generateQuestion({
        userId: session.userId,
        role: session.role,
        type: session.type,
        difficulty: session.currentDifficulty,
        excludedQuestionTexts: session.sessionQuestions.map((q) => q.questionText),
      });

      nextSQ = await prisma.sessionQuestion.create({
        data: {
          sessionId,
          questionText: nextQ.text,
          type: session.type,
          difficulty: session.currentDifficulty,
          index: nextIndex,
        },
      });
    }

    if (!isLast) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { currentIndex: nextIndex },
      });
    }

    return {
      nextQuestion: nextSQ
        ? {
            id: nextSQ.id,
            index: nextSQ.index + 1,
            text: nextSQ.questionText,
            type: nextSQ.type,
            difficulty: nextSQ.difficulty,
          }
        : null,
      isLast,
    };
  }

  async pauseSession(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundError("Session not found");

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.PAUSED },
    });

    return { status: updated.status };
  }

  async resumeSession(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundError("Session not found");

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.IN_PROGRESS },
    });

    return this.getSession(userId, sessionId);
  }

  async endSession(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: { include: { answer: true } },
      },
    });

    if (!session || session.userId !== userId) throw new NotFoundError("Session not found");

    const allAnswered = session.sessionQuestions.every(
      (q) => q.answer && q.answer.evalStatus === EvalStatus.DONE
    );

    const newStatus = allAnswered ? SessionStatus.COMPLETED : SessionStatus.ENDED_EARLY;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        resultStatus: ResultStatus.GENERATING,
      },
    });

    // Run summary generation in background
    this.generateSummary(sessionId).catch((err) => {
      console.error("Summary generation error:", err);
    });

    return {
      status: newStatus,
      resultStatus: ResultStatus.GENERATING,
    };
  }

  async generateSummary(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session) return;

    // Filter answered questions (excluding skipped per FR-16)
    const validAnswers = session.sessionQuestions
      .filter((q) => q.answer && !q.answer.skipped && q.answer.overall !== null)
      .map((q) => q.answer!);

    let overallScore = 0;
    const criteriaAverages = {
      relevance: 0,
      correctness: 0,
      clarity: 0,
      completeness: 0,
    };

    if (validAnswers.length > 0) {
      const sum = validAnswers.reduce(
        (acc, a) => {
          acc.overall += a.overall || 0;
          acc.relevance += a.relevance || 0;
          acc.correctness += a.correctness || 0;
          acc.clarity += a.clarity || 0;
          acc.completeness += a.completeness || 0;
          return acc;
        },
        { overall: 0, relevance: 0, correctness: 0, clarity: 0, completeness: 0 }
      );

      overallScore = Number((sum.overall / validAnswers.length).toFixed(1));
      criteriaAverages.relevance = Number((sum.relevance / validAnswers.length).toFixed(1));
      criteriaAverages.correctness = Number((sum.correctness / validAnswers.length).toFixed(1));
      criteriaAverages.clarity = Number((sum.clarity / validAnswers.length).toFixed(1));
      criteriaAverages.completeness = Number((sum.completeness / validAnswers.length).toFixed(1));
    }

    const summary = await llmService.generateSessionSummary({
      answeredQuestions: session.sessionQuestions.map((q) => ({
        text: q.questionText,
        answerText: q.answer?.answerText || null,
        scores: q.answer
          ? {
              relevance: q.answer.relevance || 0,
              correctness: q.answer.correctness || 0,
              clarity: q.answer.clarity || 0,
              completeness: q.answer.completeness || 0,
            }
          : null,
      })),
      criteriaAverages,
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        resultStatus: ResultStatus.READY,
        overallScore,
        criteriaScores: criteriaAverages,
        strengths: summary.strengths,
        weakAreas: summary.weakAreas,
        suggestions: summary.suggestions,
      },
    });
  }

  async getSessionResult(userId: string, sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        sessionQuestions: {
          orderBy: { index: "asc" },
          include: { answer: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundError("Session not found");
    }

    // If summary not generated yet, generate synchronously
    if (session.resultStatus !== ResultStatus.READY) {
      await this.generateSummary(sessionId);
      const updated = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          sessionQuestions: {
            orderBy: { index: "asc" },
            include: { answer: true },
          },
        },
      });
      return this.formatSessionResult(updated!);
    }

    return this.formatSessionResult(session);
  }

  private formatSessionResult(session: any) {
    const criteriaScores = session.criteriaScores as {
      relevance: number;
      correctness: number;
      clarity: number;
      completeness: number;
    } || {
      relevance: 0,
      correctness: 0,
      clarity: 0,
      completeness: 0,
    };

    return {
      resultStatus: session.resultStatus,
      overallScore: session.overallScore || 0,
      criteriaAverages: criteriaScores,
      strengths: (session.strengths as string[]) || [],
      weakAreas: (session.weakAreas as string[]) || [],
      suggestions: (session.suggestions as string[]) || [],
      questions: session.sessionQuestions.map((q: any) => ({
        index: q.index + 1,
        text: q.questionText,
        answerText: q.answer?.answerText || null,
        skipped: q.answer?.skipped || false,
        scores: q.answer?.overall !== null && q.answer?.overall !== undefined
          ? {
              relevance: q.answer.relevance || 0,
              correctness: q.answer.correctness || 0,
              clarity: q.answer.clarity || 0,
              completeness: q.answer.completeness || 0,
              overall: q.answer.overall || 0,
            }
          : null,
        feedback: q.answer?.feedback || null,
        sampleAnswer: q.answer?.sampleAnswer || null,
      })),
    };
  }
}

export const interviewService = new InterviewService();

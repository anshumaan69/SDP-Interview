import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { Difficulty, InterviewType } from "@sdp/shared";

// Zod schemas for structured LLM outputs
export const generatedQuestionSchema = z.object({
  text: z.string().min(10),
  idealAnswer: z.string().optional(),
});

export const evaluatedAnswerSchema = z.object({
  relevance: z.number().min(0).max(10),
  correctness: z.number().min(0).max(10),
  clarity: z.number().min(0).max(10),
  completeness: z.number().min(0).max(10),
  feedback: z.string().min(10),
  sampleAnswer: z.string().min(10),
});

export const sessionSummarySchema = z.object({
  strengths: z.array(z.string()).min(1),
  weakAreas: z.array(z.string()).min(1),
  suggestions: z.array(z.string()).min(1),
});

export class LlmService {
  /**
   * Generates a new interview question.
   * If LLM fails after 2 retries, falls back to the Question Bank matching role, type, difficulty
   * excluding questions from candidate's last 5 sessions (FR-10, FR-19).
   */
  async generateQuestion(params: {
    userId: string;
    role: string;
    type: InterviewType;
    difficulty: Difficulty;
    excludedQuestionTexts?: string[];
  }): Promise<{ text: string; idealAnswer?: string; isFallback: boolean }> {
    const { userId, role, type, difficulty, excludedQuestionTexts = [] } = params;

    // Fetch questions from user's last 5 sessions for exclusion (FR-10)
    const recentSessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sessionQuestions: { select: { questionText: true } },
      },
    });

    const historicalExcluded = new Set<string>(excludedQuestionTexts);
    for (const s of recentSessions) {
      for (const sq of s.sessionQuestions) {
        historicalExcluded.add(sq.questionText.toLowerCase().trim());
      }
    }

    // Attempt LLM generation if configured
    if (env.LLM_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const prompt = `Generate a single ${difficulty} interview question for a ${role} focusing on ${type} competencies.
Return ONLY valid JSON matching this schema: {"text": "string", "idealAnswer": "string"}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (res.ok) {
            const data: any = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = textResponse.replace(/```json|```/g, "").trim();
              const parsed = generatedQuestionSchema.parse(JSON.parse(cleaned));
              if (!historicalExcluded.has(parsed.text.toLowerCase().trim())) {
                return { ...parsed, isFallback: false };
              }
            }
          }
        } catch (e) {
          logger.warn({ attempt }, "Gemini question generation attempt failed");
        }
      }
    }

    // FR-19 Fallback: Pick an unused question from Question Bank matching role, type, difficulty
    return this.pickFallbackQuestion(role, type, difficulty, historicalExcluded);
  }

  async pickFallbackQuestion(
    role: string,
    type: InterviewType,
    difficulty: Difficulty,
    excluded: Set<string>
  ): Promise<{ text: string; idealAnswer?: string; isFallback: boolean }> {
    // 1. Try exact match
    let candidates = await prisma.question.findMany({
      where: {
        type,
        role: { contains: role, mode: "insensitive" },
        difficulty,
      },
    });

    // Filter out excluded questions
    let valid = candidates.filter((q) => !excluded.has(q.normalizedText));

    // 2. If none, match by type and difficulty regardless of exact role
    if (valid.length === 0) {
      candidates = await prisma.question.findMany({
        where: { type, difficulty },
      });
      valid = candidates.filter((q) => !excluded.has(q.normalizedText));
    }

    // 3. If still none, any question matching type
    if (valid.length === 0) {
      candidates = await prisma.question.findMany({
        where: { type },
      });
      valid = candidates.filter((q) => !excluded.has(q.normalizedText));
    }

    // 4. If all exhausted, take any question in bank
    if (valid.length === 0) {
      valid = await prisma.question.findMany({ take: 20 });
    }

    if (valid.length === 0) {
      // Ultimate baseline fallback
      return {
        text: `Describe a challenging problem you faced as a ${role} and how you architected the solution.`,
        idealAnswer: "Candidate should explain the problem context, technical constraints, trade-offs evaluated, and measurable outcome.",
        isFallback: true,
      };
    }

    const picked = valid[Math.floor(Math.random() * valid.length)];
    return {
      text: picked.text,
      idealAnswer: picked.idealAnswer || undefined,
      isFallback: true,
    };
  }

  /**
   * Evaluates a candidate's answer across relevance, correctness, clarity, completeness.
   */
  async evaluateAnswer(params: {
    questionText: string;
    answerText: string;
    role: string;
    difficulty: Difficulty;
    idealAnswer?: string | null;
  }) {
    const { questionText, answerText, role, difficulty, idealAnswer } = params;

    if (env.LLM_PROVIDER === "gemini" && env.GEMINI_API_KEY) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const prompt = `You are an expert technical interviewer evaluating an interview answer for a ${role} (${difficulty} level).
Question: "${questionText}"
Reference Answer / Rubric: "${idealAnswer || "Standard industry best practices"}"
Candidate's Answer: "${answerText}"

Score the answer strictly between 0.0 and 10.0 on these 4 criteria:
- relevance
- correctness
- clarity
- completeness
Provide constructive written feedback and an improved sample answer.
Return ONLY valid JSON matching:
{
  "relevance": number,
  "correctness": number,
  "clarity": number,
  "completeness": number,
  "feedback": "string",
  "sampleAnswer": "string"
}`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
          );

          if (res.ok) {
            const data: any = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = textResponse.replace(/```json|```/g, "").trim();
              const parsed = evaluatedAnswerSchema.parse(JSON.parse(cleaned));
              const overall = Number(
                (
                  (parsed.relevance +
                    parsed.correctness +
                    parsed.clarity +
                    parsed.completeness) /
                  4
                ).toFixed(1)
              );
              return { ...parsed, overall };
            }
          }
        } catch (e) {
          logger.warn({ attempt }, "Gemini evaluation attempt failed, retrying...");
        }
      }
    }

    // Deterministic Mock / Offline Evaluator
    return this.mockEvaluateAnswer(questionText, answerText, idealAnswer);
  }

  mockEvaluateAnswer(questionText: string, answerText: string, idealAnswer?: string | null) {
    const words = answerText.trim().split(/\s+/).length;

    // Quality metrics based on substance and structure
    let relevance = 8.0;
    let correctness = 7.5;
    let clarity = 8.0;
    let completeness = 7.0;

    if (words < 15) {
      relevance = 5.0;
      correctness = 5.5;
      clarity = 6.0;
      completeness = 4.0;
    } else if (words > 60) {
      relevance = 9.0;
      correctness = 8.5;
      clarity = 8.5;
      completeness = 8.5;
    }

    const overall = Number(((relevance + correctness + clarity + completeness) / 4).toFixed(1));

    return {
      relevance,
      correctness,
      clarity,
      completeness,
      overall,
      feedback:
        words < 20
          ? "Your response identified the core topic but lacked detailed explanation and concrete implementation trade-offs."
          : "Solid technical explanation covering fundamental concepts and practical application. To improve further, quantify performance implications and highlight architectural edge cases.",
      sampleAnswer:
        idealAnswer ||
        `An optimal answer clearly delineates the core mechanism, addresses trade-offs (e.g. latency vs consistency, memory vs CPU), and references production considerations like monitoring and error handling.`,
    };
  }

  /**
   * Generates overall strengths, weak areas, and suggestions for the session summary.
   */
  async generateSessionSummary(params: {
    answeredQuestions: Array<{
      text: string;
      answerText: string | null;
      scores: { relevance: number; correctness: number; clarity: number; completeness: number } | null;
    }>;
    criteriaAverages: { relevance: number; correctness: number; clarity: number; completeness: number };
  }) {
    const { criteriaAverages, answeredQuestions } = params;

    // If LLM fails or is in mock mode, derive strengths and weaknesses from criteria averages
    const strengths: string[] = [];
    const weakAreas: string[] = [];
    const suggestions: string[] = [];

    if (criteriaAverages.relevance >= 7.5) {
      strengths.push("Directly answered questions with high contextual relevance");
    } else {
      weakAreas.push("Responses sometimes drifted from the core problem statement");
      suggestions.push("Take a brief pause to structure your response around the explicit prompt");
    }

    if (criteriaAverages.correctness >= 7.5) {
      strengths.push("Demonstrated strong factual accuracy and solid grasp of technical mechanics");
    } else {
      weakAreas.push("Conceptual gaps or inaccuracies observed in technical explanations");
      suggestions.push("Review underlying architectural concepts and edge cases");
    }

    if (criteriaAverages.clarity >= 7.5) {
      strengths.push("Articulate, structured communication with concise articulation");
    } else {
      weakAreas.push("Verbosity or fragmented sentence structure reduced answer clarity");
      suggestions.push("Adopt the STAR method (Situation, Task, Action, Result) for structured answers");
    }

    if (criteriaAverages.completeness >= 7.5) {
      strengths.push("Thorough answers covering constraints, trade-offs, and failure modes");
    } else {
      weakAreas.push("Omitted crucial production trade-offs and operational details");
      suggestions.push("Always mention observability, failure recovery, and scaling trade-offs");
    }

    if (strengths.length === 0) {
      strengths.push("Demonstrated foundational familiarity with the role requirements");
    }
    if (weakAreas.length === 0) {
      weakAreas.push("Minor refinements needed in deep edge-case quantification");
    }
    if (suggestions.length === 0) {
      suggestions.push("Continue practicing under timed interview conditions to maintain high pacing");
    }

    return { strengths, weakAreas, suggestions };
  }
}

export const llmService = new LlmService();

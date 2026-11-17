import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { rateLimiter } from "../middleware/rateLimiter";
import { interviewService } from "../services/interview/interviewService";
import {
  createSessionSchema,
  skipQuestionSchema,
  submitAnswerSchema,
} from "@sdp/shared";
import { Role } from "@prisma/client";

const router = Router();

// Protect all session routes with CANDIDATE or ADMIN auth
router.use(auth);

// Rate limits: 60/hour/user on AI-backed generation and answer endpoints
const aiRateLimit = rateLimiter({
  windowSeconds: 3600,
  maxRequests: 60,
  keyPrefix: "ai_hourly",
});

router.post(
  "/",
  aiRateLimit,
  validate(createSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.createSession(req.user!.id, req.body);
      return res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await interviewService.getResumableSessions(req.user!.id);
    return res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await interviewService.getSession(req.user!.id, req.params.id);
    return res.status(200).json({ data: session });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/answers",
  aiRateLimit,
  validate(submitAnswerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
      const result = await interviewService.submitAnswer(
        req.user!.id,
        req.params.id,
        req.body,
        idempotencyKey
      );
      return res.status(202).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id/answers/:answerId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.getAnswerEvaluation(
        req.user!.id,
        req.params.id,
        req.params.answerId
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/skip",
  validate(skipQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.skipQuestion(
        req.user!.id,
        req.params.id,
        req.body.questionId
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/pause",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.pauseSession(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/resume",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.resumeSession(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/end",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.endSession(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id/result",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.getSessionResult(req.user!.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

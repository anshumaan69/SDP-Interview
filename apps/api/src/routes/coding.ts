import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { codingService } from "../services/coding/codingService";
import {
  codingProblemsQuerySchema,
  runCodeSchema,
  submitCodeSchema,
} from "@sdp/shared";

const router = Router();

// Protect all coding routes with authentication
router.use(auth);

// 1. Get Topic summaries with problem counts by difficulty
router.get("/topics", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = await codingService.getTopics();
    return res.status(200).json({ data: topics });
  } catch (err) {
    next(err);
  }
});

// 2. Get Problems with solved status
router.get("/problems", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = req.query.topic as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await codingService.getProblems(req.user!.id, {
      topic,
      difficulty,
      page,
      limit,
    });

    return res.status(200).json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
});

// 3. Get Random Problem (prefers unsolved)
router.get("/problems/random", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = req.query.topic as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;

    const problem = await codingService.getRandomProblem(req.user!.id, topic, difficulty);
    return res.status(200).json({ data: problem });
  } catch (err) {
    next(err);
  }
});

// 4. Get Problem by ID or Slug
router.get("/problems/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await codingService.getProblemById(req.params.id, req.user!.id);
    return res.status(200).json({ data: problem });
  } catch (err) {
    next(err);
  }
});

// 5. Run code against visible test cases or custom input
router.post(
  "/problems/:id/run",
  validate(runCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await codingService.runCode(req.user!.id, req.params.id, req.body);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// 6. Submit code against all test cases (with idempotency support)
router.post(
  "/problems/:id/submit",
  validate(submitCodeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = (req.headers["idempotency-key"] ||
        req.headers["x-idempotency-key"]) as string | undefined;

      const attempt = await codingService.submitCode(
        req.user!.id,
        req.params.id,
        req.body,
        idempotencyKey
      );

      return res.status(200).json({ data: attempt });
    } catch (err) {
      next(err);
    }
  }
);

// 7. Get attempt by ID
router.get("/attempts/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user?.role === "ADMIN";
    const attempt = await codingService.getAttempt(req.params.id, req.user!.id, isAdmin);
    return res.status(200).json({ data: attempt });
  } catch (err) {
    next(err);
  }
});

// 8. Get user's attempts
router.get("/attempts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problemId = req.query.problemId as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await codingService.getAttempts(req.user!.id, {
      problemId,
      page,
      limit,
    });

    return res.status(200).json({ data: result.items, meta: result.meta });
  } catch (err) {
    next(err);
  }
});

export default router;

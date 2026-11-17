import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { dashboardService } from "../services/dashboard/dashboardService";
import { interviewService } from "../services/interview/interviewService";
import { historyQuerySchema } from "@sdp/shared";

const router = Router();
router.use(auth);

router.get(
  "/",
  validate(historyQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, meta } = await dashboardService.getHistory({
        userId: req.user!.id,
        from: req.query.from as string,
        to: req.query.to as string,
        type: req.query.type as string,
        role: req.query.role as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      return res.status(200).json({ data: items, meta });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:sessionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.getSessionResult(
        req.user!.id,
        req.params.sessionId
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

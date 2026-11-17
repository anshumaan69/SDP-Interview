import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { dashboardService } from "../services/dashboard/dashboardService";
import {
  dashboardQuerySchema,
  dashboardTrendQuerySchema,
} from "@sdp/shared";

const router = Router();
router.use(auth);

router.get(
  "/summary",
  validate(dashboardQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getSummary(
        req.user!.id,
        req.query.from as string,
        req.query.to as string
      );
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/trend",
  validate(dashboardTrendQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getTrend(
        req.user!.id,
        req.query.from as string,
        req.query.to as string,
        (req.query.granularity as "day" | "week") || "day"
      );
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/categories",
  validate(dashboardQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await dashboardService.getCategories(
        req.user!.id,
        req.query.from as string,
        req.query.to as string
      );
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

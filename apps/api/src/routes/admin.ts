import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { auth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validate } from "../middleware/validate";
import { adminService } from "../services/admin/adminService";
import {
  adminQuestionsQuerySchema,
  adminUsersQuerySchema,
  auditLogsQuerySchema,
  createQuestionSchema,
  updateQuestionSchema,
  updateUserStatusSchema,
} from "@sdp/shared";
import { Role } from "@prisma/client";

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  storage: multer.memoryStorage(),
});

const router = Router();

// Protect all admin endpoints with AUTH and ADMIN role
router.use(auth, requireRole(Role.ADMIN));

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.getStats();
    return res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/questions",
  validate(adminQuestionsQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, meta } = await adminService.getQuestions({
        q: req.query.q as string,
        type: req.query.type as string,
        role: req.query.role as string,
        difficulty: req.query.difficulty as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      return res.status(200).json({ data: items, meta });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/questions",
  validate(createQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      const data = await adminService.createQuestion(req.body, req.user!.id, ip);
      return res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/questions/:id",
  validate(updateQuestionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      const data = await adminService.updateQuestion(req.params.id, req.body, req.user!.id, ip);
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/questions/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      await adminService.deleteQuestion(req.params.id, req.user!.id, ip);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.get("/questions/bulk/template", (req: Request, res: Response) => {
  const csvTemplate = `text,type,role,difficulty,idealAnswer\n"Explain the difference between optimistic and pessimistic locking.",TECHNICAL,"Backend Engineer",MEDIUM,"Optimistic locking assumes conflicts are rare and uses version numbers..."\n"Describe a difficult conflict with a teammate and how you resolved it.",BEHAVIOURAL,"Software Engineer",EASY,"I scheduled a 1-on-1 discussion to understand their perspective..."`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="question_template.csv"');
  return res.status(200).send(csvTemplate);
});

router.post(
  "/questions/bulk",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: "INVALID_CSV",
            message: "CSV file is required",
          },
        });
      }
      const csvContent = req.file.buffer.toString("utf-8");
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      const result = await adminService.bulkUploadQuestions(csvContent, req.user!.id, ip);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/users",
  validate(adminUsersQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, meta } = await adminService.getUsers({
        q: req.query.q as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      return res.status(200).json({ data: items, meta });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      const data = await adminService.updateUserStatus(
        req.params.id,
        req.body.status,
        req.user!.id,
        ip
      );
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/users/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      await adminService.deleteUser(req.params.id, req.user!.id, ip);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/audit-logs",
  validate(auditLogsQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { items, meta } = await adminService.getAuditLogs({
        event: req.query.event as string,
        userId: req.query.userId as string,
        from: req.query.from as string,
        to: req.query.to as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      return res.status(200).json({ data: items, meta });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

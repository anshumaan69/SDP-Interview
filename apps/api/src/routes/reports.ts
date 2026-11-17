import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { pdfReportService } from "../services/report/pdfReportService";
import { generateReportSchema } from "@sdp/shared";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(auth);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await prisma.report.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return res.status(200).json({ data: list });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  validate(generateReportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pdfReportService.queueReport(
        req.user!.id,
        req.body.from,
        req.body.to
      );
      return res.status(202).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await pdfReportService.getReport(req.params.id, req.user!.id);
    return res.status(200).json({
      data: {
        id: report.id,
        status: report.status,
        downloadUrl: report.downloadUrl,
        createdAt: report.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id/download",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stream = await pdfReportService.getReportStream(
        req.params.id,
        req.user!.id
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Interview_Report_${req.params.id.substring(0, 8)}.pdf"`
      );
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

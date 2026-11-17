import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { ReportStatus } from "@sdp/shared";

const REPORTS_DIR = path.resolve(process.cwd(), "reports/generated");

export class PdfReportService {
  constructor() {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  }

  async queueReport(userId: string, from?: string, to?: string) {
    const where: any = { userId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const sessionCount = await prisma.session.count({ where });
    if (sessionCount === 0) {
      throw new ValidationError("No session data available in the selected period", [
        { field: "period", issue: "NO_DATA" },
      ]);
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    const report = await prisma.report.create({
      data: {
        userId,
        status: ReportStatus.QUEUED,
        fromDate: from ? new Date(from) : null,
        toDate: to ? new Date(to) : null,
        expiresAt,
      },
    });

    // Execute generation asynchronously
    this.generatePdf(report.id).catch((err) => {
      console.error("PDF generation failed:", err);
    });

    return {
      reportId: report.id,
      status: ReportStatus.QUEUED,
    };
  }

  async generatePdf(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report || !report.user) return;

    try {
      const where: any = { userId: report.userId };
      if (report.fromDate || report.toDate) {
        where.createdAt = {};
        if (report.fromDate) where.createdAt.gte = report.fromDate;
        if (report.toDate) where.createdAt.lte = report.toDate;
      }

      const sessions = await prisma.session.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          sessionQuestions: {
            include: { answer: true },
          },
        },
      });

      const fileName = `report_${report.id}.pdf`;
      const filePath = path.join(REPORTS_DIR, fileName);

      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(22).font("Helvetica-Bold").text("InterviewAI Readiness Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").text(`Candidate: ${report.user.name} (${report.user.email})`, { align: "center" });
      doc.text(`Generated on: ${new Date().toUTCString()}`, { align: "center" });
      doc.moveDown(1.5);

      // Executive Summary
      const scores = sessions.map((s) => s.overallScore).filter((s): s is number => s !== null);
      const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "N/A";
      const bestScore = scores.length > 0 ? Math.max(...scores).toFixed(1) : "N/A";

      doc.fontSize(14).font("Helvetica-Bold").text("Executive Summary");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.text(`Total Sessions Analyzed: ${sessions.length}`);
      doc.text(`Overall Average Score: ${avgScore} / 10`);
      doc.text(`Highest Score Achieved: ${bestScore} / 10`);
      doc.moveDown(1.5);

      // Session Highlights
      doc.fontSize(14).font("Helvetica-Bold").text("Session History & Detailed Feedback");
      doc.moveDown(0.5);

      for (let i = 0; i < Math.min(sessions.length, 5); i++) {
        const s = sessions[i];
        doc.fontSize(11).font("Helvetica-Bold").text(
          `${i + 1}. ${s.role} - ${s.type} (${s.difficulty}) | Score: ${s.overallScore || 0}/10`
        );
        doc.fontSize(9).font("Helvetica").text(`Date: ${s.createdAt.toISOString().split("T")[0]} | Status: ${s.status}`);
        
        if (s.strengths && Array.isArray(s.strengths)) {
          doc.text(`Strengths: ${(s.strengths as string[]).slice(0, 2).join("; ")}`);
        }
        if (s.weakAreas && Array.isArray(s.weakAreas)) {
          doc.text(`Areas for Growth: ${(s.weakAreas as string[]).slice(0, 2).join("; ")}`);
        }
        doc.moveDown(1);
      }

      // Footer disclaimer
      doc.moveDown(2);
      doc.fontSize(8).fillColor("grey").text(
        "Disclaimer: This report is generated algorithmically for practice purposes. Evaluated via automated interview rubrics.",
        { align: "center" }
      );

      doc.end();

      await new Promise<void>((resolve, reject) => {
        stream.on("finish", () => resolve());
        stream.on("error", (e) => reject(e));
      });

      await prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.READY,
          filePath,
          downloadUrl: `/api/v1/reports/${reportId}/download`,
        },
      });
    } catch (e) {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.FAILED },
      });
    }
  }

  async getReport(reportId: string, userId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report || report.userId !== userId) {
      throw new NotFoundError("Report not found");
    }
    return report;
  }

  async getReportStream(reportId: string, userId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report || report.userId !== userId) {
      throw new NotFoundError("Report not found");
    }

    if (report.status !== ReportStatus.READY || !report.filePath || !fs.existsSync(report.filePath)) {
      throw new NotFoundError("Report PDF is not ready or has expired");
    }

    return fs.createReadStream(report.filePath);
  }
}

export const pdfReportService = new PdfReportService();

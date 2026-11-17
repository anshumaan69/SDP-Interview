import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  sendEmail(options: SendEmailOptions): Promise<void>;
}

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (env.NODE_ENV === "test" || !this.transporter) {
      logger.info(
        {
          to: options.to,
          subject: options.subject,
          previewText: options.text,
        },
        "Email logged to console (Mock/Dev Provider)"
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      logger.error({ error, to: options.to }, "Failed to send email via SMTP");
      throw error;
    }
  }
}

export const emailProvider = new NodemailerEmailProvider();

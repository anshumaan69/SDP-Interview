import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 4001,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5435/sdp_interview?schema=public",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6385",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev_sdp_access_secret_key_1234567890",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev_sdp_refresh_secret_key_1234567890",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  LLM_PROVIDER: process.env.LLM_PROVIDER || "mock",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.ethereal.email",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@ai-interview-prep.com",
  JUDGE0_URL: process.env.JUDGE0_URL || "http://localhost:2358",
};

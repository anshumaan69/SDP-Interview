import { z } from "zod";
import {
  CodingLanguage,
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  Role,
  SessionStatus,
  UserStatus,
} from "./enums";

// Base / Helpers
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Phase 1: Auth & Profile Schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: passwordSchema,
  targetRole: z.string().min(2).max(100),
  experienceLevel: z.enum([
    ExperienceLevel.FRESHER,
    ExperienceLevel.ZERO_TO_ONE,
    ExperienceLevel.ONE_TO_THREE,
  ]),
});

export const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export const resendOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  targetRole: z.string().min(2).max(100).optional(),
  experienceLevel: z
    .enum([
      ExperienceLevel.FRESHER,
      ExperienceLevel.ZERO_TO_ONE,
      ExperienceLevel.ONE_TO_THREE,
    ])
    .optional(),
  skills: z.array(z.string().min(1).max(50)).max(30).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

// Phase 2: Admin & Question Bank Schemas
export const createQuestionSchema = z.object({
  text: z.string().min(10, "Question must be at least 10 characters").max(2000),
  type: z.enum([
    InterviewType.HR,
    InterviewType.TECHNICAL,
    InterviewType.BEHAVIOURAL,
    InterviewType.MIXED,
  ]),
  role: z.string().min(2).max(100),
  difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]),
  idealAnswer: z.string().max(4000).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const adminQuestionsQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  type: z.string().optional(),
  role: z.string().optional(),
  difficulty: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED]),
});

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  status: z.string().optional(),
});

export const auditLogsQuerySchema = paginationQuerySchema.extend({
  event: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// Phase 3: Mock Interview Schemas
export const createSessionSchema = z.object({
  role: z.string().min(2).max(100),
  type: z.enum([
    InterviewType.HR,
    InterviewType.TECHNICAL,
    InterviewType.BEHAVIOURAL,
    InterviewType.MIXED,
  ]),
  difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]),
  questionCount: z.coerce.number().int().min(5).max(20).default(5),
  timerSeconds: z.coerce.number().int().min(30).max(600).nullable().optional(),
  mode: z.enum([InterviewMode.TEXT, InterviewMode.VOICE]).default(InterviewMode.TEXT),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  answerText: z
    .string()
    .min(1, "Answer cannot be empty")
    .max(2000, "Answer cannot exceed 2000 characters"),
  timeTakenSeconds: z.coerce.number().int().min(0).default(0),
});

export const skipQuestionSchema = z.object({
  questionId: z.string().uuid(),
});

// Phase 4: Dashboard, History, Reports Schemas
export const dashboardQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const dashboardTrendQuerySchema = dashboardQuerySchema.extend({
  granularity: z.enum(["day", "week"]).default("day"),
});

export const historyQuerySchema = paginationQuerySchema.extend({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.string().optional(),
  role: z.string().optional(),
});

export const generateReportSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// Phase 5: Coding Practice Schemas
export const codingProblemsQuerySchema = paginationQuerySchema.extend({
  topic: z.string().optional(),
  difficulty: z.string().optional(),
});

export const runCodeSchema = z.object({
  language: z.enum([CodingLanguage.PYTHON, CodingLanguage.JAVA, CodingLanguage.CPP]),
  code: z.string().min(1, "Code cannot be empty").max(65536, "Code cannot exceed 64 KB"),
  customInput: z.string().max(10000).optional(),
});

export const submitCodeSchema = z.object({
  language: z.enum([CodingLanguage.PYTHON, CodingLanguage.JAVA, CodingLanguage.CPP]),
  code: z.string().min(1, "Code cannot be empty").max(65536, "Code cannot exceed 64 KB"),
});

// Types derived from Zod schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SkipQuestionInput = z.infer<typeof skipQuestionSchema>;

export type RunCodeInput = z.infer<typeof runCodeSchema>;
export type SubmitCodeInput = z.infer<typeof submitCodeSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

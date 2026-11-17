export const ExperienceLevel = {
  FRESHER: "FRESHER",
  ZERO_TO_ONE: "0_1_YEARS",
  ONE_TO_THREE: "1_3_YEARS",
} as const;

export type ExperienceLevel = (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

export const InterviewType = {
  HR: "HR",
  TECHNICAL: "TECHNICAL",
  BEHAVIOURAL: "BEHAVIOURAL",
  MIXED: "MIXED",
} as const;

export type InterviewType = (typeof InterviewType)[keyof typeof InterviewType];

export const Difficulty = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const SessionStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  ENDED_EARLY: "ENDED_EARLY",
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const EvalStatus = {
  PENDING: "PENDING",
  DONE: "DONE",
  FAILED: "FAILED",
} as const;

export type EvalStatus = (typeof EvalStatus)[keyof typeof EvalStatus];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Role = {
  CANDIDATE: "CANDIDATE",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const CodingVerdict = {
  PASSED: "PASSED",
  WRONG_ANSWER: "WRONG_ANSWER",
  TLE: "TLE",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  COMPILE_ERROR: "COMPILE_ERROR",
} as const;

export type CodingVerdict = (typeof CodingVerdict)[keyof typeof CodingVerdict];

export const CodingLanguage = {
  PYTHON: "python",
  JAVA: "java",
  CPP: "cpp",
} as const;

export type CodingLanguage = (typeof CodingLanguage)[keyof typeof CodingLanguage];

export const ReportStatus = {
  QUEUED: "QUEUED",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ResultStatus = {
  GENERATING: "GENERATING",
  READY: "READY",
} as const;

export type ResultStatus = (typeof ResultStatus)[keyof typeof ResultStatus];

export const InterviewMode = {
  TEXT: "TEXT",
  VOICE: "VOICE",
} as const;

export type InterviewMode = (typeof InterviewMode)[keyof typeof InterviewMode];

import {
  CodingLanguage,
  CodingVerdict,
  Difficulty,
  EvalStatus,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  ReportStatus,
  ResultStatus,
  Role,
  SessionStatus,
  UserStatus,
} from "./enums";

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  skills: string[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface QuestionDto {
  id: string;
  index?: number;
  text: string;
  type: InterviewType;
  role: string;
  difficulty: Difficulty;
  idealAnswer?: string | null;
}

export interface EvaluationScores {
  relevance: number;
  correctness: number;
  clarity: number;
  completeness: number;
  overall: number;
}

export interface AnswerEvaluationResult {
  evalStatus: EvalStatus;
  scores: EvaluationScores;
  feedback: string;
  sampleAnswer: string;
  nextDifficulty: Difficulty;
  nextQuestion: QuestionDto | null;
  isLast: boolean;
}

export interface SessionResultDto {
  resultStatus: ResultStatus;
  overallScore: number;
  criteriaAverages: {
    relevance: number;
    correctness: number;
    clarity: number;
    completeness: number;
  };
  strengths: string[];
  weakAreas: string[];
  suggestions: string[];
  questions: Array<{
    index: number;
    text: string;
    answerText: string | null;
    skipped: boolean;
    scores: EvaluationScores | null;
    feedback: string | null;
    sampleAnswer: string | null;
  }>;
}

export interface CodingTestCaseSample {
  input: string;
  output: string;
}

export interface CodingProblemDto {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  statement: string;
  constraints: string;
  samples: CodingTestCaseSample[];
  starterCode: {
    python: string;
    java: string;
    cpp: string;
  };
  solved?: boolean;
}

export interface CodingTestCaseResult {
  caseNo: number;
  visible: boolean;
  verdict: CodingVerdict;
  runtimeMs: number;
  expected?: string;
  actual?: string;
  stderr?: string;
}

export interface CodingAttemptDto {
  id: string;
  status: "QUEUED" | "RUNNING" | "DONE";
  passedCount: number;
  total: number;
  compileError?: string | null;
  results: CodingTestCaseResult[];
}

export interface MetaOptionsDto {
  roles: string[];
  types: InterviewType[];
  difficulties: Difficulty[];
  experienceLevels: ExperienceLevel[];
  codingTopics: string[];
}

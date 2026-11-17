import { ApiErrorDetail } from "@sdp/shared";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: ApiErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ApiErrorDetail[]) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHENTICATED") {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", code = "FORBIDDEN") {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists or conflicts", code = "CONFLICT") {
    super(409, code, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", retryAfterSeconds?: number) {
    super(429, "RATE_LIMITED", message);
    if (retryAfterSeconds) {
      this.details = [{ field: "retryAfterSeconds", issue: String(retryAfterSeconds) }];
    }
  }
}

export class AiUnavailableError extends AppError {
  constructor(message = "AI service is currently unavailable", code = "503 AI_UNAVAILABLE") {
    super(503, "AI_UNAVAILABLE", message);
  }
}

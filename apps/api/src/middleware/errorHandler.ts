import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const reqId = req.headers["x-request-id"];

  if (err instanceof AppError) {
    logger.warn(
      {
        reqId,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      },
      "Application Error Handled"
    );

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      issue: e.message,
    }));

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details,
      },
    });
  }

  // Handle JSON parse errors from body-parser
  if ("type" in err && (err as { type: string }).type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Malformed JSON payload",
      },
    });
  }

  logger.error(
    {
      reqId,
      err: err.message,
      stack: err.stack,
    },
    "Unhandled Internal Server Error"
  );

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    },
  });
}

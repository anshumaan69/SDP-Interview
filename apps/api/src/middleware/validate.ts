import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

type Target = "body" | "query" | "params";

export function validate(schema: AnyZodObject, target: Target = "body") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: error.errors.map((err) => ({
              field: err.path.join("."),
              issue: err.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import { Role } from "@prisma/client";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required", "UNAUTHENTICATED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Access forbidden: Insufficient permissions", "FORBIDDEN"));
    }

    next();
  };
}

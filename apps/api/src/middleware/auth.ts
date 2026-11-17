import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authorization header missing or invalid", "UNAUTHENTICATED"));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(new UnauthorizedError("Token missing", "UNAUTHENTICATED"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        status: true,
        markedForDeletionAt: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError("User no longer exists", "UNAUTHENTICATED"));
    }

    if (user.status === "BLOCKED") {
      return next(new ForbiddenError("Account is blocked. Contact support.", "ACCOUNT_BLOCKED"));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError("Token has expired", "UNAUTHENTICATED"));
    }
    return next(new UnauthorizedError("Invalid or corrupted token", "UNAUTHENTICATED"));
  }
}

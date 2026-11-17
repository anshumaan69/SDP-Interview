import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/auth/authService";
import { validate } from "../middleware/validate";
import { rateLimiter } from "../middleware/rateLimiter";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "@sdp/shared";
import { env } from "../config/env";

const router = Router();

const authRateLimit = rateLimiter({
  windowSeconds: 60,
  maxRequests: 10,
  keyPrefix: "auth",
});

router.post(
  "/register",
  authRateLimit,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.register(req.body);
      return res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/verify-otp",
  authRateLimit,
  validate(verifyOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.verifyOtp(req.body);
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/resend-otp",
  authRateLimit,
  validate(resendOtpSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.resendOtp(req.body.email);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  authRateLimit,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      const result = await authService.login(req.body, ip);

      res.cookie("refreshToken", result.refreshTokenPlain, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60 * 1000, // 30 min sliding window
      });

      return res.status(200).json({
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const result = await authService.refresh(refreshToken);

      res.cookie("refreshToken", result.newRefreshPlain, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60 * 1000,
      });

      return res.status(200).json({
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await authService.logout(refreshToken);
      res.clearCookie("refreshToken");
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/forgot-password",
  authRateLimit,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.forgotPassword(req.body.email);
      // Enumeration-safe 202
      return res.status(202).json({
        data: {
          message: "If the email is registered, a password reset link has been sent.",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/reset-password",
  authRateLimit,
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || (req.headers["x-forwarded-for"] as string);
      await authService.resetPassword(req.body, ip);
      res.clearCookie("refreshToken");
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;

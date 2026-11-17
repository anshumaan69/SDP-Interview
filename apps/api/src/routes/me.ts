import { Router, Request, Response, NextFunction } from "express";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { authService } from "../services/auth/authService";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "@sdp/shared";

const router = Router();

router.use(auth);

router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    return res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/me",
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await authService.updateProfile(req.user!.id, req.body);
      return res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/me/password",
  validate(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(req.user!.id, req.body);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/me",
  validate(deleteAccountSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.deleteAccount(req.user!.id, req.body);
      res.clearCookie("refreshToken");
      return res.status(202).json({
        data: {
          message: "Account scheduled for deletion in 30 days. Log in before then to reactivate.",
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

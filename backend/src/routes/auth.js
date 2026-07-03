// backend/src/routes/auth.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate, authSchemas } from "../validators/index.js";
import {
  authLimiter,
  createAccountLimiter,
  otpLimiter,
} from "../middlewares/rateLimiter.js";
import {
  registerCalonJamaah,
  login,
  verifyOTPLogin,
  requestOTP,
  getCurrentUser,
  requestPasswordChangeOTP,
  changePasswordWithOTP,
  requestEmailChangeOTP,
  changeEmailWithOTP,
  logout,
  requestForgotPasswordOTP,
  resetPasswordWithOTP,
  startGoogleOAuth,
  handleGoogleOAuthCallback,
} from "../controllers/authController.js";

const router = express.Router();

// Public auth routes
router.post(
  "/register/calon-jamaah",
  createAccountLimiter,
  validate(authSchemas.registerCalonJamaah),
  registerCalonJamaah,
);
router.post("/login", authLimiter, validate(authSchemas.login), login);
router.get("/google", authLimiter, startGoogleOAuth);
router.get("/google/callback", authLimiter, handleGoogleOAuthCallback);
router.post(
  "/verify-otp",
  otpLimiter,
  validate(authSchemas.verifyOTP),
  verifyOTPLogin,
);
router.post(
  "/request-otp",
  otpLimiter,
  validate(authSchemas.requestOTP),
  requestOTP,
);
router.post(
  "/forgot-password/request-otp",
  otpLimiter,
  validate(authSchemas.forgotPassword),
  requestForgotPasswordOTP,
);
router.post(
  "/forgot-password/reset",
  otpLimiter,
  validate(authSchemas.resetPassword),
  resetPasswordWithOTP,
);
if (process.env.NODE_ENV !== "production") {
  router.get("/test-public", (req, res) =>
    res.json({ message: "Public route works" }),
  );
}
router.get("/me", authenticate, getCurrentUser);
router.post(
  "/password/request-otp",
  authenticate,
  authLimiter,
  requestPasswordChangeOTP,
);
router.post(
  "/password/change",
  authenticate,
  otpLimiter,
  validate(authSchemas.changePassword),
  changePasswordWithOTP,
);
router.post(
  "/email/request-otp",
  authenticate,
  authLimiter,
  requestEmailChangeOTP,
);
router.post(
  "/email/change",
  authenticate,
  otpLimiter,
  validate(authSchemas.changeEmail),
  changeEmailWithOTP,
);
router.post("/logout", authenticate, logout);

export default router;

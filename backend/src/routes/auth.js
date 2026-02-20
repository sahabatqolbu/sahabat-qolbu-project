// backend/src/routes/auth.js
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate, authSchemas } from "../validators/index.js";
import { authLimiter, otpLimiter } from "../middlewares/rateLimiter.js";
import {
    login,
    verifyOTPLogin,
    requestOTP,
    getCurrentUser,
    requestPasswordChangeOTP,
    changePasswordWithOTP,
    requestEmailChangeOTP,
    changeEmailWithOTP,
    logout,
} from "../controllers/authController.js";

const router = express.Router();

// Public auth routes
router.post("/login", authLimiter, validate(authSchemas.login), login);
router.post("/verify-otp", otpLimiter, validate(authSchemas.verifyOTP), verifyOTPLogin);
router.post("/request-otp", authLimiter, validate(authSchemas.requestOTP), requestOTP);
if (process.env.NODE_ENV !== "production") {
    router.get("/test-public", (req, res) => res.json({ message: "Public route works" }));
}

// Protected auth routes
router.get("/me", authenticate, getCurrentUser);
router.post("/password/request-otp", authenticate, authLimiter, requestPasswordChangeOTP);
router.post("/password/change", authenticate, otpLimiter, validate(authSchemas.changePassword), changePasswordWithOTP);
router.post("/email/request-otp", authenticate, authLimiter, requestEmailChangeOTP);
router.post("/email/change", authenticate, otpLimiter, validate(authSchemas.changeEmail), changeEmailWithOTP);
router.post("/logout", authenticate, logout);

export default router;

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { generateOTP, getOTPExpiry, verifyOTP } from "../utils/otp.js";
import { sendOTPEmail } from "../utils/email.js";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../utils/response.js";
import { logger } from "../utils/logger.js";

/**
 * Normalize email to lowercase and trim
 */
const normalizeEmail = (email) => email?.toLowerCase().trim();

const getAuthCookieOptions = (req) => {
  const cookieSecureOverride = process.env.COOKIE_SECURE;
  const forwardedProto = req?.get?.("x-forwarded-proto")?.split(",")?.[0]?.trim();
  const requestIsHttps = Boolean(req?.secure) || forwardedProto === "https";

  const isSecureCookie =
    cookieSecureOverride === "true"
      ? true
      : cookieSecureOverride === "false"
        ? false
        : requestIsHttps;

  return {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: isSecureCookie ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

const findUserByEmail = async (email) => {
  const [row] = await db.execute(
    sql`SELECT id, email, password, role, full_name AS fullName, phone, otp, otp_expiry AS otpExpiry, is_active AS isActive, is_email_verified AS isEmailVerified, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ${email} LIMIT 1`
  );

  return row || null;
};

const findUserById = async (userId) => {
  const [row] = await db.execute(
    sql`SELECT id, email, password, role, full_name AS fullName, phone, otp, otp_expiry AS otpExpiry, is_active AS isActive, is_email_verified AS isEmailVerified, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ${userId} LIMIT 1`
  );

  return row || null;
};

// =====================================================
// LOGIN - GENERATE OTP
// =====================================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    logger.info("Login attempt", { email: normalizedEmail });

    // Find user by email
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      logger.security("Login failed - user not found", { email: normalizedEmail });
      return unauthorizedResponse(res, "Email atau password salah");
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      logger.security("Login failed - invalid password", { 
        userId: user.id,
        email: normalizedEmail 
      });
      return unauthorizedResponse(res, "Email atau password salah");
    }

    // Check if user is active
    if (!user.isActive) {
      logger.security("Login failed - inactive account", { 
        userId: user.id,
        email: normalizedEmail 
      });
      return errorResponse(
        res,
        "Akun Anda telah dinonaktifkan. Hubungi admin.",
        403
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Update user with OTP
    await db
      .update(users)
      .set({
        otp: otp,
        otpExpiry: otpExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send OTP via email
    const emailSent = await sendOTPEmail(user, otp);
    
    if (!emailSent.success) {
      logger.error("Failed to send OTP email", emailSent.error, { userId: user.id });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    logger.info("OTP sent successfully", { userId: user.id });

    return successResponse(
      res,
      {
        email: user.email,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "Silakan cek email Anda untuk kode OTP"
    );
  } catch (error) {
    logger.error("Login error", error);
    next(error);
  }
};

// =====================================================
// VERIFY OTP - RETURN TOKEN
// =====================================================
export const verifyOTPLogin = async (req, res, next) => {
  try {
    const { email, otp } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    logger.info("OTP verification attempt", { email: normalizedEmail });

    // Find user
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      logger.security("OTP verification failed - user not found", { email: normalizedEmail });
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Verify OTP
    const otpValidation = verifyOTP(user.otp, otp, user.otpExpiry);
    if (!otpValidation.valid) {
      logger.security("OTP verification failed - invalid OTP", { 
        userId: user.id,
        reason: otpValidation.message 
      });
      return errorResponse(res, otpValidation.message, 400);
    }

    // Clear OTP and update login info
    await db
      .update(users)
      .set({
        otp: null,
        otpExpiry: null,
        isEmailVerified: true,
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate JWT Token with token version
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.security("User logged in successfully", { userId: user.id, email: user.email });

    res.cookie("access_token", token, getAuthCookieOptions(req));

    return successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
        },
      },
      "Login berhasil"
    );
  } catch (error) {
    logger.error("OTP verification error", error);
    next(error);
  }
};

// =====================================================
// REQUEST NEW OTP
// =====================================================
export const requestOTP = async (req, res, next) => {
  try {
    const { email } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      // Return success even if user not found (security best practice)
      return successResponse(
        res,
        { email: normalizedEmail },
        "Jika email terdaftar, OTP baru telah dikirim"
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await db
      .update(users)
      .set({
        otp: otp,
        otpExpiry: otpExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send OTP
    const emailSent = await sendOTPEmail(user, otp);
    
    if (!emailSent.success) {
      logger.error("Failed to send OTP email", emailSent.error, { userId: user.id });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    logger.info("New OTP requested", { userId: user.id });

    return successResponse(
      res,
      {
        email: user.email,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "OTP baru telah dikirim"
    );
  } catch (error) {
    logger.error("Request OTP error", error);
    next(error);
  }
};

// =====================================================
// GET CURRENT USER (Protected)
// =====================================================
export const getCurrentUser = async (req, res, next) => {
  try {
    const [user] = await db.execute(
      sql`SELECT id, email, role, full_name AS fullName, phone, is_active AS isActive, is_email_verified AS isEmailVerified, last_login AS lastLogin, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ${req.user.userId} LIMIT 1`
    );

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    return successResponse(res, user);
  } catch (error) {
    logger.error("Get current user error", error);
    next(error);
  }
};

// =====================================================
// REQUEST PASSWORD CHANGE OTP
// =====================================================
export const requestPasswordChangeOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await findUserById(userId);

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP to database
    await db
      .update(users)
      .set({
        otp,
        otpExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Send OTP via email
    const emailSent = await sendOTPEmail(user, otp);
    
    if (!emailSent.success) {
      logger.error("Failed to send password change OTP", emailSent.error, { userId });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    logger.info("Password change OTP sent", { userId });

    // Mask email for response
    const [local, domain] = user.email.split("@");
    const maskedEmail = local.slice(0, 2) + "***" + local.slice(-1) + "@" + domain;

    return successResponse(
      res,
      {
        email: maskedEmail,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "Kode OTP telah dikirim ke email Anda"
    );
  } catch (error) {
    logger.error("Request password change OTP error", error);
    next(error);
  }
};

// =====================================================
// VERIFY OTP & CHANGE PASSWORD
// =====================================================
export const changePasswordWithOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { otp, newPassword } = req.validatedBody || req.body;

    const user = await findUserById(userId);

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Verify OTP
    const otpValidation = verifyOTP(user.otp, otp, user.otpExpiry);
    if (!otpValidation.valid) {
      logger.security("Password change failed - invalid OTP", { userId });
      return errorResponse(res, otpValidation.message, 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password & clear OTP
    await db
      .update(users)
      .set({
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.security("Password changed successfully", { userId });

    res.clearCookie("access_token", getAuthCookieOptions(req));

    return successResponse(res, null, "Password berhasil diubah. Silakan login kembali.");
  } catch (error) {
    logger.error("Change password error", error);
    next(error);
  }
};

// =====================================================
// REQUEST EMAIL CHANGE OTP
// =====================================================
export const requestEmailChangeOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await findUserById(userId);

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP to database
    await db
      .update(users)
      .set({
        otp,
        otpExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Send OTP via email to current email
    const emailSent = await sendOTPEmail(user, otp);
    
    if (!emailSent.success) {
      logger.error("Failed to send email change OTP", emailSent.error, { userId });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    logger.info("Email change OTP sent", { userId });

    // Mask email for response
    const [local, domain] = user.email.split("@");
    const maskedEmail = local.slice(0, 2) + "***" + local.slice(-1) + "@" + domain;

    return successResponse(
      res,
      {
        email: maskedEmail,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "Kode OTP telah dikirim ke email Anda saat ini"
    );
  } catch (error) {
    logger.error("Request email change OTP error", error);
    next(error);
  }
};

// =====================================================
// VERIFY OTP & CHANGE EMAIL
// =====================================================
export const changeEmailWithOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { otp, newEmail } = req.validatedBody || req.body;
    const normalizedNewEmail = normalizeEmail(newEmail);

    // Check if new email is already taken
    const existingUser = await findUserByEmail(normalizedNewEmail);

    if (existingUser && existingUser.id !== userId) {
      return errorResponse(res, "Email baru sudah terdaftar", 400);
    }

    const user = await findUserById(userId);

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Verify OTP
    const otpValidation = verifyOTP(user.otp, otp, user.otpExpiry);
    if (!otpValidation.valid) {
      logger.security("Email change failed - invalid OTP", { userId });
      return errorResponse(res, otpValidation.message, 400);
    }

    // Update email & clear OTP
    await db
      .update(users)
      .set({
        email: normalizedNewEmail,
        otp: null,
        otpExpiry: null,
        isEmailVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.security("Email changed successfully", { 
      userId, 
      oldEmail: user.email,
      newEmail: normalizedNewEmail 
    });

    res.clearCookie("access_token", getAuthCookieOptions(req));

    return successResponse(
      res,
      null,
      "Email berhasil diubah. Silakan login kembali dengan email baru."
    );
  } catch (error) {
    logger.error("Change email error", error);
    next(error);
  }
};

export const logout = async (req, res) => {
  const cookieOptions = getAuthCookieOptions(req);
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: "/",
  });
  return successResponse(res, null, "Logout berhasil");
};

import { db } from "../db/index.js";
import { prospectJamaah, users } from "../db/schema.js";
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

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[abyx]\$\d{2}\$/.test(value);

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

  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
  const sameSiteOverride = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite = ["lax", "strict", "none"].includes(sameSiteOverride)
    ? sameSiteOverride
    : isSecureCookie
      ? "none"
      : "lax";

  return {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
};

const findUserByEmail = async (email) => {
  return db.query.users.findFirst({
    where: sql`LOWER(TRIM(email)) = LOWER(TRIM(${email}))`,
    columns: {
      id: true,
      email: true,
      password: true,
      role: true,
      fullName: true,
      phone: true,
      otp: true,
      otpExpiry: true,
      isActive: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const findUserById = async (userId) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      password: true,
      role: true,
      fullName: true,
      phone: true,
      otp: true,
      otpExpiry: true,
      isActive: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// =====================================================
// PUBLIC CALON JAMAAH REGISTRATION
// =====================================================
export const registerCalonJamaah = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      sourceType = "GENERAL",
      sourceSlug = null,
      formStartedAt,
    } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);
    const elapsedMs = formStartedAt ? Date.now() - Number(formStartedAt) : 0;

    if (elapsedMs > 0 && elapsedMs < 1500) {
      logger.security("Calon jamaah register blocked - submit too fast", {
        email: normalizedEmail,
        ip: req.ip,
      });
      return errorResponse(res, "Permintaan terlalu cepat. Silakan coba lagi.", 400);
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return errorResponse(res, "Email sudah terdaftar. Silakan login.", 409);
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        password: hashedPassword,
        fullName,
        phone,
        role: "CALON_JAMAAH",
        otp,
        otpExpiry,
        isActive: true,
        isEmailVerified: false,
      })
      .$returningId();

    const userId = Number(newUser.id);

    await db.insert(prospectJamaah).values({
      userId,
      followUpStatus: "BARU",
      sourceType,
      sourceSlug,
    });

    const emailResult = await sendOTPEmail(
      { id: userId, email: normalizedEmail, fullName },
      otp,
    );

    if (!emailResult.success) {
      logger.error("Failed to send calon jamaah register OTP", emailResult.error, {
        userId,
      });
      return errorResponse(
        res,
        "Akun dibuat, tetapi OTP gagal dikirim. Silakan request ulang OTP.",
        500,
      );
    }

    logger.security("Calon jamaah registered", {
      userId,
      email: normalizedEmail,
      sourceType,
      sourceSlug,
    });

    return successResponse(
      res,
      {
        email: normalizedEmail,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES || 5} menit`,
      },
      "Registrasi berhasil. Silakan cek email Anda untuk kode OTP",
      201,
    );
  } catch (error) {
    logger.error("Calon jamaah registration error", error);
    next(error);
  }
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
    logger.debug("Login lookup result", {
      email: normalizedEmail,
      found: Boolean(user),
    });

    if (!user) {
      logger.security("Login failed - user not found", { email: normalizedEmail });
      return unauthorizedResponse(res, "Email atau password salah");
    }

    // Check password (supports bcrypt variants + legacy plain-text records once)
    let isPasswordValid = false;

    if (isBcryptHash(user.password)) {
      logger.debug("Login password mode", { userId: user.id, mode: "bcrypt" });
      isPasswordValid = await comparePassword(password, user.password);
    } else {
      logger.debug("Login password mode", { userId: user.id, mode: "legacy-plain" });
      isPasswordValid = password === user.password;

      if (isPasswordValid) {
        const migratedHash = await hashPassword(password);
        await db
          .update(users)
          .set({
            password: migratedHash,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        logger.security("Legacy password hash migrated", {
          userId: user.id,
          email: normalizedEmail,
        });
      }
    }

    if (!isPasswordValid) {
      logger.debug("Login password check failed", { userId: user.id });
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

    // Send OTP via email (async via queue)
    const emailResult = await sendOTPEmail(user, otp);
    
    if (!emailResult.success) {
      logger.error("Failed to send OTP email", emailResult.error, { userId: user.id });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    const emailStatus = emailResult.queued ? "queued" : "sent";
    logger.info(`OTP email ${emailStatus} successfully`, { userId: user.id, jobId: emailResult.jobId });

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
    const emailResult = await sendOTPEmail(user, otp);
    
    if (!emailResult.success) {
      logger.error("Failed to send OTP email", emailResult.error, { userId: user.id });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    const emailStatus = emailResult.queued ? "queued" : "sent";
    logger.info(`OTP email ${emailStatus}`, { userId: user.id, jobId: emailResult.jobId });

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
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
      columns: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phone: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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

    // Send OTP via email (async via queue)
    const emailResult = await sendOTPEmail(user, otp);
    
    if (!emailResult.success) {
      logger.error("Failed to send password change OTP", emailResult.error, { userId });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    const emailStatus = emailResult.queued ? "queued" : "sent";
    logger.info(`Password change OTP ${emailStatus}`, { userId, jobId: emailResult.jobId });

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

    // Send OTP via email to current email (async via queue)
    const emailResult = await sendOTPEmail(user, otp);
    
    if (!emailResult.success) {
      logger.error("Failed to send email change OTP", emailResult.error, { userId });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    const emailStatus = emailResult.queued ? "queued" : "sent";
    logger.info(`Email change OTP ${emailStatus}`, { userId, jobId: emailResult.jobId });

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
    ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
  });
  return successResponse(res, null, "Logout berhasil");
};

// =====================================================
// FORGOT PASSWORD - REQUEST OTP
// =====================================================
export const requestForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    logger.info("Forgot password OTP request", { email: normalizedEmail });

    // Find user by email
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return errorResponse(res, "Email tidak ditemukan", 404);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, "Akun Anda telah dinonaktifkan. Hubungi admin.", 403);
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
      .where(eq(users.id, user.id));

    // Send OTP via email (async via queue)
    const emailResult = await sendOTPEmail(user, otp);
    
    if (!emailResult.success) {
      logger.error("Failed to send forgot password OTP email", emailResult.error, { userId: user.id });
      return errorResponse(res, "Gagal mengirim OTP. Silakan coba lagi.", 500);
    }

    const emailStatus = emailResult.queued ? "queued" : "sent";
    logger.info(`Forgot password OTP email ${emailStatus} successfully`, { userId: user.id, jobId: emailResult.jobId });

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
    logger.error("Request forgot password OTP error", error);
    next(error);
  }
};

// =====================================================
// FORGOT PASSWORD - RESET WITH OTP
// =====================================================
export const resetPasswordWithOTP = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.validatedBody || req.body;
    const normalizedEmail = normalizeEmail(email);

    logger.info("Forgot password reset attempt", { email: normalizedEmail });

    // Find user by email
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, "Akun Anda telah dinonaktifkan. Hubungi admin.", 403);
    }

    // Verify OTP
    const otpValidation = verifyOTP(user.otp, otp, user.otpExpiry);
    if (!otpValidation.valid) {
      logger.security("Forgot password reset failed - invalid OTP", { userId: user.id });
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
      .where(eq(users.id, user.id));

    logger.security("Forgot password reset successfully", { userId: user.id });

    // Clear access_token cookie if logged in
    res.clearCookie("access_token", getAuthCookieOptions(req));

    return successResponse(res, null, "Password berhasil diubah. Silakan login kembali.");
  } catch (error) {
    logger.error("Forgot password reset error", error);
    next(error);
  }
};

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { generateOTP, getOTPExpiry, verifyOTP } from "../utils/otp.js";
import { sendOTPEmail } from "../utils/email.js";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "../utils/response.js";

// =====================================================
// LOGIN - GENERATE OTP
// =====================================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email using Drizzle
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return unauthorizedResponse(res, "Email atau password salah");
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, "Email atau password salah");
    }

    // Check if user is active
    if (!user.isActive) {
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
      })
      .where(eq(users.id, user.id));

    // Send OTP via email
    await sendOTPEmail(user, otp);

    return successResponse(
      res,
      {
        email: user.email,
        message: `OTP telah dikirim ke ${user.email}`,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES} menit`,
      },
      "Silakan cek email Anda untuk kode OTP"
    );
  } catch (error) {
    next(error);
  }
};

// =====================================================
// VERIFY OTP - RETURN TOKEN
// =====================================================
export const verifyOTPLogin = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    // Verify OTP
    const otpValidation = verifyOTP(user.otp, otp, user.otpExpiry);
    if (!otpValidation.valid) {
      return errorResponse(res, otpValidation.message, 400);
    }

    // Clear OTP
    await db
      .update(users)
      .set({
        otp: null,
        otpExpiry: null,
        isEmailVerified: true,
        lastLogin: new Date(),
      })
      .where(eq(users.id, user.id));

    // Generate JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
    next(error);
  }
};

// =====================================================
// REQUEST NEW OTP
// =====================================================
export const requestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return errorResponse(res, "Email tidak terdaftar", 404);
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await db
      .update(users)
      .set({
        otp: otp,
        otpExpiry: otpExpiry,
      })
      .where(eq(users.id, user.id));

    // Send OTP
    await sendOTPEmail(user, otp);

    return successResponse(
      res,
      {
        email: user.email,
        expiresIn: `${process.env.OTP_EXPIRY_MINUTES} menit`,
      },
      "OTP baru telah dikirim"
    );
  } catch (error) {
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
        password: false, // Exclude password
        otp: false,
        otpExpiry: false,
      },
    });

    if (!user) {
      return errorResponse(res, "User tidak ditemukan", 404);
    }

    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
};




// =====================================================
// REQUEST PASSWORD CHANGE OTP
// =====================================================
export const requestPasswordChangeOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Save OTP to database
    await db
      .update(users)
      .set({
        otp,
        otpExpiry,
      })
      .where(eq(users.id, userId));

    // Send OTP via email (pakai function yang sudah ada)
    await sendOTPEmail(user, otp);

    console.log(`📧 Password change OTP sent to: ${user.email}`);

    // Mask email for response
    const [local, domain] = user.email.split("@");
    const maskedEmail = local.slice(0, 2) + "***" + local.slice(-1) + "@" + domain;

    return res.json({
      success: true,
      message: "Kode OTP telah dikirim ke email Anda",
      data: {
        email: maskedEmail,
        expiresIn: 600,
      },
    });
  } catch (error) {
    console.error("❌ REQUEST PASSWORD CHANGE OTP ERROR:", error);
    next(error);
  }
};

// =====================================================
// VERIFY OTP & CHANGE PASSWORD
// =====================================================
export const changePasswordWithOTP = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "OTP dan password baru wajib diisi",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 8 karakter",
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP tidak valid",
      });
    }

    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "Kode OTP sudah kadaluarsa",
      });
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

    console.log(`✅ Password changed for user: ${userId}`);

    return res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("❌ CHANGE PASSWORD ERROR:", error);
    next(error);
  }
};

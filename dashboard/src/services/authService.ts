// dashboard/src/lib/services/authService.ts
import api from "@/lib/axios";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    message: string;
    expiresIn: string;
  };
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      email: string;
      fullName: string;
      role: string;
      phone: string | null;
    };
  };
}

export interface RequestOTPRequest {
  email: string;
}

export const authService = {
  // Login - Generate OTP
  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (data: VerifyOTPRequest) => {
    const response = await api.post<VerifyOTPResponse>(
      "/auth/verify-otp",
      data
    );
    return response.data;
  },

  // Request New OTP
  requestOTP: async (data: RequestOTPRequest) => {
    const response = await api.post("/auth/request-otp", data);
    return response.data;
  },

  // Get Current User
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Request Forgot Password OTP
  requestForgotPasswordOTP: async (data: { email: string }) => {
    const response = await api.post("/auth/forgot-password/request-otp", data);
    return response.data;
  },

  // Reset Password with OTP
  resetPasswordWithOTP: async (data: {
    email: string;
    otp: string;
    newPassword: string;
  }) => {
    const response = await api.post("/auth/forgot-password/reset", data);
    return response.data;
  },
};

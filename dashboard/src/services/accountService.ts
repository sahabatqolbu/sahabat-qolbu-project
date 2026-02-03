// dashboard/src/services/accountService.ts

import api from "@/lib/axios";

export const accountService = {
  // Request OTP untuk ganti password
  requestPasswordOTP: async () => {
    const response = await api.post("/auth/password/request-otp");
    return response.data;
  },

  // Ganti password dengan OTP
  changePassword: async (otp: string, newPassword: string) => {
    const response = await api.post("/auth/password/change", {
      otp,
      newPassword,
    });
    return response.data;
  },
};

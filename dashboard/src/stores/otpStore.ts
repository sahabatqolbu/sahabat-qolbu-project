import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OTPState {
  email: string;
  expiresIn: string;
  setOTPData: (email: string, expiresIn: string) => void;
  clearOTPData: () => void;
}

export const useOTPStore = create<OTPState>()(
  persist(
    (set) => ({
      email: "",
      expiresIn: "",

      setOTPData: (email, expiresIn) => {
        console.log("📝 Saving OTP data:", { email, expiresIn });
        set({ email, expiresIn });
      },

      clearOTPData: () => {
        console.log("🗑️ Clearing OTP data");
        set({ email: "", expiresIn: "" });
      },
    }),
    {
      name: "otp-storage", // 🔥 ADD PERSIST
    }
  )
);

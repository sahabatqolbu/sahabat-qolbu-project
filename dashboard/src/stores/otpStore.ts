import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OTPState {
  email: string;
  expiresIn: string;
  nextPath: string;
  setOTPData: (email: string, expiresIn: string, nextPath?: string) => void;
  clearOTPData: () => void;
}

export const useOTPStore = create<OTPState>()(
  persist(
    (set) => ({
      email: "",
      expiresIn: "",
      nextPath: "",

      setOTPData: (email, expiresIn, nextPath = "") => {
        console.log("Saving OTP data:", { email, expiresIn, nextPath });
        set({ email, expiresIn, nextPath });
      },

      clearOTPData: () => {
        console.log("Clearing OTP data");
        set({ email: "", expiresIn: "", nextPath: "" });
      },
    }),
    {
      name: "otp-storage",
    },
  ),
);

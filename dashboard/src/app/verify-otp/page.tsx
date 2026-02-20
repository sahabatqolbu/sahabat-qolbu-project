"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useOTPStore } from "@/stores/otpStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OtpInput from "react-otp-input";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { toast } = useToast();

  const { email, expiresIn, clearOTPData } = useOTPStore();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    if (!email) {
      router.push("/login");
      return;
    }

    const minutes = parseInt(expiresIn) || 5;
    setCountdown(minutes * 60);
  }, [email, expiresIn, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Verify OTP Mutation
  const verifyMutation = useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess: (data) => {
      // Save auth data to Zustand
      setAuth(data.data.user as any);
      clearOTPData();

      toast({
        title: "✅ Login Berhasil",
        description: `Selamat datang, ${data.data.user.fullName}!`,
      });

      // Role-based redirect
      const roleRoutes: Record<string, string> = {
        ADMIN: "/admin",
        FINANCE: "/finance",
        STAFF: "/staff",
        AGEN: "/agen",
        JAMAAH: "/jamaah",
      };

      const targetRoute = roleRoutes[data.data.user.role] || "/login";

      // Small delay to ensure state is saved
      setTimeout(() => {
        router.replace(targetRoute);
      }, 300);
    },
    onError: (error: any) => {
      console.error("❌ OTP Verification Error:", error);

      const errorMessage =
        error.response?.data?.message || "Verifikasi OTP gagal";
      setError(errorMessage);

      toast({
        variant: "destructive",
        title: "❌ Verifikasi Gagal",
        description: errorMessage,
      });

      setOtp("");
    },
  });

  // Resend OTP Mutation
  const resendMutation = useMutation({
    mutationFn: authService.requestOTP,
    onSuccess: (data) => {
      toast({
        title: "✅ OTP Terkirim",
        description: "Kode OTP baru telah dikirim ke email Anda",
      });

      setOtp("");
      setError("");

      const minutes = parseInt(data.data.expiresIn) || 5;
      setCountdown(minutes * 60);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Mengirim OTP",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // Handle OTP Change
  const handleOTPChange = (value: string) => {
    setOtp(value);
    setError("");

    // Auto-submit when 6 digits
    if (value.length === 6 && !verifyMutation.isPending) {
      verifyMutation.mutate({ email, otp: value });
    }
  };

  const handleResend = () => {
    if (countdown > 0) {
      toast({
        title: "Tunggu Sebentar",
        description: "Anda bisa kirim ulang OTP setelah timer habis",
      });
      return;
    }

    resendMutation.mutate({ email });
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => router.push("/login")}
          className="text-white hover:text-primary-100 mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Login
        </button>

        {/* OTP Card */}
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Verifikasi OTP</CardTitle>
            <CardDescription>
              Masukkan kode 6 digit yang telah dikirim ke
              <br />
              <span className="font-semibold text-primary">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OTP Input */}
            <div className="flex justify-center">
              <OtpInput
                value={otp}
                onChange={handleOTPChange}
                numInputs={6}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all mx-1"
                    disabled={verifyMutation.isPending}
                  />
                )}
                shouldAutoFocus
              />
            </div>

            {/* Loading State */}
            {verifyMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Memverifikasi OTP...</span>
              </div>
            )}

            {/* Countdown */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">
                  Kode berlaku selama{" "}
                  <span className="font-semibold text-primary">
                    {formatTime(countdown)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-500 font-semibold">
                  Kode OTP telah kedaluwarsa
                </p>
              )}
            </div>

            {/* Verify Button (Manual) */}
            <Button
              onClick={() => {
                if (verifyMutation.isPending) return;
                verifyMutation.mutate({ email, otp });
              }}
              disabled={otp.length !== 6 || verifyMutation.isPending}
              className="w-full bg-secondary hover:bg-secondary/90"
              size="lg"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Verifikasi"
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Tidak menerima kode?</p>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={countdown > 0 || resendMutation.isPending}
                className="text-primary font-semibold"
              >
                {resendMutation.isPending ? "Mengirim..." : "Kirim Ulang OTP"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

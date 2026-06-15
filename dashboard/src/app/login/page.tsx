// dashboard/src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useOTPStore } from "@/stores/otpStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowLeft, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "login" | "forgot-request" | "forgot-reset";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setOTPData = useOTPStore((state) => state.setOTPData);

  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({
    otp: "",
    newPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Save email and expiry for OTP page
      setOTPData(formData.email, data.data.expiresIn);

      toast({
        title: "✅ OTP Terkirim",
        description: data.data.message,
      });

      // Redirect to OTP verification
      router.push("/verify-otp");
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const rawMessage = String(error?.response?.data?.message || "");

      let errorMessage = rawMessage || "Login gagal";
      if (status >= 500) {
        errorMessage = "Server sedang bermasalah. Silakan coba lagi beberapa saat.";
      }
      if (rawMessage.toLowerCase().includes("data and hash arguments required")) {
        errorMessage = "Akun ini belum bisa login. Silakan hubungi admin untuk reset password.";
      }

      toast({
        variant: "destructive",
        title: "❌ Login Gagal",
        description: errorMessage,
      });

      setErrors({ general: errorMessage });
    },
  });

  // Forgot Password Request Mutation
  const forgotRequestMutation = useMutation({
    mutationFn: authService.requestForgotPasswordOTP,
    onSuccess: (data: any) => {
      toast({
        title: "✅ OTP Terkirim",
        description: data.message || "Kode OTP reset password telah dikirim ke email Anda",
      });
      setViewMode("forgot-reset");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Gagal mengirim request OTP";
      toast({
        variant: "destructive",
        title: "❌ Request Gagal",
        description: msg,
      });
      setErrors({ forgotEmail: msg });
    },
  });

  // Forgot Password Reset Mutation
  const forgotResetMutation = useMutation({
    mutationFn: authService.resetPasswordWithOTP,
    onSuccess: (data: any) => {
      toast({
        title: "✅ Password Berhasil Direset",
        description: data.message || "Password berhasil diubah. Silakan login kembali.",
      });
      setFormData({ email: forgotEmail, password: "" });
      setViewMode("login");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Gagal mereset password";
      toast({
        variant: "destructive",
        title: "❌ Reset Gagal",
        description: msg,
      });
      setErrors({ resetOtp: msg });
    },
  });

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotRequest = () => {
    const newErrors: Record<string, string> = {};
    if (!forgotEmail) {
      newErrors.forgotEmail = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      newErrors.forgotEmail = "Format email tidak valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotReset = () => {
    const newErrors: Record<string, string> = {};
    if (!resetData.otp) {
      newErrors.resetOtp = "Kode OTP wajib diisi";
    } else if (resetData.otp.length !== 6) {
      newErrors.resetOtp = "Kode OTP harus 6 digit";
    }
    if (!resetData.newPassword) {
      newErrors.newPassword = "Password baru wajib diisi";
    } else if (resetData.newPassword.length < 8) {
      newErrors.newPassword = "Password baru minimal 8 karakter";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit Login
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMutation.isPending) return;

    if (validate()) {
      loginMutation.mutate(formData);
    }
  };

  // View: Forgot Password OTP Request
  if (viewMode === "forgot-request") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <img
                src="/images/icon.png"
                alt="Sahabat Qolbu Logo"
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              Sahabat Qolbu
            </h1>
            <p className="text-primary-100">Sistem Manajemen Umrah & Haji</p>
          </div>

          <Card className="shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("login");
                    setErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <CardTitle className="text-2xl">Lupa Password</CardTitle>
              </div>
              <CardDescription>
                Masukkan email terdaftar untuk menerima kode verifikasi OTP reset password.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotRequestMutation.isPending) return;
                  if (validateForgotRequest()) {
                    forgotRequestMutation.mutate({ email: forgotEmail });
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-10"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setErrors({ ...errors, forgotEmail: "" });
                      }}
                      disabled={forgotRequestMutation.isPending}
                    />
                  </div>
                  {errors.forgotEmail && (
                    <p className="text-sm text-red-500">{errors.forgotEmail}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  size="lg"
                  disabled={forgotRequestMutation.isPending}
                >
                  {forgotRequestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim OTP...
                    </>
                  ) : (
                    "Kirim Kode OTP"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View: Forgot Password OTP Verification & Reset
  if (viewMode === "forgot-reset") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <img
                src="/images/icon.png"
                alt="Sahabat Qolbu Logo"
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              Sahabat Qolbu
            </h1>
            <p className="text-primary-100">Sistem Manajemen Umrah & Haji</p>
          </div>

          <Card className="shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("forgot-request");
                    setErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
              </div>
              <CardDescription>
                Masukkan kode OTP yang dikirim ke email Anda dan masukkan password baru.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotResetMutation.isPending) return;
                  if (validateForgotReset()) {
                    forgotResetMutation.mutate({
                      email: forgotEmail,
                      otp: resetData.otp,
                      newPassword: resetData.newPassword,
                    });
                  }
                }}
                className="space-y-4"
              >
                {/* OTP Field */}
                <div className="space-y-2">
                  <Label htmlFor="resetOtp">Kode OTP</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetOtp"
                      type="text"
                      placeholder="Masukkan 6 digit OTP"
                      maxLength={6}
                      className="pl-10"
                      value={resetData.otp}
                      onChange={(e) => {
                        setResetData({ ...resetData, otp: e.target.value.replace(/\D/g, "") });
                        setErrors({ ...errors, resetOtp: "" });
                      }}
                      disabled={forgotResetMutation.isPending}
                    />
                  </div>
                  {errors.resetOtp && (
                    <p className="text-sm text-red-500">{errors.resetOtp}</p>
                  )}
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="pl-10 pr-10"
                      value={resetData.newPassword}
                      onChange={(e) => {
                        setResetData({ ...resetData, newPassword: e.target.value });
                        setErrors({ ...errors, newPassword: "" });
                      }}
                      disabled={forgotResetMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500">{errors.newPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  size="lg"
                  disabled={forgotResetMutation.isPending}
                >
                  {forgotResetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View: Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <img
              src="/images/icon.png"
              alt="Sahabat Qolbu Logo"
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">
            Sahabat Qolbu
          </h1>
          <p className="text-primary-100">Sistem Manajemen Umrah & Haji</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Masuk</CardTitle>
            <CardDescription>
              Masukkan email dan password Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setErrors({ ...errors, email: "" });
                    }}
                    disabled={loginMutation.isPending}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setErrors({ ...errors, password: "" });
                    }}
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setViewMode("forgot-request");
                    setErrors({});
                  }}
                >
                  Lupa Password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                size="lg"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Belum punya akun?</p>
              <p className="mt-1">
                Hubungi{" "}
                <span className="font-semibold text-primary">Admin</span> atau{" "}
                <span className="font-semibold text-primary">Agen</span> untuk
                mendaftar
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-primary-100 text-sm mt-6">
          © {new Date().getFullYear()} Sahabat Qolbu. All rights reserved.
        </p>
      </div>
    </div>
  );
}

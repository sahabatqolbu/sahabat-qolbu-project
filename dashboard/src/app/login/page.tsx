"use client";

import { Suspense, useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, Eye, EyeOff, Key, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "login" | "register" | "forgot-request" | "forgot-reset";

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const isPhoneNumber = (value: string) => /^[0-9+\-\s()]{8,20}$/.test(value);
const isStrongPassword = (value: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,128}$/.test(value);

const mapRegisterFieldError = (field?: string) => {
  switch (field) {
    case "fullName":
      return "fullName";
    case "email":
      return "registerEmail";
    case "phone":
      return "phone";
    case "password":
      return "registerPassword";
    case "confirmPassword":
      return "confirmPassword";
    default:
      return "";
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const setOTPData = useOTPStore((state) => state.setOTPData);

  const nextPath = searchParams.get("next") || "";
  const initialTab = searchParams.get("tab");

  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    honeypot: "",
    formStartedAt: Date.now(),
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({ otp: "", newPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTab === "register") {
      setViewMode("register");
    }
  }, [initialTab]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setOTPData(formData.email, data.data.expiresIn, nextPath);
      toast({
        title: "OTP Terkirim",
        description: "Kode OTP sudah dikirim ke email Anda.",
      });
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

      setErrors({ general: errorMessage });
      toast({ variant: "destructive", title: "Login Gagal", description: errorMessage });
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.registerCalonJamaah,
    onSuccess: (data) => {
      setOTPData(registerData.email, data.data.expiresIn, nextPath);
      toast({
        title: "Registrasi Berhasil",
        description: "Kode OTP sudah dikirim ke email Anda.",
      });
      router.push("/verify-otp");
    },
    onError: (error: any) => {
      const responseData = error?.response?.data;
      const backendErrors = Array.isArray(responseData?.errors)
        ? responseData.errors
        : [];
      const fieldErrors = backendErrors.reduce(
        (acc: Record<string, string>, item: { field?: string; message?: string }) => {
          const fieldKey = mapRegisterFieldError(item?.field);
          if (fieldKey && item?.message && !acc[fieldKey]) {
            acc[fieldKey] = item.message;
          }
          return acc;
        },
        {},
      );
      const detailedMessage =
        backendErrors.find((item: { message?: string }) => item?.message)?.message ||
        responseData?.message ||
        "Registrasi gagal";

      setErrors({
        ...fieldErrors,
        general: detailedMessage,
      });
      toast({
        variant: "destructive",
        title: "Registrasi Gagal",
        description: detailedMessage,
      });
    },
  });

  const forgotRequestMutation = useMutation({
    mutationFn: authService.requestForgotPasswordOTP,
    onSuccess: (data: any) => {
      toast({
        title: "OTP Terkirim",
        description: data.message || "Kode OTP reset password telah dikirim ke email Anda",
      });
      setViewMode("forgot-reset");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Gagal mengirim request OTP";
      setErrors({ forgotEmail: msg });
      toast({ variant: "destructive", title: "Request Gagal", description: msg });
    },
  });

  const forgotResetMutation = useMutation({
    mutationFn: authService.resetPasswordWithOTP,
    onSuccess: (data: any) => {
      toast({
        title: "Password Berhasil Direset",
        description: data.message || "Password berhasil diubah. Silakan login kembali.",
      });
      setFormData({ email: forgotEmail, password: "" });
      setViewMode("login");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Gagal mereset password";
      setErrors({ resetOtp: msg });
      toast({ variant: "destructive", title: "Reset Gagal", description: msg });
    },
  });

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email wajib diisi";
    else if (!isEmail(formData.email)) newErrors.email = "Format email tidak valid";
    if (!formData.password) newErrors.password = "Password wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};
    const fullName = registerData.fullName.trim();
    const phone = registerData.phone.trim();

    if (!fullName) newErrors.fullName = "Nama lengkap wajib diisi";
    else if (fullName.length < 2) newErrors.fullName = "Nama lengkap minimal 2 karakter";

    if (!registerData.email) newErrors.registerEmail = "Email wajib diisi";
    else if (!isEmail(registerData.email)) newErrors.registerEmail = "Format email tidak valid";

    if (!phone) newErrors.phone = "Nomor WhatsApp wajib diisi";
    else if (!isPhoneNumber(phone)) {
      newErrors.phone = "Format nomor WhatsApp tidak valid";
    }

    if (registerData.password.length < 8) {
      newErrors.registerPassword = "Password minimal 8 karakter";
    } else if (!isStrongPassword(registerData.password)) {
      newErrors.registerPassword =
        "Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus";
    }

    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak sama";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotRequest = () => {
    const newErrors: Record<string, string> = {};
    if (!forgotEmail) newErrors.forgotEmail = "Email wajib diisi";
    else if (!isEmail(forgotEmail)) newErrors.forgotEmail = "Format email tidak valid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotReset = () => {
    const newErrors: Record<string, string> = {};
    if (resetData.otp.length !== 6) newErrors.resetOtp = "Kode OTP harus 6 digit";
    if (resetData.newPassword.length < 8) newErrors.newPassword = "Password baru minimal 8 karakter";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const switchMode = (mode: ViewMode) => {
    setErrors({});
    setViewMode(mode);
    if (mode === "register") {
      setRegisterData((prev) => ({ ...prev, formStartedAt: Date.now() }));
    }
  };

  const renderShell = (children: ReactNode) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <img src="/images/icon.png" alt="Sahabat Qolbu Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Sahabat Qolbu</h1>
          <p className="text-primary-100">Sistem Manajemen Umrah & Haji</p>
        </div>
        {children}
        <p className="text-center text-primary-100 text-sm mt-6">
          © {new Date().getFullYear()} Sahabat Qolbu. All rights reserved.
        </p>
      </div>
    </div>
  );

  if (viewMode === "forgot-request") {
    return renderShell(
      <Card className="shadow-2xl">
        <CardHeader>
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mb-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>Masukkan email terdaftar untuk menerima kode OTP reset password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateForgotRequest()) forgotRequestMutation.mutate({ email: forgotEmail });
            }}
            className="space-y-4"
          >
            <FieldError message={errors.forgotEmail} />
            <IconInput
              id="forgotEmail"
              label="Email"
              type="email"
              icon={Mail}
              value={forgotEmail}
              onChange={(value) => setForgotEmail(value)}
              placeholder="nama@email.com"
            />
            <SubmitButton pending={forgotRequestMutation.isPending} label="Kirim Kode OTP" pendingLabel="Mengirim OTP..." />
          </form>
        </CardContent>
      </Card>,
    );
  }

  if (viewMode === "forgot-reset") {
    return renderShell(
      <Card className="shadow-2xl">
        <CardHeader>
          <button
            type="button"
            onClick={() => switchMode("forgot-request")}
            className="mb-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Masukkan kode OTP dan password baru Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
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
            <FieldError message={errors.resetOtp || errors.newPassword} />
            <IconInput
              id="resetOtp"
              label="Kode OTP"
              icon={Key}
              value={resetData.otp}
              onChange={(value) => setResetData({ ...resetData, otp: value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="6 digit OTP"
            />
            <PasswordInput
              id="newPassword"
              label="Password Baru"
              value={resetData.newPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              onChange={(value) => setResetData({ ...resetData, newPassword: value })}
            />
            <SubmitButton pending={forgotResetMutation.isPending} label="Reset Password" pendingLabel="Menyimpan..." />
          </form>
        </CardContent>
      </Card>,
    );
  }

  return renderShell(
    <Card className="shadow-2xl">
      <CardHeader>
        <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "login" ? "bg-white text-primary shadow-sm" : "text-gray-500"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "register" ? "bg-white text-primary shadow-sm" : "text-gray-500"
            }`}
          >
            Daftar
          </button>
        </div>
        <CardTitle className="pt-4 text-2xl">
          {viewMode === "register" ? "Daftar Calon Jamaah" : "Masuk"}
        </CardTitle>
        <CardDescription>
          {viewMode === "register"
            ? "Buat akun untuk melihat paket dan mulai konsultasi perjalanan umroh."
            : "Masukkan email dan password Anda untuk melanjutkan."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errors.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {viewMode === "register" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!validateRegister()) return;
              registerMutation.mutate({
                ...registerData,
                sourceType: "GENERAL",
                sourceSlug: null,
              });
            }}
            className="space-y-4"
          >
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              value={registerData.honeypot}
              onChange={(e) => setRegisterData({ ...registerData, honeypot: e.target.value })}
            />
            <IconInput
              id="fullName"
              label="Nama Lengkap"
              icon={User}
              value={registerData.fullName}
              onChange={(value) => setRegisterData({ ...registerData, fullName: value })}
              placeholder="Nama sesuai identitas"
              error={errors.fullName}
            />
            <IconInput
              id="registerEmail"
              label="Email"
              type="email"
              icon={Mail}
              value={registerData.email}
              onChange={(value) => setRegisterData({ ...registerData, email: value })}
              placeholder="nama@email.com"
              error={errors.registerEmail}
            />
            <IconInput
              id="phone"
              label="Nomor WhatsApp"
              icon={Phone}
              value={registerData.phone}
              onChange={(value) => setRegisterData({ ...registerData, phone: value })}
              placeholder="081234567890 / +6281234567890"
              error={errors.phone}
            />
            <PasswordInput
              id="registerPassword"
              label="Password"
              value={registerData.password}
              show={showRegisterPassword}
              onToggle={() => setShowRegisterPassword(!showRegisterPassword)}
              onChange={(value) => setRegisterData({ ...registerData, password: value })}
              error={errors.registerPassword}
            />
            <PasswordInput
              id="confirmPassword"
              label="Konfirmasi Password"
              value={registerData.confirmPassword}
              show={showRegisterPassword}
              onToggle={() => setShowRegisterPassword(!showRegisterPassword)}
              onChange={(value) => setRegisterData({ ...registerData, confirmPassword: value })}
              error={errors.confirmPassword}
            />
            <SubmitButton pending={registerMutation.isPending} label="Daftar" pendingLabel="Mendaftarkan..." />
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (validateLogin()) loginMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <IconInput
              id="email"
              label="Email"
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="nama@email.com"
              error={errors.email}
            />
            <PasswordInput
              id="password"
              label="Password"
              value={formData.password}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              onChange={(value) => setFormData({ ...formData, password: value })}
              error={errors.password}
            />
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => switchMode("forgot-request")}
              >
                Lupa Password?
              </button>
            </div>
            <SubmitButton pending={loginMutation.isPending} label="Masuk" pendingLabel="Memproses..." />
          </form>
        )}
      </CardContent>
    </Card>,
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-500">{message}</p>;
}

function IconInput({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = "text",
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: ComponentType<{ className?: string }>;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder="Minimal 8 karakter"
          className="pl-10 pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <Button
      type="submit"
      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
      size="lg"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

// dashboard/src/app/(dashboard)/admin/profile/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { accountService } from "@/services/accountService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Key,
  LogOut,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AdminAccountPage() {
  const { logout, user } = useAuthStore();
  const { toast } = useToast();

  // States
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false); // ✅ GANTI EMAIL
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState(""); // ✅ GANTI EMAIL
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&]/.test(newPassword);

  // Logout countdown state
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);
  const [logoutMessage, setLogoutMessage] = useState({ title: "", description: "" }); // ✅ GANTI EMAIL MESSAGES

  // Auto logout effect
  useEffect(() => {
    if (logoutCountdown === null) return;

    if (logoutCountdown <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      setLogoutCountdown(logoutCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [logoutCountdown, logout]);

  // Request OTP Password Mutation
  const requestOTPMutation = useMutation({
    mutationFn: () => accountService.requestPasswordOTP(),
    onSuccess: (data) => {
      setOtpSent(true);
      setCountdown(60);
      startCountdown();
      toast({
        title: "✅ OTP Terkirim",
        description: `Kode OTP telah dikirim ke ${data.data?.email || "email Anda"}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Gagal mengirim OTP",
      });
    },
  });

  // ✅ Request OTP Email Mutation
  const requestEmailOTPMutation = useMutation({
    mutationFn: () => accountService.requestEmailOTP(),
    onSuccess: (data) => {
      setOtpSent(true);
      setCountdown(60);
      startCountdown();
      toast({
        title: "✅ OTP Terkirim",
        description: `Kode OTP telah dikirim ke ${data.data?.email || "email Anda"}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Gagal mengirim OTP",
      });
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: () => accountService.changePassword(otp, newPassword),
    onSuccess: () => {
      setPasswordDialogOpen(false);
      resetForm();
      setLogoutMessage({
        title: "Password Berhasil Diubah!",
        description: "Silakan login kembali dengan password baru",
      });
      setLogoutCountdown(3);

      toast({
        title: "✅ Password Berhasil Diubah",
        description: "Silakan login kembali dengan password baru",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      const firstValidationError = error.response?.data?.errors?.[0]?.message;
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description:
          firstValidationError ||
          error.response?.data?.message ||
          "Gagal mengubah password",
      });
    },
  });

  // ✅ Change Email Mutation
  const changeEmailMutation = useMutation({
    mutationFn: () => accountService.changeEmail(otp, newEmail),
    onSuccess: () => {
      setEmailDialogOpen(false);
      resetForm();
      setLogoutMessage({
        title: "Email Berhasil Diubah!",
        description: "Silakan login kembali dengan email baru",
      });
      setLogoutCountdown(3);

      toast({
        title: "✅ Email Berhasil Diubah",
        description: "Silakan login kembali dengan email baru",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Gagal mengubah email",
      });
    },
  });

  // Countdown timer
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset form
  const resetForm = () => {
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail(""); // ✅ GANTI EMAIL
    setShowPassword(false);
    setCountdown(0);
  };

  // Validate & Submit Change Password
  const handleChangePassword = () => {
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: "Masukkan 6 digit OTP" });
      return;
    }
    if (!hasMinLength) {
      toast({ variant: "destructive", title: "Password minimal 8 karakter" });
      return;
    }
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      toast({
        variant: "destructive",
        title: "Password belum memenuhi syarat",
        description:
          "Gunakan huruf besar, huruf kecil, angka, dan karakter khusus (@$!%*?&)",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Konfirmasi password tidak cocok",
      });
      return;
    }
    changePasswordMutation.mutate();
  };

  // ✅ Validate & Submit Change Email
  const handleChangeEmail = () => {
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: "Masukkan 6 digit OTP" });
      return;
    }
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      toast({ variant: "destructive", title: "Masukkan format email yang valid" });
      return;
    }
    if (newEmail === user?.email) {
      toast({ variant: "destructive", title: "Email baru tidak boleh sama dengan email saat ini" });
      return;
    }
    changeEmailMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* LOGOUT COUNTDOWN OVERLAY */}
      {logoutCountdown !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {logoutMessage.title}
            </h2>
            <p className="text-gray-600 mb-4">{logoutMessage.description}</p>
            <div className="text-5xl font-bold text-primary mb-4">
              {logoutCountdown}
            </div>
            <p className="text-sm text-gray-500">
              Menunggu pemutusan sesi...
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Keamanan Akun</h1>
          <p className="text-gray-500 mt-1">Kelola password dan keamanan</p>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.email}</p>
                  <Badge variant="outline" className="bg-green-50 text-green-700 h-5 px-1.5 text-[10px]">
                    Verified
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => {
                resetForm();
                setEmailDialogOpen(true);
              }}
            >
              Ubah Email
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">No. Telepon</p>
                <p className="font-medium">{user.phone || "-"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Keamanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => {
              resetForm();
              setPasswordDialogOpen(true);
            }}
          >
            <span className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Ubah Password
            </span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full text-red-500 border-red-200 hover:bg-red-50"
        onClick={logout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Keluar dari Akun
      </Button>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>
              {!otpSent
                ? "Kami akan mengirim kode OTP ke email Anda"
                : "Masukkan kode OTP dan password baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!otpSent ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">OTP akan dikirim ke:</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <Button
                  onClick={() => requestOTPMutation.mutate()}
                  disabled={requestOTPMutation.isPending}
                  className="w-full"
                >
                  {requestOTPMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Kode OTP
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-xs text-amber-900">
                    Password wajib memenuhi semua syarat: minimal 8 karakter,
                    huruf besar, huruf kecil, angka, dan karakter khusus
                    (`@$!%*?&`). Jika belum memenuhi, password tidak bisa disimpan.
                  </AlertDescription>
                </Alert>

                {/* OTP Input */}
                <div className="space-y-2">
                  <Label>Kode OTP</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Masukkan 6 digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Cek email Anda</span>
                    {countdown > 0 ? (
                      <span className="text-gray-400">
                        Kirim ulang dalam {countdown}s
                      </span>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => requestOTPMutation.mutate()}
                        disabled={requestOTPMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Kirim Ulang
                      </Button>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Password tidak cocok</p>
                  )}
                </div>

                {/* Password Hints */}
                <Alert>
                  <AlertDescription className="text-xs">
                    <ul className="list-disc list-inside space-y-1">
                      <li
                        className={
                          hasMinLength ? "text-green-600" : "text-gray-500"
                        }
                      >
                        Minimal 8 karakter
                      </li>
                      <li
                        className={
                          hasUppercase ? "text-green-600" : "text-gray-500"
                        }
                      >
                        Huruf besar
                      </li>
                      <li
                        className={
                          hasLowercase ? "text-green-600" : "text-gray-500"
                        }
                      >
                        Huruf kecil
                      </li>
                      <li
                        className={
                          hasNumber ? "text-green-600" : "text-gray-500"
                        }
                      >
                        Angka
                      </li>
                      <li
                        className={
                          hasSpecialChar ? "text-green-600" : "text-gray-500"
                        }
                      >
                        Karakter khusus (@$!%*?&)
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {otpSent && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={
                  changePasswordMutation.isPending ||
                  otp.length !== 6 ||
                  !hasMinLength ||
                  !hasUppercase ||
                  !hasLowercase ||
                  !hasNumber ||
                  !hasSpecialChar ||
                  newPassword !== confirmPassword
                }
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Ubah Password"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ EMAIL CHANGE DIALOG */}
      <Dialog
        open={emailDialogOpen}
        onOpenChange={(open) => {
          setEmailDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Ubah Email
            </DialogTitle>
            <DialogDescription>
              {!otpSent
                ? "Kami akan mengirim kode OTP ke email Anda saat ini"
                : "Masukkan kode OTP dan email baru Anda"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!otpSent ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verifikasi email lama:</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <Button
                  onClick={() => requestEmailOTPMutation.mutate()}
                  disabled={requestEmailOTPMutation.isPending}
                  className="w-full"
                >
                  {requestEmailOTPMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Kirim Kode OTP
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Kode OTP</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 digit OTP dari email lama"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Baru</Label>
                  <Input
                    type="email"
                    placeholder="nama@email baru.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 italic">
                    * Pastikan email baru aktif. Anda akan diminta login ulang.
                  </p>
                </div>

                <div className="flex items-center justify-center text-xs">
                  {countdown > 0 ? (
                    <span className="text-gray-400">
                      Kirim ulang OTP dalam {countdown}s
                    </span>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => requestEmailOTPMutation.mutate()}
                      disabled={requestEmailOTPMutation.isPending}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Kirim Ulang OTP
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {otpSent && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleChangeEmail}
                disabled={
                  changeEmailMutation.isPending ||
                  otp.length !== 6 ||
                  !newEmail
                }
              >
                {changeEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Ganti Email"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

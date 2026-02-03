// dashboard/src/app/(mobile)/jamaah/account/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { accountService } from "@/services/accountService";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomNav } from "@/components/mobile/BottomNav";
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

export default function AccountInfoPage() {
  const { logout, user } = useAuthStore();
  const { toast } = useToast();

  // States
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // ✅ Logout countdown state
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  // ✅ Auto logout effect
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

  // Fetch profile
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-profile"],
    queryFn: () => jamaahSelfService.getProfile(),
  });

  const profile = data?.data;

  // Request OTP Mutation
  const requestOTPMutation = useMutation({
    mutationFn: () => accountService.requestPasswordOTP(),
    onSuccess: (data) => {
      setOtpSent(true);
      setCountdown(60);
      startCountdown();
      toast({
        title: "✅ OTP Terkirim",
        description: `Kode OTP telah dikirim ke ${data.data?.email}`,
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

  // ✅ Change Password Mutation dengan auto logout
  const changePasswordMutation = useMutation({
    mutationFn: () => accountService.changePassword(otp, newPassword),
    onSuccess: () => {
      setPasswordDialogOpen(false);
      resetForm();

      // ✅ Mulai countdown logout (3 detik)
      setLogoutCountdown(3);

      toast({
        title: "✅ Password Berhasil Diubah",
        description: "Silakan login kembali dengan password baru",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: error.response?.data?.message || "Gagal mengubah password",
      });
    },
  });

  // Countdown timer for OTP resend
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
    setShowPassword(false);
    setCountdown(0);
  };

  // Validate & Submit
  const handleChangePassword = () => {
    if (!otp || otp.length !== 6) {
      toast({ variant: "destructive", title: "Masukkan 6 digit OTP" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password minimal 8 karakter" });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ✅ LOGOUT COUNTDOWN OVERLAY */}
      {logoutCountdown !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Password Berhasil Diubah!
            </h2>
            <p className="text-gray-600 mb-4">Anda akan logout dalam</p>
            <div className="text-5xl font-bold text-[var(--color-primary)] mb-4">
              {logoutCountdown}
            </div>
            <p className="text-sm text-gray-500">
              Silakan login kembali dengan password baru
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/jamaah">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Info Akun</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-600)] p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                {profile?.fotoUrl ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${profile.fotoUrl}`}
                    alt="Foto"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {profile?.user?.fullName || user?.fullName}
                </h2>
                <p className="text-sm text-white/70">
                  {profile?.bookingNumber}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--color-primary)]" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">
                    {profile?.user?.email || user?.email}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Terverifikasi
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">No. HP</p>
                  <p className="text-sm font-medium">
                    {profile?.user?.phone || user?.phone || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium capitalize">
                    {user?.role?.toLowerCase() || "jamaah"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4 text-[var(--color-primary)]" />
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
      </div>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[var(--color-primary)]" />
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
              // Step 1: Request OTP
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">OTP akan dikirim ke:</p>
                  <p className="font-medium">{profile?.user?.email}</p>
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
              // Step 2: Enter OTP & New Password
              <div className="space-y-4">
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
                          newPassword.length >= 8
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        Minimal 8 karakter
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        Huruf besar
                      </li>
                      <li
                        className={
                          /[0-9]/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        Angka
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
                  newPassword.length < 8 ||
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

      <BottomNav role="JAMAAH" />
    </div>
  );
}

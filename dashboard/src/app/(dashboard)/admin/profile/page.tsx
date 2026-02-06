// dashboard/src/app/(dashboard)/admin/profile/page.tsx
"use client";

import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Settings,
  ChevronRight,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function AdminProfilePage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.fullName}
              </h2>
              <p className="text-gray-500">{user.email}</p>
              <Badge className="mt-2" variant="secondary">
                {user.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Terverifikasi
            </Badge>
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

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Pengaturan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Account & Security */}
          <Link href="/admin/profile/account">
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-3 mb-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Keamanan Akun</p>
                  <p className="text-xs text-gray-500">Ubah password</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Button>
          </Link>

          {/* Company Profile - Only for ADMIN */}
          {user.role === "ADMIN" && (
            <Link href="/admin/settings/company">
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Profil Perusahaan</p>
                    <p className="text-xs text-gray-500">
                      Kelola data perusahaan
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

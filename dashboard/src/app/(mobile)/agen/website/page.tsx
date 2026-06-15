"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "@/services/adminService";
import { ProfileGuard } from "@/components/agen/ProfileGuard";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Copy,
  Loader2,
  Instagram,
  Mail,
  Facebook,
  Video,
  Youtube,
  MessageCircle,
  Save,
  ImagePlus,
  Palette,
} from "lucide-react";

const APP_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

type WebsiteFormData = {
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  landingPrimaryColor?: string;
  landingAccentColor?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AgenWebsitePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
    staleTime: 30000,
  });

  const profile = data?.data;
  const agentData = profile?.agentData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<WebsiteFormData>({
    values: {
      phone: profile?.phone || "",
      email: profile?.email || "",
      instagram: agentData?.instagram || "",
      facebook: agentData?.facebook || "",
      tiktok: agentData?.tiktok || "",
      youtube: agentData?.youtube || "",
      landingPrimaryColor: agentData?.landingPrimaryColor || "#0A2C45",
      landingAccentColor: agentData?.landingAccentColor || "#FFC107",
    },
  });

  const websiteSlug = useMemo(() => {
    if (profile?.fullName) return slugify(profile.fullName);
    if (agentData?.nickname) return slugify(agentData.nickname);
    return "nama-agen";
  }, [profile?.fullName, agentData?.nickname]);

  const landingUrl = `${APP_BASE_URL.replace(/\/$/, "")}/landing/?agent=${encodeURIComponent(websiteSlug)}`;

  const saveMutation = useMutation({
    mutationFn: (payload: WebsiteFormData) =>
      adminService.agenProfile.updateMyProfile({
        phone: payload.phone,
        email: payload.email,
        instagram: payload.instagram,
        facebook: payload.facebook,
        tiktok: payload.tiktok,
        youtube: payload.youtube,
        landingPrimaryColor: payload.landingPrimaryColor,
        landingAccentColor: payload.landingAccentColor,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      toast({ title: "Pengaturan website tersimpan" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error?.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => adminService.agenProfile.uploadLandingLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      toast({ title: "Logo landing berhasil diupload" });
      setLogoFile(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal upload logo",
        description: error?.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Berhasil disalin",
        description: `${label} sudah masuk clipboard.`,
      });
    } catch {
      toast({
        title: "Gagal menyalin",
        description: "Silakan salin manual.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (formData: WebsiteFormData) => {
    saveMutation.mutate(formData);
  };

  const previewPrimary = watch("landingPrimaryColor") || "#0A2C45";
  const previewAccent = watch("landingAccentColor") || "#FFC107";

  return (
    <ProfileGuard requireComplete={true}>
      <div className="min-h-screen bg-slate-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white p-6 pb-10 rounded-b-[2rem] shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/agen">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Kelola Website</h1>
                <p className="text-sm text-white/75">Landing page agen & branding custom</p>
              </div>
            </div>
            <Badge className="bg-amber-300 text-amber-950 border-0">Beta</Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 -mt-4 space-y-4">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-600" />
                URL Landing Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyiapkan URL...
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Slug agen</p>
                    <div className="flex items-center gap-2">
                      <Input value={websiteSlug} readOnly className="font-mono" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(websiteSlug, "Slug")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Link publik</p>
                    <div className="flex items-center gap-2">
                      <Input value={landingUrl} readOnly className="font-mono text-sm" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(landingUrl, "Link")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <a href={landingUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-emerald-600" />
                Logo Landing Page Agen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-white border flex items-center justify-center overflow-hidden">
                  {agentData?.landingLogo ? (
                    <img
                      src={getImageUrl(agentData.landingLogo)}
                      alt="Logo Landing"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Globe className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                type="button"
                onClick={() => logoFile && uploadLogoMutation.mutate(logoFile)}
                disabled={!logoFile || uploadLogoMutation.isPending}
              >
                {uploadLogoMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  "Upload Logo"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600" />
                Warna Landing Page (2 warna)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Warna utama</label>
                  <Input type="color" {...register("landingPrimaryColor")} className="h-11 p-1" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Warna aksen</label>
                  <Input type="color" {...register("landingAccentColor")} className="h-11 p-1" />
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-xs text-gray-500 mb-2">Preview warna:</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">Warna utama</p>
                    <div className="h-10 rounded-lg" style={{ backgroundColor: previewPrimary }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">Warna aksen</p>
                    <div className="h-10 rounded-lg" style={{ backgroundColor: previewAccent }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                Kontak & Sosial Media (Opsional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-600">WhatsApp</label>
                <Input {...register("phone")} placeholder="08xxxxxxxxxx" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <Input type="email" {...register("email")} placeholder="nama@email.com" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </label>
                <Input {...register("instagram")} placeholder="username atau link" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </label>
                <Input {...register("facebook")} placeholder="username atau link" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <Video className="h-3.5 w-3.5" /> TikTok
                </label>
                <Input {...register("tiktok")} placeholder="username atau link" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <Youtube className="h-3.5 w-3.5" /> YouTube
                </label>
                <Input {...register("youtube")} placeholder="https://youtube.com/@channel" />
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-20">
            <Button type="submit" className="w-full h-12" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan Website
                </>
              )}
            </Button>
          </div>
        </form>

        <BottomNav role="AGEN" />
      </div>
    </ProfileGuard>
  );
}

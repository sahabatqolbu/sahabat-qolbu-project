// dashboard/src/app/(mobile)/agen/register/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Loader2,
  Send,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Users,
  Star,
  DollarSign,
  Award,
  Info,
  User,
  MapPin,
  CreditCard,
  FileText,
  Instagram,
  Facebook,
  Share2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  fullNameKtp: string;
  nickname: string;
  birthPlace: string;
  birthDate: string;
  nik: string;
  address: string;
  province: string;
  city: string;
  postalCode: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  customPurpose: string;
  recruiterCode: string;
  recruiterName: string;
}

export default function AgenRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPurposes, setSelectedPurposes] = useState<number[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [ktpPreview, setKtpPreview] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");

  const { register, reset, watch, getValues } = useForm<FormData>();
  const watchedValues = watch();

  // ===== FETCH DATA =====
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["agen-profile"],
    queryFn: () => adminService.agenProfile.getMyProfile(),
    staleTime: 30000,
  });

  const { data: requirementsData } = useQuery({
    queryKey: ["agent-requirements"],
    queryFn: () => adminService.agentRequirements.getAll({ isActive: true }),
    staleTime: 60000,
  });

  const { data: purposesData } = useQuery({
    queryKey: ["agent-purposes"],
    queryFn: () => adminService.agentPurposes.getAll({ isActive: true }),
    staleTime: 60000,
  });

  const { data: levelsData, isLoading: levelsLoading } = useQuery({
    queryKey: ["agent-levels"],
    queryFn: () => adminService.agentLevels.getAll(),
    staleTime: 60000,
  });

  const profile = profileData?.data;
  const agentData = profile?.agentData;
  const requirements = requirementsData?.data || [];
  const purposes = purposesData?.data || [];
  const levels = levelsData?.data || [];
  const selectedLevel = levels.find((l: any) => l.id === selectedLevelId);

  // ===== REDIRECT jika sudah APPROVED =====
  useEffect(() => {
    if (!profileLoading && agentData?.status === "APPROVED") {
      router.push("/agen");
    }
    if (!profileLoading && agentData?.status === "PENDING") {
      router.push("/agen");
    }
  }, [profileLoading, agentData?.status, router]);

  // ===== HELPER: Get form snapshot =====
  const getFormSnapshot = useCallback(() => {
    return JSON.stringify({
      ...getValues(),
      selectedPurposes,
      agreedToTerms,
      selectedLevelId,
      ktpPreview,
    });
  }, [getValues, selectedPurposes, agreedToTerms, selectedLevelId, ktpPreview]);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (!profile || isFormInitialized || levelsLoading) return;

    reset({
      fullName: profile.fullName || agentData?.fullNameKtp || "",
      email: profile.email || "",
      phone: profile.phone || agentData?.phone || "",
      fullNameKtp: agentData?.fullNameKtp || "",
      nickname: agentData?.nickname || "",
      birthPlace: agentData?.birthPlace || "",
      birthDate: agentData?.birthDate
        ? new Date(agentData.birthDate).toISOString().split("T")[0]
        : "",
      nik: agentData?.nik || "",
      address: agentData?.address || "",
      province: agentData?.province || "",
      city: agentData?.city || "",
      postalCode: agentData?.postalCode || "",
      instagram: agentData?.instagram || "",
      tiktok: agentData?.tiktok || "",
      facebook: agentData?.facebook || "",
      accountName: agentData?.accountName || "",
      accountNumber: agentData?.accountNumber || "",
      bankName: agentData?.bankName || "",
      customPurpose: agentData?.customPurpose || "",
      recruiterCode: agentData?.recruiterCode || "",
      recruiterName: agentData?.recruiterName || "",
    });

    if (agentData?.purposes) {
      try {
        const parsed =
          typeof agentData.purposes === "string"
            ? JSON.parse(agentData.purposes)
            : agentData.purposes;
        setSelectedPurposes(parsed || []);
      } catch {}
    }

    if (agentData?.agreedRequirements) {
      try {
        const parsed =
          typeof agentData.agreedRequirements === "string"
            ? JSON.parse(agentData.agreedRequirements)
            : agentData.agreedRequirements;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAgreedToTerms(true);
        }
      } catch {}
    }

    if (agentData?.ktpPhoto) setKtpPreview(agentData.ktpPhoto);

    const currentStar = agentData?.currentStar ?? 0;
    const matchedLevel = levels.find((l: any) => l.star === currentStar);
    if (matchedLevel) {
      setSelectedLevelId(matchedLevel.id);
    } else if (agentData?.currentLevelId) {
      setSelectedLevelId(agentData.currentLevelId);
    }

    setIsFormInitialized(true);
    setHasUnsavedChanges(false);

    setTimeout(() => {
      lastSavedDataRef.current = getFormSnapshot();
    }, 100);
  }, [
    profile,
    agentData,
    isFormInitialized,
    reset,
    levelsLoading,
    levels,
    getFormSnapshot,
  ]);

  // ===== TRACK CHANGES =====
  useEffect(() => {
    if (!isFormInitialized) return;
    const currentSnapshot = getFormSnapshot();
    const hasChanges = currentSnapshot !== lastSavedDataRef.current;
    if (hasChanges !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges);
    }
  }, [
    watchedValues,
    selectedPurposes,
    agreedToTerms,
    selectedLevelId,
    ktpPreview,
    isFormInitialized,
    getFormSnapshot,
    hasUnsavedChanges,
  ]);

  // ===== AUTO-SAVE =====
  useEffect(() => {
    if (!isFormInitialized || !hasUnsavedChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    watchedValues,
    selectedPurposes,
    agreedToTerms,
    selectedLevelId,
    ktpPreview,
    isFormInitialized,
    hasUnsavedChanges,
  ]);

  // ===== CALCULATE COMPLETION =====
  const calculateCompletion = useCallback(() => {
    const checks = {
      fullNameKtp: !!watchedValues.fullNameKtp,
      nik: !!watchedValues.nik,
      birthPlace: !!watchedValues.birthPlace,
      birthDate: !!watchedValues.birthDate,
      address: !!watchedValues.address,
      province: !!watchedValues.province,
      city: !!watchedValues.city,
      accountName: !!watchedValues.accountName,
      accountNumber: !!watchedValues.accountNumber,
      bankName: !!watchedValues.bankName,
      ktpPhoto: !!ktpPreview,
      levelId: !!selectedLevelId,
      terms: agreedToTerms,
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return Math.round((completed / total) * 100);
  }, [watchedValues, ktpPreview, selectedLevelId, agreedToTerms]);

  const completionPercentage = calculateCompletion();

  // ===== MUTATIONS =====
  const uploadKtpMutation = useMutation({
    mutationFn: (file: File) => adminService.agenProfile.uploadKtp(file),
    onSuccess: (data) => {
      setKtpPreview(data.data.url);
      toast({ title: "Foto KTP berhasil diupload" });
      setHasUnsavedChanges(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal upload KTP",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.agenProfile.updateMyProfile(data),
    onSuccess: () => {
      lastSavedDataRef.current = getFormSnapshot();
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => adminService.agenProfile.submitForApproval(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agen-profile"] });
      toast({
        title: "Berhasil submit!",
        description: "Data Anda sedang direview admin",
      });
      router.push("/agen");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal submit",
        description: error.response?.data?.message || "Terjadi kesalahan",
      });
    },
  });

  // ===== HANDLERS =====
  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "File tidak valid",
        description: "Hanya JPG, PNG, atau WEBP",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Maksimal 5MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setKtpPreview(reader.result as string);
    reader.readAsDataURL(file);

    uploadKtpMutation.mutate(file);
  };

  const togglePurpose = (id: number) => {
    setSelectedPurposes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const formData = getValues();
    return updateMutation.mutateAsync({
      ...formData,
      purposes: selectedPurposes,
      agreedRequirements: agreedToTerms
        ? requirements.map((r: any) => r.id)
        : [],
      currentLevelId: selectedLevelId,
      starObtainedBy: selectedLevel?.star === 0 ? "CLOSING" : "PAYMENT",
    });
  };

  const handleManualSave = async () => {
    try {
      await handleSave();
      toast({ title: "Data berhasil disimpan" });
    } catch {}
  };

  const handleSubmitForApproval = async () => {
    if (!selectedLevelId) {
      toast({ variant: "destructive", title: "Pilih level terlebih dahulu" });
      return;
    }

    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Persyaratan belum disetujui",
        description: "Centang persetujuan syarat & ketentuan",
      });
      return;
    }

    if (completionPercentage < 80) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: `Lengkapi minimal 80% (sekarang ${completionPercentage}%)`,
      });
      return;
    }

    if (hasUnsavedChanges) {
      await handleSave();
    }

    submitMutation.mutate();
  };

  if (profileLoading || levelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already approved/pending
  if (agentData?.status === "APPROVED" || agentData?.status === "PENDING") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-44 w-full md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-primary text-white p-6 pb-10">
        <div className="flex items-center gap-4 mb-6">
          {/* <Link href="/agen">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link> */}
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {agentData?.status === "REJECTED"
                ? "Perbaiki Data"
                : "Pendaftaran Agen"}
            </h1>
            <p className="text-sm text-primary-100 mt-0.5">
              Lengkapi data untuk aktivasi akun
            </p>
          </div>
        </div>

        {/* Rejection Note */}
        {agentData?.status === "REJECTED" && agentData?.rejectionNote && (
          <div className="bg-red-500/20 border border-red-300/30 rounded-xl p-3 mb-4">
            <p className="text-sm font-medium text-white">Alasan Penolakan:</p>
            <p className="text-sm text-red-100 mt-1">
              {agentData.rejectionNote}
            </p>
          </div>
        )}

        {/* Progress Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Kelengkapan Data</span>
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-secondary h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {completionPercentage < 80 && (
            <p className="text-xs text-primary-100 mt-2">
              Minimal 80% untuk submit
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form className="px-4 -mt-4 space-y-4">
        {/* Informasi Akun */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("fullName")}
                className="mt-1.5"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("email")}
                type="email"
                className="mt-1.5"
                placeholder="email@contoh.com"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                No. WhatsApp <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("phone")}
                className="mt-1.5"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data KTP */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" />
              Data KTP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">
                Nama Sesuai KTP <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("fullNameKtp")}
                className="mt-1.5"
                placeholder="Nama seperti di KTP"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Nama Panggilan</Label>
              <Input
                {...register("nickname")}
                className="mt-1.5"
                placeholder="Nama panggilan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-600">Tempat Lahir</Label>
                <Input
                  {...register("birthPlace")}
                  className="mt-1.5"
                  placeholder="Kota"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Tanggal Lahir</Label>
                <Input
                  {...register("birthDate")}
                  type="date"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                NIK <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("nik")}
                className="mt-1.5"
                placeholder="16 digit NIK"
                maxLength={16}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alamat */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              Alamat Domisili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">
                Alamat Lengkap <span className="text-red-500">*</span>
              </Label>
              <Textarea
                {...register("address")}
                rows={3}
                className="mt-1.5 resize-none"
                placeholder="Jalan, RT/RW, Kelurahan"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-600">
                  Provinsi <span className="text-red-500">*</span>
                </Label>
                <Input {...register("province")} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm text-gray-600">
                  Kota <span className="text-red-500">*</span>
                </Label>
                <Input {...register("city")} className="mt-1.5" />
              </div>
            </div>
            <div className="w-1/2">
              <Label className="text-sm text-gray-600">Kode Pos</Label>
              <Input
                {...register("postalCode")}
                className="mt-1.5"
                maxLength={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sosial Media */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Share2 className="h-4 w-4" />
              Sosial Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Instagram className="h-4 w-4" /> Instagram
              </Label>
              <Input
                {...register("instagram")}
                className="mt-1.5"
                placeholder="@username"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Facebook className="h-4 w-4" /> Facebook
              </Label>
              <Input
                {...register("facebook")}
                className="mt-1.5"
                placeholder="Nama profil"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">TikTok</Label>
              <Input
                {...register("tiktok")}
                className="mt-1.5"
                placeholder="@username"
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Users className="h-4 w-4" />
              Referral
            </CardTitle>
            <p className="text-xs text-gray-500">
              Opsional - jika direkrut agen lain
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">
                Kode Referral Perekrut
              </Label>
              <Input
                {...register("recruiterCode")}
                className="mt-1.5"
                placeholder="AG123456"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Nama Perekrut</Label>
              <Input
                {...register("recruiterName")}
                className="mt-1.5"
                placeholder="Nama agen"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rekening Bank */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <CreditCard className="h-4 w-4" />
              Rekening Bank
            </CardTitle>
            <p className="text-xs text-gray-500">Untuk pencairan komisi</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">
                Nama Pemilik <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("accountName")}
                className="mt-1.5"
                placeholder="Sesuai buku tabungan"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                Nomor Rekening <span className="text-red-500">*</span>
              </Label>
              <Input {...register("accountNumber")} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                Nama Bank <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("bankName")}
                className="mt-1.5"
                placeholder="BCA, BRI, dll"
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload KTP */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <ImageIcon className="h-4 w-4" />
              Foto KTP <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ktpPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100 mb-3">
                <img
                  src={ktpPreview}
                  alt="KTP"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white text-sm font-medium">
                    KTP Terupload
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-3 bg-gray-50">
                <ImageIcon className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  Upload foto KTP yang jelas
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG atau WEBP (Max 5MB)
                </p>
              </div>
            )}
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleKtpChange}
              disabled={uploadKtpMutation.isPending}
              className="text-sm"
            />
            {uploadKtpMutation.isPending && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Mengupload...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pilih Level */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Award className="h-4 w-4" />
              Pilih Level Agen <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Gratis:</strong> Naik level via closing.{" "}
                <strong>Berbayar:</strong> Bayar setelah diapprove.
              </p>
            </div>

            <div className="space-y-3">
              {levels.map((level: any) => (
                <div
                  key={level.id}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedLevelId === level.id
                      ? "border-primary bg-primary-50"
                      : "border-gray-100 hover:border-primary-200"
                  }`}
                  onClick={() => setSelectedLevelId(level.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedLevelId === level.id
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedLevelId === level.id && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {Array.from({ length: level.star || 0 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-secondary text-secondary"
                          />
                        ))}
                        {level.star === 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Starter
                          </span>
                        )}
                        <span className="font-semibold text-primary">
                          {level.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {level.description}
                      </p>
                      {level.star > 0 ? (
                        <div className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary-700 px-2.5 py-1 rounded-full">
                          {/* <DollarSign className="h-3.5 w-3.5" /> */}
                          <span className="text-sm font-bold">
                            Rp {parseInt(level.price).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">Gratis</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!selectedLevelId && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Wajib pilih level
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tujuan Bergabung */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" />
              Tujuan Bergabung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {purposes.map((purpose: any) => (
              <label
                key={purpose.id}
                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedPurposes.includes(purpose.id)}
                  onCheckedChange={() => togglePurpose(purpose.id)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">{purpose.title}</span>
              </label>
            ))}
            <Textarea
              {...register("customPurpose")}
              placeholder="Tujuan lainnya (opsional)"
              rows={2}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Syarat & Ketentuan */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <FileText className="h-4 w-4" />
              Syarat & Ketentuan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 max-h-56 overflow-y-auto space-y-3">
              {requirements.map((req: any, index: number) => (
                <div key={req.id} className="flex gap-3">
                  <span className="text-sm font-medium text-primary w-6 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <p className="text-sm text-gray-700">{req.title}</p>
                </div>
              ))}
            </div>

            <label
              className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                agreedToTerms
                  ? "border-primary bg-primary-50"
                  : "border-gray-200 hover:border-primary-200"
              }`}
            >
              <Checkbox
                checked={agreedToTerms}
                onCheckedChange={(checked) =>
                  setAgreedToTerms(checked as boolean)
                }
                className="mt-0.5"
              />
              <span className="text-sm font-medium text-gray-900">
                Saya telah membaca dan menyetujui semua syarat & ketentuan
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>

            {!agreedToTerms && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Wajib menyetujui
              </p>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 pb-6 md:px-8 z-50">
        <div className="text-center text-sm mb-3">
          {updateMutation.isPending ? (
            <span className="text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="text-amber-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> Ada perubahan belum tersimpan
            </span>
          ) : (
            <span className="text-emerald-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" /> Tersimpan otomatis
            </span>
          )}
        </div>

        <div className="space-y-2">
          {hasUnsavedChanges && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-primary text-primary"
              onClick={handleManualSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan Draft
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg"
            onClick={handleSubmitForApproval}
            disabled={
              submitMutation.isPending ||
              updateMutation.isPending ||
              !selectedLevelId ||
              !agreedToTerms ||
              completionPercentage < 80
            }
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" /> Submit untuk Review
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Star,
  Users,
  DollarSign,
  Instagram,
  Video,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Award,
  Image as ImageIcon,
  IdCard,
  Receipt,
  Building2,
  Target,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetailAgenPage({ params }: PageProps) {
  const { id: agentId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ===== FETCH AGENT =====
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: () => adminService.agen.getById(parseInt(agentId)),
  });

  // ===== FETCH MASTER DATA (untuk decode purposes & requirements) =====
  const { data: purposesData } = useQuery({
    queryKey: ["agent-purposes"],
    queryFn: () => adminService.agentPurposes.getAll({ isActive: true }),
  });

  const { data: requirementsData } = useQuery({
    queryKey: ["agent-requirements"],
    queryFn: () => adminService.agentRequirements.getAll({ isActive: true }),
  });

  const agent = data?.data;
  const agentData = agent?.agentData;
  const purposes = purposesData?.data || [];
  const requirements = requirementsData?.data || [];

  // ===== MUTATIONS =====
  const approveMutation = useMutation({
    mutationFn: () => adminService.agen.approve(parseInt(agentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      setApproveDialogOpen(false);
      toast({
        title: "✅ Agen Diapprove",
        description: "Agen telah disetujui dan aktif",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Approve",
        description: error.response?.data?.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) =>
      adminService.agen.reject(parseInt(agentId), note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      setRejectDialogOpen(false);
      setRejectionNote("");
      toast({
        title: "✅ Agen Direject",
        description: "Agen telah ditolak",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Reject",
        description: error.response?.data?.message,
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) {
      toast({
        variant: "destructive",
        title: "Alasan Penolakan Wajib",
        description: "Silakan isi alasan penolakan",
      });
      return;
    }
    rejectMutation.mutate(rejectionNote);
  };

  // Helper: Get Star Badge
  const getStarBadge = (star: number) => {
    const colors = [
      "bg-gray-100 text-gray-800",
      "bg-yellow-100 text-yellow-800",
      "bg-purple-100 text-purple-800",
    ];
    return colors[star] || colors[0];
  };

  // Helper: Parse JSON field safely
  const parseJSON = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  // Get selected purposes titles
  const selectedPurposes = parseJSON(agentData?.purposes);
  const purposesTitles = purposes
    .filter((p: any) => selectedPurposes.includes(p.id))
    .map((p: any) => p.title);

  // Get agreed requirements titles
  const agreedRequirements = parseJSON(agentData?.agreedRequirements);
  const agreedRequirementsTitles = requirements
    .filter((r: any) => agreedRequirements.includes(r.id))
    .map((r: any) => r.title);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Agen Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mt-2">
          Agen dengan ID {agentId} tidak ada dalam sistem
        </p>
        <Link href="/admin/agen">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Agen
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/agen">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Verifikasi Data Agen
            </h1>
            <p className="text-gray-600 mt-1">
              Periksa kelengkapan data sebelum approve
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/agen/${agentId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          {agentData?.status === "PENDING" && (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setRejectDialogOpen(true)}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setApproveDialogOpen(true)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {agentData?.status === "PENDING" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Menunggu Verifikasi
                </p>
                <p className="text-sm text-yellow-700">
                  Agen ini menunggu approval Anda. Periksa semua data dengan
                  teliti.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Note */}
      {agentData?.status === "REJECTED" && agentData?.rejectionNote && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Alasan Penolakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{agentData.rejectionNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {agent.fullName?.charAt(0) || "A"}
                </span>
              </div>
              <div>
                <CardTitle className="text-2xl">{agent.fullName}</CardTitle>
                <p className="text-gray-600">{agent.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={getStarBadge(agentData?.currentStar || 0)}
                  >
                    <div className="flex items-center gap-1">
                      {Array.from({
                        length: agentData?.currentStar || 0,
                      }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                      {(agentData?.currentStar || 0) === 0 && (
                        <span>Pra-Agent</span>
                      )}
                      {agentData?.currentStar === 1 && <span>Bintang 1</span>}
                      {agentData?.currentStar === 2 && <span>Bintang 2</span>}
                    </div>
                  </Badge>

                  {agentData?.isComplete ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Data Lengkap
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Data Belum Lengkap
                    </Badge>
                  )}

                  {agentData?.status === "PENDING" && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Menunggu Approval
                    </Badge>
                  )}
                  {agentData?.status === "APPROVED" && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                  {agentData?.status === "REJECTED" && (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Jamaah</div>
              <div className="text-3xl font-bold text-primary flex items-center gap-2">
                <Users className="h-6 w-6" />
                {agent.totalJamaah || 0}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 1. INFORMASI AKUN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Data login dan kontak utama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Nama Lengkap</p>
              <p className="font-medium">{agent.fullName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{agent.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">No. HP</p>
              <p className="font-medium">{agent.phone || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. DATA PRIBADI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Data Pribadi (KTP)
          </CardTitle>
          <CardDescription>Identitas lengkap sesuai KTP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">
                Nama Lengkap sesuai KTP{" "}
                {agentData?.fullNameKtp && (
                  <CheckCircle className="inline h-4 w-4 text-green-600 ml-1" />
                )}
              </p>
              <p className="font-medium">{agentData?.fullNameKtp || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama Panggilan</p>
              <p className="font-medium">{agentData?.nickname || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                NIK{" "}
                {agentData?.nik && (
                  <CheckCircle className="inline h-4 w-4 text-green-600 ml-1" />
                )}
              </p>
              <p className="font-medium font-mono">{agentData?.nik || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
              <p className="font-medium">
                {agentData?.birthPlace && agentData?.birthDate
                  ? `${agentData.birthPlace}, ${format(
                      new Date(agentData.birthDate),
                      "dd MMMM yyyy",
                      { locale: id },
                    )}`
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. ALAMAT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Alamat Lengkap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Alamat Lengkap</p>
              <p className="font-medium">{agentData?.address || "-"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Provinsi</p>
                <p className="font-medium">{agentData?.province || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kota/Kabupaten</p>
                <p className="font-medium">{agentData?.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kode Pos</p>
                <p className="font-medium">{agentData?.postalCode || "-"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. SOSIAL MEDIA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Sosial Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Instagram className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Instagram</p>
                <p className="font-medium">
                  {agentData?.instagram ? `@${agentData.instagram}` : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Video className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">TikTok</p>
                <p className="font-medium">
                  {agentData?.tiktok ? `@${agentData.tiktok}` : "-"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. REKENING BANK */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Rekening Bank (Komisi)
          </CardTitle>
          <CardDescription>
            Untuk transfer komisi hasil closing jamaah
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">
                Nama Bank{" "}
                {agentData?.bankName && (
                  <CheckCircle className="inline h-4 w-4 text-green-600 ml-1" />
                )}
              </p>
              <p className="font-medium">{agentData?.bankName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Nama Pemilik Rekening{" "}
                {agentData?.accountName && (
                  <CheckCircle className="inline h-4 w-4 text-green-600 ml-1" />
                )}
              </p>
              <p className="font-medium">{agentData?.accountName || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Nomor Rekening{" "}
                {agentData?.accountNumber && (
                  <CheckCircle className="inline h-4 w-4 text-green-600 ml-1" />
                )}
              </p>
              <p className="font-medium font-mono">
                {agentData?.accountNumber || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. DOKUMEN (KTP & BUKTI TRANSFER) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Dokumen Upload
          </CardTitle>
          <CardDescription>
            Foto KTP dan bukti transfer (jika bayar)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KTP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Foto KTP</p>
                {agentData?.ktpPhoto ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Belum Upload
                  </Badge>
                )}
              </div>
              {agentData?.ktpPhoto ? (
                <div
                  className="relative aspect-video rounded-lg border overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => setPreviewImage(agentData.ktpPhoto)}
                >
                  {/* ✅ Ganti Image ke img */}
                  <img
                    src={agentData.ktpPhoto}
                    alt="KTP"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Belum ada foto KTP</p>
                </div>
              )}
            </div>

            {/* Payment Proof */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Bukti Transfer
                </p>
                {agentData?.paymentProof ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                ) : (
                  <Badge variant="secondary">Opsional</Badge>
                )}
              </div>
              {agentData?.paymentProof ? (
                <div
                  className="relative aspect-video rounded-lg border overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => setPreviewImage(agentData.paymentProof)}
                >
                  {/* ✅ Ganti Image ke img */}
                  <img
                    src={agentData.paymentProof}
                    alt="Bukti Transfer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Tidak ada bukti</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. TUJUAN BERGABUNG */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tujuan Bergabung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {purposesTitles.length > 0 ? (
            <ul className="space-y-2">
              {/* FIXED: added :any and :number for idx */}
              {purposesTitles.map((title: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <span>{title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Tidak ada tujuan dipilih</p>
          )}

          {agentData?.customPurpose && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Tujuan Lainnya:</p>
              <p className="font-medium">{agentData.customPurpose}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 8. PERSYARATAN YANG DISETUJUI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Persyaratan yang Disetujui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agreedRequirementsTitles.length > 0 ? (
            <>
              <ul className="space-y-2">
                {/* FIXED: added :any and :number for idx */}
                {agreedRequirementsTitles.map((title: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">{title}</span>
                  </li>
                ))}
              </ul>
              {agreedRequirements.length === requirements.length && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Semua persyaratan telah disetujui
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">
              Belum ada persyaratan yang disetujui
            </p>
          )}
        </CardContent>
      </Card>

      {/* 9. REFERRAL (jika ada) */}
      {(agentData?.referralCode || agentData?.recruiterCode) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agentData?.referralCode && (
                <div>
                  <p className="text-sm text-gray-500">Kode Referral Sendiri</p>
                  <p className="font-medium font-mono text-lg">
                    {agentData.referralCode}
                  </p>
                </div>
              )}
              {agentData?.recruiterCode && (
                <div>
                  <p className="text-sm text-gray-500">
                    Direkrut oleh (Kode Referral)
                  </p>
                  <p className="font-medium">
                    {agentData.recruiterName || agentData.recruiterCode}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 10. TIMELINE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Terdaftar</p>
                <p className="font-medium">
                  {format(new Date(agent.createdAt), "dd MMMM yyyy HH:mm", {
                    locale: id,
                  })}
                </p>
              </div>
            </div>

            {agentData?.submittedAt && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submit untuk Approval</p>
                  <p className="font-medium">
                    {format(
                      new Date(agentData.submittedAt),
                      "dd MMMM yyyy HH:mm",
                      { locale: id },
                    )}
                  </p>
                </div>
              </div>
            )}

            {agentData?.approvedAt && (
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disetujui</p>
                  <p className="font-medium">
                    {format(
                      new Date(agentData.approvedAt),
                      "dd MMMM yyyy HH:mm",
                      { locale: id },
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* IMAGE PREVIEW DIALOG */}
      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Preview Dokumen</DialogTitle>
            </DialogHeader>
            <div className="relative w-full">
              {/* ✅ Ganti Image ke img */}
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* APPROVE DIALOG */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Agen</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menyetujui pendaftaran agen{" "}
              <strong>{agent.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Ya, Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Agen</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk agen{" "}
              <strong>{agent.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-note">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-note"
                placeholder="Tuliskan alasan penolakan..."
                rows={4}
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionNote("");
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionNote.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Ya, Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

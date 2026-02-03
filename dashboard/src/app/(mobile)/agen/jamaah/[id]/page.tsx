// dashboard/src/app/(mobile)/agen/jamaah/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
  Edit,
  Clock,
  Plane,
  Building2,
  Users,
  ShieldCheck,
  Eye,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Image,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { BottomNav } from "@/components/mobile/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function JamaahDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("biodata");

  const { data, isLoading, error } = useQuery({
    queryKey: ["jamaah-detail", id],
    queryFn: () => agenService.getJamaahById(id),
    enabled: !!id,
  });

  const jamaah = data?.data;

  // ===== HELPERS =====
  const formatCurrency = (amount: string | number | null | undefined) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
  };

  const formatShortDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy", { locale: localeId });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} berhasil dicopy!` });
  };

  // Payment Status Badge
  const getPaymentBadge = (status: string) => {
    const config: Record<string, { class: string; label: string; icon: any }> =
      {
        LUNAS: {
          class: "bg-green-100 text-green-700",
          label: "Lunas",
          icon: CheckCircle2,
        },
        CICILAN: {
          class: "bg-yellow-100 text-yellow-700",
          label: "Cicilan",
          icon: Clock,
        },
        BELUM_BAYAR: {
          class: "bg-red-100 text-red-700",
          label: "Belum Bayar",
          icon: XCircle,
        },
      };
    const cfg = config[status] || config.BELUM_BAYAR;
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.class} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  // Registration Status Badge
  const getRegistrationBadge = (status: string) => {
    const config: Record<string, { class: string; label: string }> = {
      DRAFT: { class: "bg-gray-100 text-gray-600", label: "Draft" },
      PENDING_DOCUMENT: {
        class: "bg-blue-100 text-blue-700",
        label: "Pending Dokumen",
      },
      PENDING_PAYMENT: {
        class: "bg-orange-100 text-orange-700",
        label: "Pending Bayar",
      },
      VERIFIED: { class: "bg-cyan-100 text-cyan-700", label: "Verified" },
      APPROVED: { class: "bg-green-100 text-green-700", label: "Approved" },
      REJECTED: { class: "bg-red-100 text-red-700", label: "Rejected" },
    };
    const cfg = config[status] || config.DRAFT;
    return <Badge className={cfg.class}>{cfg.label}</Badge>;
  };

  // Check Profile Completeness
  const checkProfileCompleteness = () => {
    if (!jamaah)
      return { isComplete: false, percentage: 0, missing: [], categories: {} };

    const requiredFields = [
      { key: "namaPaspor", label: "Nama Paspor", category: "biodata" },
      { key: "nik", label: "NIK", category: "biodata" },
      { key: "birthDate", label: "Tanggal Lahir", category: "biodata" },
      { key: "birthPlace", label: "Tempat Lahir", category: "biodata" },
      { key: "gender", label: "Jenis Kelamin", category: "biodata" },
      { key: "maritalStatus", label: "Status Pernikahan", category: "biodata" },
      { key: "address", label: "Alamat", category: "alamat" },
      { key: "province", label: "Provinsi", category: "alamat" },
      { key: "city", label: "Kota", category: "alamat" },
      { key: "passportNumber", label: "Nomor Paspor", category: "paspor" },
      {
        key: "passportExpiry",
        label: "Masa Berlaku Paspor",
        category: "paspor",
      },
      {
        key: "passportIssuePlace",
        label: "Tempat Terbit Paspor",
        category: "paspor",
      },
      {
        key: "emergencyName",
        label: "Nama Kontak Darurat",
        category: "emergency",
      },
      { key: "emergencyPhone", label: "No. HP Darurat", category: "emergency" },
      { key: "packageId", label: "Paket Umrah", category: "paket" },
      { key: "roomTypeMakkah", label: "Kamar Makkah", category: "paket" },
      { key: "roomTypeMadinah", label: "Kamar Madinah", category: "paket" },
    ];

    const requiredDocs = [
      { key: "fotoUrl", label: "Pas Foto", category: "dokumen" },
      { key: "ktpUrl", label: "KTP", category: "dokumen" },
      { key: "kkUrl", label: "Kartu Keluarga", category: "dokumen" },
      { key: "pasporUrl", label: "Scan Paspor", category: "dokumen" },
    ];

    const allFields = [...requiredFields, ...requiredDocs];
    const missing: { label: string; category: string }[] = [];
    let filled = 0;

    // Category tracking
    const categories: Record<
      string,
      { total: number; passed: number; complete: boolean }
    > = {};

    allFields.forEach((field) => {
      const value = jamaah[field.key as keyof typeof jamaah];
      const isFilled = value && value !== "" && value !== null;

      // Init category
      if (!categories[field.category]) {
        categories[field.category] = { total: 0, passed: 0, complete: false };
      }
      categories[field.category].total++;

      if (isFilled) {
        filled++;
        categories[field.category].passed++;
      } else {
        missing.push({ label: field.label, category: field.category });
      }
    });

    // Check category completeness
    Object.keys(categories).forEach((key) => {
      categories[key].complete =
        categories[key].passed === categories[key].total;
    });

    const total = allFields.length;
    const percentage = Math.round((filled / total) * 100);
    const isComplete = percentage >= 80;

    return { isComplete, percentage, missing, filled, total, categories };
  };

  const profileStatus = jamaah ? checkProfileCompleteness() : null;

  // Payment Progress
  const getPaymentProgress = () => {
    const hargaFinal = parseFloat(jamaah?.hargaFinal || "0");
    const totalPayment = parseFloat(jamaah?.totalPayment || "0");
    if (hargaFinal === 0) return 0;
    return Math.min(100, (totalPayment / hargaFinal) * 100);
  };

  // ===== LOADING & ERROR =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !jamaah) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">Data tidak ditemukan</p>
        <Button onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:max-w-md lg:mx-auto">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {jamaah.namaPaspor || jamaah.user?.fullName || "Belum Ada Nama"}
            </h1>
            <p className="text-sm opacity-80 font-mono">
              {jamaah.bookingNumber}
            </p>
          </div>
          <Link href={`/agen/jamaah/${id}/edit`}>
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 border border-white/40"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {getRegistrationBadge(jamaah.registrationStatus)}
          {getPaymentBadge(jamaah.statusPayment)}
          {jamaah.gender && (
            <Badge
              variant="outline"
              className="bg-white/20 text-white border-white/40"
            >
              {jamaah.gender === "PRIA" ? "👨 Pria" : "👩 Wanita"}
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 -mt-14 space-y-4">
        {/* ===== PROFILE CARD ===== */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {jamaah.fotoUrl ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${jamaah.fotoUrl}`}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>

              {/* Contact Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{jamaah.user?.email || "-"}</span>
                </div>
                {jamaah.user?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{jamaah.user.phone}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        copyToClipboard(jamaah.user.phone, "No. HP")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== PROFILE COMPLETENESS ===== */}
        {profileStatus && (
          <Card
            className={`border-2 ${
              profileStatus.isComplete
                ? "border-green-200 bg-green-50"
                : "border-orange-200 bg-orange-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <div
                  className={`h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                    profileStatus.isComplete ? "bg-green-100" : "bg-orange-100"
                  }`}
                >
                  <span
                    className={`text-xl font-bold ${
                      profileStatus.isComplete
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {profileStatus.percentage}%
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {profileStatus.isComplete ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">
                          Profil Lengkap
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-orange-800">
                          Belum Lengkap
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {profileStatus.filled} dari {profileStatus.total} data
                    terisi
                  </p>
                </div>
              </div>

              <Progress
                value={profileStatus.percentage}
                className={`h-2 mb-3 ${profileStatus.isComplete ? "" : "bg-orange-200"}`}
              />

              {/* Category Status */}
              <div className="flex flex-wrap gap-1 mb-3">
                {profileStatus.categories &&
                  Object.entries(profileStatus.categories).map(
                    ([key, value]: [string, any]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className={`text-xs ${
                          value.complete
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-white text-gray-600 border-gray-300"
                        }`}
                      >
                        {value.complete ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {key.charAt(0).toUpperCase() + key.slice(1)} (
                        {value.passed}/{value.total})
                      </Badge>
                    ),
                  )}
              </div>

              {/* Missing Fields */}
              {!profileStatus.isComplete &&
                profileStatus.missing.length > 0 && (
                  <div className="pt-3 border-t border-orange-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Data yang belum diisi:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {profileStatus.missing.slice(0, 6).map((field, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-white text-orange-700 border-orange-200"
                        >
                          {field.label}
                        </Badge>
                      ))}
                      {profileStatus.missing.length > 6 && (
                        <Badge variant="outline" className="text-xs bg-white">
                          +{profileStatus.missing.length - 6} lainnya
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* ===== SUMMARY CARDS ===== */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-3">
              <p className="text-xs text-gray-500">Harga Final</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(jamaah.hargaFinal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500">Total Dibayar</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(jamaah.totalPayment)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500">Sisa Tagihan</p>
              <p
                className={`text-lg font-bold ${
                  parseFloat(jamaah.outstanding || "0") > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(jamaah.outstanding)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500">Paket</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {jamaah.package?.name || (
                  <span className="text-orange-600 text-xs">Belum Pilih</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Progress */}
        {parseFloat(jamaah.hargaFinal || "0") > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Progress Pembayaran
                </span>
                <span className="text-sm font-bold text-primary">
                  {getPaymentProgress().toFixed(0)}%
                </span>
              </div>
              <Progress value={getPaymentProgress()} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* ===== TABS ===== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="biodata" className="text-xs px-2">
              <User className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Biodata</span>
            </TabsTrigger>
            <TabsTrigger value="paket" className="text-xs px-2">
              <Package className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Paket</span>
            </TabsTrigger>
            <TabsTrigger value="bayar" className="text-xs px-2">
              <CreditCard className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Bayar</span>
            </TabsTrigger>
            <TabsTrigger value="dokumen" className="text-xs px-2">
              <FileText className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Dokumen</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== BIODATA TAB ===== */}
          <TabsContent value="biodata" className="mt-4 space-y-4">
            {/* Data Akun */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Data Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nama Lengkap" value={jamaah.user?.fullName} />
                <InfoRow label="Email" value={jamaah.user?.email} />
                <InfoRow label="No. HP" value={jamaah.user?.phone} />
              </CardContent>
            </Card>

            {/* Data Pribadi */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-500" />
                  Data Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Nama Paspor"
                  value={jamaah.namaPaspor}
                  required
                />
                <InfoRow label="NIK" value={jamaah.nik} required mono />
                <InfoRow
                  label="Tempat, Tgl Lahir"
                  value={
                    jamaah.birthPlace || jamaah.birthDate
                      ? `${jamaah.birthPlace || "-"}, ${formatDate(jamaah.birthDate)}`
                      : null
                  }
                  required
                />
                <InfoRow
                  label="Jenis Kelamin"
                  value={
                    jamaah.gender === "PRIA"
                      ? "Laki-laki"
                      : jamaah.gender === "WANITA"
                        ? "Perempuan"
                        : null
                  }
                  required
                />
                <InfoRow
                  label="Status Pernikahan"
                  value={jamaah.maritalStatus?.replace(/_/g, " ")}
                />
              </CardContent>
            </Card>

            {/* Alamat */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Alamat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Alamat" value={jamaah.address} required />
                <InfoRow label="Provinsi" value={jamaah.province} required />
                <InfoRow label="Kota/Kab" value={jamaah.city} required />
                <InfoRow label="Kecamatan" value={jamaah.district} />
                <InfoRow label="Kode Pos" value={jamaah.postalCode} />
              </CardContent>
            </Card>

            {/* Data Paspor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  Data Paspor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Nomor Paspor"
                  value={jamaah.passportNumber}
                  required
                  mono
                />
                <InfoRow
                  label="Tempat Terbit"
                  value={jamaah.passportIssuePlace}
                  required
                />
                <InfoRow
                  label="Tanggal Terbit"
                  value={formatDate(jamaah.passportIssueDate)}
                />
                <InfoRow
                  label="Berlaku Sampai"
                  value={formatDate(jamaah.passportExpiry)}
                  required
                />
              </CardContent>
            </Card>

            {/* Kontak Darurat */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-5 w-5 text-amber-500" />
                  Kontak Darurat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nama" value={jamaah.emergencyName} required />
                <InfoRow
                  label="No. HP"
                  value={jamaah.emergencyPhone}
                  required
                />
                <InfoRow label="Hubungan" value={jamaah.emergencyRelation} />
              </CardContent>
            </Card>

            {/* Mahram (untuk wanita) */}
            {(jamaah.mahram || jamaah.gender === "WANITA") && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Data Mahram
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {jamaah.mahram ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {jamaah.mahram?.user?.fullName ||
                            jamaah.mahram?.namaPaspor ||
                            "-"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Hubungan: {jamaah.mahramRelation || "-"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm">Belum ada mahram yang dipilih</p>
                      <p className="text-xs text-gray-400">
                        Wajib untuk jamaah wanita
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== PAKET TAB ===== */}
          <TabsContent value="paket" className="mt-4 space-y-4">
            {/* Warning if no package */}
            {!jamaah.packageId && (
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      Paket Belum Dipilih
                    </p>
                    <p className="text-sm text-yellow-700">
                      Silakan edit untuk memilih paket
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Paket */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informasi Paket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nama Paket</p>
                  <p className="font-semibold text-primary">
                    {jamaah.package?.name || (
                      <span className="text-gray-400 italic">Belum Pilih</span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {jamaah.package?.type && (
                    <Badge variant="secondary">{jamaah.package.type}</Badge>
                  )}
                  <Badge variant="outline">
                    {jamaah.notePaket || "FULLSERVICE"}
                  </Badge>
                </div>

                {jamaah.package && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Plane className="h-3 w-3" /> Berangkat
                        </p>
                        <p className="font-medium text-sm">
                          {formatShortDate(jamaah.package.departureDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Plane className="h-3 w-3 rotate-180" /> Pulang
                        </p>
                        <p className="font-medium text-sm">
                          {formatShortDate(jamaah.package.returnDate)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Kamar Makkah
                    </p>
                    <p className="font-medium text-sm">
                      {jamaah.roomTypeMakkah || (
                        <span className="text-gray-400 italic text-xs">
                          Belum dipilih
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Kamar Madinah
                    </p>
                    <p className="font-medium text-sm">
                      {jamaah.roomTypeMadinah || (
                        <span className="text-gray-400 italic text-xs">
                          Belum dipilih
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rincian Harga */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rincian Harga</CardTitle>
              </CardHeader>
              <CardContent>
                {parseFloat(jamaah.hargaPaket || "0") === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Harga belum ditetapkan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Harga Paket</span>
                      <span className="font-medium">
                        {formatCurrency(jamaah.hargaPaket)}
                      </span>
                    </div>
                    {parseFloat(jamaah.potonganFeeAgen || "0") > 0 && (
                      <div className="flex justify-between py-2 text-green-600">
                        <span>- Fee Agen</span>
                        <span>{formatCurrency(jamaah.potonganFeeAgen)}</span>
                      </div>
                    )}
                    {parseFloat(jamaah.potonganPoinAgen || "0") > 0 && (
                      <div className="flex justify-between py-2 text-green-600">
                        <span>- Poin Agen</span>
                        <span>{formatCurrency(jamaah.potonganPoinAgen)}</span>
                      </div>
                    )}
                    {parseFloat(jamaah.potonganCashbackKK || "0") > 0 && (
                      <div className="flex justify-between py-2 text-green-600">
                        <span>- Cashback KK</span>
                        <span>{formatCurrency(jamaah.potonganCashbackKK)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Harga Final</span>
                      <span className="font-bold text-lg text-primary">
                        {formatCurrency(jamaah.hargaFinal)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Total Dibayar</span>
                      <span className="font-semibold">
                        {formatCurrency(jamaah.totalPayment)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Sisa Tagihan</span>
                      <span
                        className={`font-bold text-lg ${
                          parseFloat(jamaah.outstanding || "0") > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(jamaah.outstanding)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== PEMBAYARAN TAB ===== */}
          <TabsContent value="bayar" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Riwayat Pembayaran</span>
                  <Badge variant="outline">
                    {jamaah.payments?.length || 0} transaksi
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {formatCurrency(jamaah.totalPayment)} dari{" "}
                  {formatCurrency(jamaah.hargaFinal)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!jamaah.payments || jamaah.payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Belum ada pembayaran</p>
                    <p className="text-sm text-gray-400">
                      Pembayaran akan dicatat oleh admin
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jamaah.payments.map((payment: any, idx: number) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">
                              #{payment.paymentNumber}
                            </span>
                            {payment.verifiedAt ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-yellow-600 text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatShortDate(payment.paymentDate)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.paidBy || "-"} •{" "}
                            {payment.bank?.bankName || "-"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DOKUMEN TAB ===== */}
          <TabsContent value="dokumen" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dokumen Jamaah</CardTitle>
                <CardDescription>Status kelengkapan dokumen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "fotoUrl", label: "Pas Foto", required: true },
                    { key: "ktpUrl", label: "KTP", required: true },
                    { key: "kkUrl", label: "KK", required: true },
                    { key: "pasporUrl", label: "Paspor", required: true },
                    {
                      key: "bukuNikahUrl",
                      label: "Buku Nikah",
                      required: false,
                    },
                    {
                      key: "aktaLahirUrl",
                      label: "Akta Lahir",
                      required: false,
                    },
                    { key: "ijazahUrl", label: "Ijazah", required: false },
                    { key: "vaksinUrl", label: "Vaksin", required: false },
                    {
                      key: "meningitisUrl",
                      label: "Meningitis",
                      required: false,
                    },
                  ].map((doc) => {
                    const url = jamaah[doc.key as keyof typeof jamaah] as
                      | string
                      | null;
                    const isUploaded = !!url;

                    return (
                      <div key={doc.key} className="text-center">
                        <div
                          className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative ${
                            isUploaded
                              ? "border-green-300 bg-green-50"
                              : doc.required
                                ? "border-orange-300 bg-orange-50"
                                : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          {isUploaded ? (
                            <>
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${url}`}
                                alt={doc.label}
                                className="w-full h-full object-cover"
                              />
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
                              >
                                <Eye className="h-6 w-6 text-white" />
                              </a>
                            </>
                          ) : (
                            <FileText
                              className={`h-6 w-6 ${
                                doc.required
                                  ? "text-orange-300"
                                  : "text-gray-300"
                              }`}
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {doc.label}
                        </p>
                        <div className="flex justify-center mt-0.5">
                          {isUploaded ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : doc.required ? (
                            <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                          ) : (
                            <span className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ===== TIMESTAMPS ===== */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Dibuat: {formatShortDate(jamaah.createdAt)}
              </div>
              <div>Update: {formatShortDate(jamaah.updatedAt)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav role="AGEN" />
    </div>
  );
}

// ===== HELPER COMPONENT =====
function InfoRow({
  label,
  value,
  required,
  mono,
}: {
  label: string;
  value: any;
  required?: boolean;
  mono?: boolean;
}) {
  const isEmpty = !value || value === "-" || value === ", -";
  return (
    <div className="flex justify-between items-start py-1">
      <span className="text-gray-500 text-sm flex items-center gap-1">
        {label}
        {required && isEmpty && (
          <AlertCircle className="h-3 w-3 text-orange-500" />
        )}
      </span>
      <span
        className={`text-sm text-right max-w-[55%] ${
          isEmpty ? "text-gray-400 italic" : "font-medium text-gray-900"
        } ${mono ? "font-mono" : ""}`}
      >
        {isEmpty ? "Belum diisi" : value}
      </span>
    </div>
  );
}

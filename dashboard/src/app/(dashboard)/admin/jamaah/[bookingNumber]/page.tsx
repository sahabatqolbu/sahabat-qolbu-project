// dashboard/src/app/(dashboard)/admin/jamaah/[bookingNumber]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jamaahService } from "@/services/jamaahService";
import { adminService } from "@/services/adminService";
import { packageService } from "@/services/packageService";
import { masterService } from "@/services/masterService";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { ComponentType, useEffect, useState } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import {
  ArrowLeft,
  Edit,
  Loader2,
  User,
  Package,
  CreditCard,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plane,
  Building,
  Users,
  AlertCircle,
  Clock,
  Eye,
  Shield,
  AlertTriangle,
  Info,
  Star,
  UserCheck,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Undo2,
  ShieldCheck,
  ShieldX,
  Save,
} from "lucide-react";
import Link from "next/link";

interface InlineFormState {
  namaPaspor: string;
  nik: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  packageId: string;
  agenId: string;
  notePaket: string;
  roomTypeMakkah: string;
  roomTypeMadinah: string;
  hargaPaket: string;
  potonganFeeAgen: string;
  potonganPoinAgen: string;
  potonganCashbackKK: string;
  registrationStatus: string;
  notes: string;
  address?: string;
}

interface PackageOption {
  id: number;
  name: string;
  type?: string;
  price?: string;
  discountPrice?: string;
  hotelMakkahDouble?: number;
  hotelMakkahTriple?: number;
  hotelMakkahQuad?: number;
  hotelMakkahQuint?: number;
  hotelMadinahDouble?: number;
  hotelMadinahTriple?: number;
  hotelMadinahQuad?: number;
  hotelMadinahQuint?: number;
}

interface AgentOption {
  id: number;
  fullName: string;
  currentStar?: number;
}

interface BankOption {
  id: number;
  bankName: string;
  accountNumber: string;
}

interface PaymentItem {
  id: number;
  paymentNumber?: string;
  paymentDate?: string;
  paidBy?: string;
  amount?: string | number;
  proofStatus?: "UPLOADED" | "VERIFIED" | "REJECTED" | string;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  verifiedAt?: string | null;
  proofUrl?: string | null;
  bank?: {
    bankName?: string;
  };
}

interface JamaahRecord {
  [key: string]: unknown;
  bookingNumber?: string;
  namaPaspor?: string;
  user?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  package?: {
    name?: string;
    departureDate?: string;
    returnDate?: string;
  };
  agen?: {
    fullName?: string;
    currentStar?: number;
    user?: { fullName?: string };
  };
  mahram?: {
    namaPaspor?: string;
    user?: { fullName?: string };
  };
  profileCompleteness?: {
    categories?: Record<string, { complete: boolean; passed: number; total: number }>;
  };
  hargaFinal?: string;
  totalPayment?: string;
  outstanding?: string;
  statusPayment?: string;
  registrationStatus?: string;
  packageId?: number;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  dateOfBooking?: string;
  notePaket?: string;
  roomTypeMakkah?: string;
  roomTypeMadinah?: string;
  gender?: string;
  maritalStatus?: string;
  nik?: string;
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  province?: string;
  city?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  passportNumber?: string;
  passportIssuePlace?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
  agenId?: number;
  potonganFeeAgen?: string;
  potonganPoinAgen?: string;
  potonganCashbackKK?: string;
  marhamRelation?: string;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Terjadi kesalahan";
  }

  const payload = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return payload.response?.data?.message || "Terjadi kesalahan";
};

export default function JamaahDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const bookingNumber = params.bookingNumber as string;
  const isReadOnlyRole = user?.role !== "ADMIN";
  const roleBasePath =
    user?.role === "FINANCE" ? "/finance" : user?.role === "STAFF" ? "/staff" : "/admin";
  const jamaahBasePath = `${roleBasePath}/jamaah`;

  // ===== DIALOG STATES =====
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [rejectPaymentDialogOpen, setRejectPaymentDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState("");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editingSection, setEditingSection] = useState<
    "biodata" | "paket" | null
  >(null);
  const [inlineForm, setInlineForm] = useState<InlineFormState>({
    namaPaspor: "",
    nik: "",
    birthPlace: "",
    birthDate: "",
    gender: "",
    packageId: "",
    agenId: "",
    notePaket: "FULLSERVICE",
    roomTypeMakkah: "",
    roomTypeMadinah: "",
    hargaPaket: "0",
    potonganFeeAgen: "0",
    potonganPoinAgen: "0",
    potonganCashbackKK: "0",
    registrationStatus: "DRAFT",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    paidBy: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    bankId: "",
    notes: "",
  });

  // =====================================================
  // FETCH JAMAAH DETAIL
  // =====================================================
  const {
    data: jamaahResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["jamaah-detail", bookingNumber],
    queryFn: () => jamaahService.getByBookingNumber(bookingNumber),
    enabled: !!bookingNumber,
  });

  const jamaah = (jamaahResponse?.data || null) as JamaahRecord | null;
  const profileCompleteness = jamaah?.profileCompleteness;

  // =====================================================
  // FETCH PAYMENTS
  // =====================================================
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery({
    queryKey: ["jamaah-payments", bookingNumber],
    queryFn: () => jamaahService.getPayments(bookingNumber),
    enabled: !!bookingNumber,
  });

  const payments: PaymentItem[] = Array.isArray(paymentsResponse?.data)
    ? (paymentsResponse.data as PaymentItem[])
    : [];

  const { data: packagesResponse } = useQuery({
    queryKey: ["packages-dropdown-inline"],
    queryFn: () => packageService.getAll({ page: 1, limit: 100 }),
  });

  const packages: PackageOption[] = Array.isArray(packagesResponse?.data?.packages)
    ? (packagesResponse.data.packages as PackageOption[])
    : [];

  const { data: agenResponse } = useQuery({
    queryKey: ["agen-dropdown-inline"],
    queryFn: () => adminService.agen.getAll({ status: "APPROVED" }),
  });

  const agenList: AgentOption[] = Array.isArray(agenResponse?.data)
    ? (agenResponse.data as AgentOption[])
    : [];

  // =====================================================
  // FETCH BANKS
  // =====================================================
  const { data: banksResponse } = useQuery({
    queryKey: ["banks-active"],
    queryFn: () => masterService.banks.getActive(),
  });

  const banks: BankOption[] = Array.isArray(banksResponse?.data)
    ? (banksResponse.data as BankOption[])
    : [];

  // =====================================================
  // MUTATIONS
  // =====================================================
  const addPaymentMutation = useMutation({
    mutationFn: (data: {
      paidBy: string;
      paymentDate: string;
      amount: number;
      bankId?: number;
      notes?: string;
    }) => jamaahService.addPayment(bookingNumber, data),
    onSuccess: () => {
      toast({
        title: "✅ Pembayaran Ditambahkan",
        description: "Data pembayaran berhasil disimpan",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-detail", bookingNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-payments", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal",
        description: getErrorMessage(error),
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (paymentId: number) => jamaahService.verifyPayment(paymentId),
    onSuccess: () => {
      toast({ title: "✅ Pembayaran Terverifikasi" });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-payments", bookingNumber],
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Verifikasi",
        description: getErrorMessage(error),
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (payload: { paymentId: number; reason: string }) =>
      jamaahService.rejectPayment(payload.paymentId, payload.reason),
    onSuccess: () => {
      toast({
        title: "⚠️ Bukti Pembayaran Ditolak",
        description: "Status bukti pembayaran berhasil diubah menjadi REJECTED",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-payments", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setRejectPaymentDialogOpen(false);
      setSelectedPaymentId(null);
      setPaymentRejectReason("");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Menolak Bukti",
        description: getErrorMessage(error),
      });
    },
  });

  // ✅ APPROVE MUTATION
  const approveMutation = useMutation({
    mutationFn: () => jamaahService.approve(bookingNumber),
    onSuccess: () => {
      toast({
        title: "✅ Jamaah Disetujui",
        description: "Status jamaah berhasil diubah menjadi APPROVED",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-detail", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setApproveDialogOpen(false);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Approve",
        description: getErrorMessage(error),
      });
    },
  });

  // ✅ REJECT MUTATION
  const rejectMutation = useMutation({
    mutationFn: (reason: string) => jamaahService.reject(bookingNumber, reason),
    onSuccess: () => {
      toast({
        title: "❌ Jamaah Ditolak",
        description: "Status jamaah berhasil diubah menjadi REJECTED",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-detail", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setRejectDialogOpen(false);
      setRejectReason("");
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Reject",
        description: getErrorMessage(error),
      });
    },
  });

  // ✅ REVERT MUTATION
  const revertMutation = useMutation({
    mutationFn: () => jamaahService.revert(bookingNumber),
    onSuccess: () => {
      toast({
        title: "↩️ Status Dikembalikan",
        description: "Status jamaah berhasil dikembalikan ke VERIFIED",
      });
      queryClient.invalidateQueries({
        queryKey: ["jamaah-detail", bookingNumber],
      });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setRevertDialogOpen(false);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal Revert",
        description: getErrorMessage(error),
      });
    },
  });

  const updateInlineMutation = useMutation({
    mutationFn: (payload: Partial<InlineFormState>) =>
      jamaahService.update(bookingNumber, payload),
    onSuccess: () => {
      toast({ title: "✅ Data jamaah berhasil diupdate" });
      queryClient.invalidateQueries({ queryKey: ["jamaah-detail", bookingNumber] });
      queryClient.invalidateQueries({ queryKey: ["jamaah-list"] });
      setEditingSection(null);
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "❌ Gagal update data",
        description: getErrorMessage(error),
      });
    },
  });

  const populateInlineForm = () => {
    if (!jamaah) return;
    const toInputDate = (dateString: string | null | undefined) => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split("T")[0];
    };

    setInlineForm({
      namaPaspor: jamaah.namaPaspor || "",
      nik: jamaah.nik || "",
      birthPlace: jamaah.birthPlace || "",
      birthDate: toInputDate(jamaah.birthDate),
      gender: jamaah.gender || "",
      packageId: jamaah.packageId?.toString() || "none",
      agenId: jamaah.agenId?.toString() || "none",
      notePaket: jamaah.notePaket || "FULLSERVICE",
      roomTypeMakkah: jamaah.roomTypeMakkah || "",
      roomTypeMadinah: jamaah.roomTypeMadinah || "",
      hargaPaket: jamaah.hargaPaket || "0",
      potonganFeeAgen: jamaah.potonganFeeAgen || "0",
      potonganPoinAgen: jamaah.potonganPoinAgen || "0",
      potonganCashbackKK: jamaah.potonganCashbackKK || "0",
      registrationStatus: jamaah.registrationStatus || "DRAFT",
      notes: jamaah.notes || "",
    });
  };

  useEffect(() => {
    populateInlineForm();
  }, [jamaah]);

  const handleInlineSave = () => {
    const payload: Partial<InlineFormState> & {
      packageId?: number | null;
      agenId?: number | null;
      roomTypeMakkah?: string | null;
      roomTypeMadinah?: string | null;
      notePaket?: string | null;
      notes?: string | null;
    } = {
      ...inlineForm,
      packageId:
        inlineForm.packageId && inlineForm.packageId !== "none"
          ? parseInt(inlineForm.packageId, 10)
          : null,
      agenId:
        inlineForm.agenId && inlineForm.agenId !== "none"
          ? parseInt(inlineForm.agenId, 10)
          : null,
      roomTypeMakkah:
        inlineForm.roomTypeMakkah && inlineForm.roomTypeMakkah !== "none"
          ? inlineForm.roomTypeMakkah
          : null,
      roomTypeMadinah:
        inlineForm.roomTypeMadinah && inlineForm.roomTypeMadinah !== "none"
          ? inlineForm.roomTypeMadinah
          : null,
      notePaket:
        inlineForm.notePaket && inlineForm.notePaket !== "none"
          ? inlineForm.notePaket
          : null,
      notes: inlineForm.notes || null,
    };

    updateInlineMutation.mutate(payload);
  };

  const mapPackageTypeToNotePaket = (pkgType?: string) => {
    switch (pkgType) {
      case "FULL_SERVICE":
        return "FULLSERVICE";
      case "EXTREME":
        return "EXTREME";
      case "KONSORSIUM":
        return "KONSORSIUM";
      default:
        return "B2B";
    }
  };

  const pickDefaultRoomType = (
    pkg: PackageOption,
    prefix: "hotelMakkah" | "hotelMadinah",
  ) => {
    const candidates = [
      { key: `${prefix}Double`, value: "DOUBLE" },
      { key: `${prefix}Triple`, value: "TRIPLE" },
      { key: `${prefix}Quad`, value: "QUAD" },
      { key: `${prefix}Quint`, value: "QUINT" },
    ] as const;

    let selected: string | null = null;
    let maxSeats = -1;

    for (const candidate of candidates) {
      const seats = Number(pkg[candidate.key] || 0);
      if (seats > maxSeats) {
        maxSeats = seats;
        selected = candidate.value;
      }
    }

    return maxSeats > 0 ? selected : null;
  };

  const applyPackageDefaults = (packageId: string) => {
    if (!packageId || packageId === "none") {
      setInlineForm((prev) => ({
        ...prev,
        packageId: "none",
        hargaPaket: "0",
        potonganFeeAgen: "0",
        potonganPoinAgen: "0",
        potonganCashbackKK: "0",
        roomTypeMakkah: "",
        roomTypeMadinah: "",
      }));
      return;
    }

    const selectedPackage = packages.find((pkg) => pkg.id.toString() === packageId);

    if (!selectedPackage) return;

    const harga = selectedPackage.discountPrice
      ? parseFloat(selectedPackage.discountPrice)
      : parseFloat(selectedPackage.price) || 0;

    setInlineForm((prev) => ({
      ...prev,
      packageId,
      notePaket: mapPackageTypeToNotePaket(selectedPackage.type),
      roomTypeMakkah:
        pickDefaultRoomType(selectedPackage, "hotelMakkah") || prev.roomTypeMakkah,
      roomTypeMadinah:
        pickDefaultRoomType(selectedPackage, "hotelMadinah") || prev.roomTypeMadinah,
      hargaPaket: harga.toString(),
      potonganFeeAgen: "0",
      potonganPoinAgen: "0",
      potonganCashbackKK: "0",
    }));

    toast({
      title: "📦 Paket dipilih",
      description: `Default data paket sudah diisi otomatis (harga, note, tipe kamar).`,
    });
  };

  const saveSection = (section: "biodata" | "paket") => {
    handleInlineSave();
    setEditingSection(section);
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      paidBy: "",
      paymentDate: new Date().toISOString().split("T")[0],
      amount: "",
      bankId: "",
      notes: "",
    });
  };

  const openRejectPaymentDialog = (paymentId: number) => {
    setSelectedPaymentId(paymentId);
    setPaymentRejectReason("");
    setRejectPaymentDialogOpen(true);
  };

  // =====================================================
  // HELPERS
  // =====================================================
  const formatRupiah = (amount: string | number | null | undefined) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<
      string,
      { class: string; label: string; icon: ComponentType<{ className?: string }> }
    > = {
        LUNAS: {
          class: "bg-green-100 text-green-800 border-green-200",
          label: "Lunas",
          icon: CheckCircle,
        },
        CICILAN: {
          class: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "Cicilan",
          icon: Clock,
        },
        BELUM_BAYAR: {
          class: "bg-red-100 text-red-800 border-red-200",
          label: "Belum Bayar",
          icon: XCircle,
        },
      };
    const cfg = config[status] || config.BELUM_BAYAR;
    const Icon = cfg.icon;
    return (
      <Badge
        variant="outline"
        className={`${cfg.class} flex items-center gap-1`}
      >
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

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

  const getPaymentProofBadge = (payment: PaymentItem) => {
    const proofStatus = payment.proofStatus || (payment.verifiedAt ? "VERIFIED" : "UPLOADED");

    if (proofStatus === "VERIFIED") {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }

    if (proofStatus === "REJECTED") {
      return (
        <Badge variant="outline" className="text-red-600 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
        <Clock className="h-3 w-3 mr-1" />
        Uploaded
      </Badge>
    );
  };

  // Calculate payment progress
  const getPaymentProgress = () => {
    const hargaFinal = parseFloat(jamaah?.hargaFinal || "0");
    const totalPayment = parseFloat(jamaah?.totalPayment || "0");
    if (hargaFinal === 0) return 0;
    return Math.min(100, (totalPayment / hargaFinal) * 100);
  };

  // Get profile completeness color
  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  // Render Stars
  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} berhasil dicopy!` });
  };

  // Simple Profile Completeness Check
  const checkProfileCompleteness = () => {
    if (!jamaah) return { isComplete: false, percentage: 0, missing: [] };

    const requiredFields = [
      { key: "namaPaspor", label: "Nama Paspor" },
      { key: "nik", label: "NIK" },
      { key: "birthDate", label: "Tanggal Lahir" },
      { key: "birthPlace", label: "Tempat Lahir" },
      { key: "gender", label: "Jenis Kelamin" },
      { key: "address", label: "Alamat" },
      { key: "passportNumber", label: "Nomor Paspor" },
      { key: "passportExpiry", label: "Masa Berlaku Paspor" },
      { key: "emergencyName", label: "Kontak Darurat" },
      { key: "emergencyPhone", label: "No. HP Darurat" },
      { key: "packageId", label: "Paket Umrah" },
      { key: "roomTypeMakkah", label: "Kamar Makkah" },
      { key: "roomTypeMadinah", label: "Kamar Madinah" },
    ];

    const requiredDocs = [
      { key: "fotoUrl", label: "Pas Foto" },
      { key: "ktpUrl", label: "KTP" },
      { key: "kkUrl", label: "Kartu Keluarga" },
      { key: "pasporUrl", label: "Scan Paspor" },
    ];

    const missing: string[] = [];
    let filled = 0;
    const total = requiredFields.length + requiredDocs.length;

    requiredFields.forEach((field) => {
      const value = jamaah[field.key as keyof typeof jamaah];
      if (value && value !== "" && value !== null) {
        filled++;
      } else {
        missing.push(field.label);
      }
    });

    requiredDocs.forEach((doc) => {
      const value = jamaah[doc.key as keyof typeof jamaah];
      if (value && value !== "" && value !== null) {
        filled++;
      } else {
        missing.push(doc.label);
      }
    });

    const percentage = Math.round((filled / total) * 100);
    const isComplete = percentage >= 80;

    return { isComplete, percentage, missing, filled, total };
  };

  const profileStatus = jamaah ? checkProfileCompleteness() : null;

  // ✅ TAMBAHKAN INI (setelah line 351)
  const canApprove = !isReadOnlyRole && jamaah?.registrationStatus === "VERIFIED";
  const canRevert =
    !isReadOnlyRole &&
    (jamaah?.registrationStatus === "APPROVED" ||
      jamaah?.registrationStatus === "REJECTED");

  // =====================================================
  // LOADING & ERROR STATES
  // =====================================================
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !jamaah) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <XCircle className="h-16 w-16 text-red-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          Data Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-6">
          Booking number &quot;{bookingNumber}&quot; tidak ditemukan
        </p>
        <Link href={jamaahBasePath}>
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar
          </Button>
        </Link>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="space-y-6">
      {/* ===== APPROVE DIALOG ===== */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <ShieldCheck className="h-5 w-5" />
              Approve Jamaah?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Anda akan menyetujui pendaftaran jamaah ini:</p>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking:</span>
                  <span className="font-mono font-bold text-primary">
                    {jamaah.bookingNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama:</span>
                  <span className="font-medium">
                    {jamaah.namaPaspor || jamaah.user?.fullName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paket:</span>
                  <span>{jamaah.package?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status Bayar:</span>
                  {getPaymentStatusBadge(jamaah.statusPayment)}
                </div>
              </div>
              <p className="text-green-700 text-sm">
                ✅ Setelah di-approve, jamaah akan menerima notifikasi dan data
                akan dikunci.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ya, Approve
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== REJECT DIALOG ===== */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldX className="h-5 w-5" />
              Reject Jamaah
            </DialogTitle>
            <DialogDescription>
              Tolak pendaftaran jamaah <strong>{jamaah.bookingNumber}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama:</span>
                <span className="font-medium">
                  {jamaah.namaPaspor || jamaah.user?.fullName || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span>{jamaah.user?.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-red-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan penolakan (wajib diisi)..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Alasan ini akan dikirim ke jamaah melalui email/notifikasi.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectReason)}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Jamaah
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== REVERT DIALOG ===== */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Undo2 className="h-5 w-5" />
              Kembalikan ke VERIFIED?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Status jamaah akan dikembalikan ke <strong>VERIFIED</strong>{" "}
                (menunggu approval).
              </p>
              <p className="text-sm text-gray-500">
                Gunakan ini jika ada kesalahan dalam proses approve/reject
                sebelumnya.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revertMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertMutation.mutate()}
              disabled={revertMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {revertMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 mr-2" />
              )}
              Ya, Kembalikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== REJECT PAYMENT PROOF DIALOG ===== */}
      <Dialog
        open={rejectPaymentDialogOpen}
        onOpenChange={(open) => {
          setRejectPaymentDialogOpen(open);
          if (!open) {
            setSelectedPaymentId(null);
            setPaymentRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Tolak Bukti Pembayaran
            </DialogTitle>
            <DialogDescription>
              Pembayaran #{selectedPaymentId || "-"} akan ditandai sebagai <strong>REJECTED</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="payment-reject-reason">
              Alasan Penolakan <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="payment-reject-reason"
              value={paymentRejectReason}
              onChange={(e) => setPaymentRejectReason(e.target.value)}
              placeholder="Contoh: Bukti transfer blur / nominal tidak sesuai"
              className="min-h-[110px]"
            />
            <p className="text-xs text-gray-500">
              Alasan akan tersimpan pada audit trail agar jamaah/agen dapat melakukan upload ulang dengan benar.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectPaymentDialogOpen(false)}
              disabled={rejectPaymentMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedPaymentId) return;
                rejectPaymentMutation.mutate({
                  paymentId: selectedPaymentId,
                  reason: paymentRejectReason.trim(),
                });
              }}
              disabled={
                rejectPaymentMutation.isPending ||
                !selectedPaymentId ||
                paymentRejectReason.trim().length < 3
              }
            >
              {rejectPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Tolak Bukti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={jamaahBasePath}>
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
                {jamaah.namaPaspor || jamaah.user?.fullName || "Belum Ada Nama"}
              </h1>
              {jamaah.gender && (
                <Badge variant="outline">
                  {jamaah.gender === "PRIA" ? "👨 Pria" : "👩 Wanita"}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="font-mono text-primary font-semibold"
              >
                {jamaah.bookingNumber}
              </Badge>
              {getPaymentStatusBadge(jamaah.statusPayment)}
              {getRegistrationBadge(jamaah.registrationStatus)}
            </div>
          </div>
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex flex-wrap gap-2 ml-12 md:ml-0">
          {/* Approve/Reject Buttons - hanya tampil jika status VERIFIED */}
          {canApprove && (
            <>
              <Button
                onClick={() => setApproveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {/* Revert Button - tampil jika status APPROVED atau REJECTED */}
          {canRevert && (
            <Button variant="outline" onClick={() => setRevertDialogOpen(true)}>
              <Undo2 className="h-4 w-4 mr-2" />
              Revert
            </Button>
          )}

          {!isReadOnlyRole && (
            <Link href={`${jamaahBasePath}/${bookingNumber}/edit`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Edit Lengkap
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ===== APPROVAL STATUS CARD ===== */}
      {jamaah.registrationStatus === "VERIFIED" && (
        <Card className="border-2 border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <p className="font-semibold text-cyan-800">
                    Menunggu Approval
                  </p>
                  <p className="text-sm text-cyan-600">
                    Jamaah sudah submit dokumen dan menunggu persetujuan admin
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setApproveDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {jamaah.registrationStatus === "APPROVED" && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    ✅ Jamaah Disetujui
                  </p>
                  <p className="text-sm text-green-600">
                    Disetujui pada: {formatDate(jamaah.approvedAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setRevertDialogOpen(true)}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Batalkan Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {jamaah.registrationStatus === "REJECTED" && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ShieldX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">
                    ❌ Jamaah Ditolak
                  </p>
                  <p className="text-sm text-red-600">
                    Ditolak pada: {formatDate(jamaah.rejectedAt)}
                  </p>
                  {jamaah.rejectionReason && (
                    <div className="mt-2 p-3 bg-red-100 rounded-lg">
                      <p className="text-xs text-red-700 font-medium mb-1">
                        Alasan Penolakan:
                      </p>
                      <p className="text-sm text-red-800">
                        {jamaah.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setRevertDialogOpen(true)}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Batalkan Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== REST OF THE PAGE (sama seperti sebelumnya) ===== */}
      {/* ... Summary Cards, Tabs, etc ... */}

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Harga Final</p>
            <p className="text-xl font-bold text-primary mt-1">
              {formatRupiah(jamaah.hargaFinal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Total Dibayar</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {formatRupiah(jamaah.totalPayment)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Outstanding</p>
            <p
              className={`text-xl font-bold mt-1 ${
                parseFloat(jamaah.outstanding || "0") > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatRupiah(jamaah.outstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium">Paket</p>
            <p className="text-lg font-semibold text-gray-800 mt-1 truncate">
              {jamaah.package?.name || (
                <span className="text-orange-600 text-sm">Belum Pilih</span>
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
            <Progress value={getPaymentProgress()} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Dibayar: {formatRupiah(jamaah.totalPayment)}</span>
              <span>Target: {formatRupiah(jamaah.hargaFinal)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== TABS ===== */}
      <Tabs defaultValue="biodata" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-auto md:inline-flex">
          <TabsTrigger value="biodata" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Biodata</span>
            {profileCompleteness?.categories?.biodata &&
              !profileCompleteness.categories.biodata.complete && (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              )}
          </TabsTrigger>
          <TabsTrigger value="paket" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Paket</span>
            {!jamaah.packageId && (
              <AlertCircle className="h-3 w-3 text-yellow-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="pembayaran" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Bayar</span>
            {payments.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {payments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dokumen" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Dokumen</span>
            {profileCompleteness?.categories?.dokumen &&
              !profileCompleteness.categories.dokumen.complete && (
                <AlertCircle className="h-3 w-3 text-yellow-500" />
              )}
          </TabsTrigger>
        </TabsList>

        {/* ===== BIODATA TAB ===== */}
        <TabsContent value="biodata" className="space-y-4">
          {/* Data Akun */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Data Akun
              </CardTitle>
              <CardDescription>
                Informasi login & kontak dari sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nama Lengkap</p>
                    <p className="font-medium">
                      {jamaah.user?.fullName || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{jamaah.user?.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">No. HP/WA</p>
                    <p className="font-medium">{jamaah.user?.phone || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Pribadi */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Data Pribadi
                  </CardTitle>
                  <CardDescription>
                    Informasi biodata sesuai dokumen resmi
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {profileCompleteness?.categories?.biodata && (
                    <Badge
                      variant="outline"
                      className={
                        profileCompleteness.categories.biodata.complete
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {profileCompleteness.categories.biodata.passed}/
                      {profileCompleteness.categories.biodata.total}
                    </Badge>
                  )}
                  {editingSection === "biodata" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          populateInlineForm();
                          setEditingSection(null);
                        }}
                        disabled={updateInlineMutation.isPending}
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveSection("biodata")}
                        disabled={updateInlineMutation.isPending}
                      >
                        {updateInlineMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Simpan
                      </Button>
                    </>
                  ) : !isReadOnlyRole ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSection("biodata")}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Nama Sesuai Paspor
                        {!jamaah.namaPaspor && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      {editingSection === "biodata" ? (
                        <Input
                          value={inlineForm.namaPaspor}
                          onChange={(e) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              namaPaspor: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {jamaah.namaPaspor || (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        NIK
                        {!jamaah.nik && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      {editingSection === "biodata" ? (
                        <Input
                          value={inlineForm.nik}
                          onChange={(e) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              nik: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium font-mono">
                          {jamaah.nik || (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Tempat Lahir
                        {!jamaah.birthPlace && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      {editingSection === "biodata" ? (
                        <Input
                          value={inlineForm.birthPlace}
                          onChange={(e) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              birthPlace: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {jamaah.birthPlace || (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Tanggal Lahir
                        {!jamaah.birthDate && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      {editingSection === "biodata" ? (
                        <Input
                          type="date"
                          value={inlineForm.birthDate}
                          onChange={(e) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              birthDate: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {jamaah.birthDate ? (
                            formatDate(jamaah.birthDate)
                          ) : (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Jenis Kelamin
                        {!jamaah.gender && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      {editingSection === "biodata" ? (
                        <Select
                          value={inlineForm.gender || "none"}
                          onValueChange={(value) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              gender: value === "none" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            <SelectItem value="PRIA">Laki-laki</SelectItem>
                            <SelectItem value="WANITA">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium">
                          {jamaah.gender === "PRIA" ? (
                            "Laki-laki"
                          ) : jamaah.gender === "WANITA" ? (
                            "Perempuan"
                          ) : (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Status Pernikahan
                        {!jamaah.maritalStatus && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      <p className="font-medium">
                        {jamaah.maritalStatus ? (
                          jamaah.maritalStatus.replace(/_/g, " ")
                        ) : (
                          <span className="text-gray-400 italic">
                            Belum diisi
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Alamat
                      {!jamaah.address && (
                        <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                      )}
                    </p>
                      {editingSection === "biodata" ? (
                        <Textarea
                          rows={2}
                          value={inlineForm.address || ""}
                          onChange={(e) =>
                            setInlineForm((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-medium">
                          {jamaah.address || (
                            <span className="text-gray-400 italic">
                              Belum diisi
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Kota/Kab</p>
                      <p className="font-medium">{jamaah.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Provinsi</p>
                      <p className="font-medium">{jamaah.province || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Paspor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Data Paspor
                </CardTitle>
                {profileCompleteness?.categories?.paspor && (
                  <Badge
                    variant="outline"
                    className={
                      profileCompleteness.categories.paspor.complete
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {profileCompleteness.categories.paspor.passed}/
                    {profileCompleteness.categories.paspor.total}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Nomor Paspor
                    {!jamaah.passportNumber && (
                      <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="font-medium font-mono">
                    {jamaah.passportNumber || (
                      <span className="text-gray-400 italic">Belum diisi</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Tempat Terbit
                    {!jamaah.passportIssuePlace && (
                      <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="font-medium">
                    {jamaah.passportIssuePlace || (
                      <span className="text-gray-400 italic">Belum diisi</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tanggal Terbit</p>
                  <p className="font-medium">
                    {formatDate(jamaah.passportIssueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Masa Berlaku
                    {!jamaah.passportExpiry && (
                      <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="font-medium">
                    {jamaah.passportExpiry ? (
                      formatDate(jamaah.passportExpiry)
                    ) : (
                      <span className="text-gray-400 italic">Belum diisi</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kontak Darurat */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Kontak Darurat
                </CardTitle>
                {profileCompleteness?.categories?.emergency && (
                  <Badge
                    variant="outline"
                    className={
                      profileCompleteness.categories.emergency.complete
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {profileCompleteness.categories.emergency.passed}/
                    {profileCompleteness.categories.emergency.total}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Nama
                    {!jamaah.emergencyName && (
                      <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="font-medium">
                    {jamaah.emergencyName || (
                      <span className="text-gray-400 italic">Belum diisi</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    No. HP
                    {!jamaah.emergencyPhone && (
                      <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                    )}
                  </p>
                  <p className="font-medium">
                    {jamaah.emergencyPhone || (
                      <span className="text-gray-400 italic">Belum diisi</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hubungan</p>
                  <p className="font-medium">
                    {jamaah.emergencyRelation || "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mahram */}
          {(jamaah.mahram || jamaah.gender === "WANITA") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Data Mahram
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jamaah.mahram ? (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
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
                    <p>Belum ada mahram yang dipilih</p>
                    <p className="text-sm">Wajib untuk jamaah wanita</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== PAKET TAB ===== */}
        <TabsContent value="paket" className="space-y-4">
          {!jamaah.packageId && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-800">
                      Paket Belum Dipilih
                    </p>
                    <p className="text-sm text-yellow-700">
                      Jamaah belum memilih paket umrah. Silakan edit data untuk
                      memilih paket.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informasi Paket</CardTitle>
                {editingSection === "paket" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        populateInlineForm();
                        setEditingSection(null);
                      }}
                      disabled={updateInlineMutation.isPending}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveSection("paket")}
                      disabled={updateInlineMutation.isPending}
                    >
                      {updateInlineMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Simpan
                    </Button>
                  </div>
                ) : !isReadOnlyRole ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingSection("paket")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nama Paket</p>
                    {editingSection === "paket" ? (
                      <Select
                        value={inlineForm.packageId || "none"}
                        onValueChange={applyPackageDefaults}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Belum pilih paket</SelectItem>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-semibold text-lg text-primary">
                        {jamaah.package?.name || (
                          <span className="text-gray-400 italic">
                            Belum Pilih Paket
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Tanggal Booking
                      </p>
                      <p className="font-medium">
                        {formatDate(jamaah.dateOfBooking)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Note Paket</p>
                      {editingSection === "paket" ? (
                        <Select
                          value={inlineForm.notePaket || "FULLSERVICE"}
                          onValueChange={(value) =>
                            setInlineForm((prev) => ({ ...prev, notePaket: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULLSERVICE">Full Service</SelectItem>
                            <SelectItem value="EXTREME">Extreme</SelectItem>
                            <SelectItem value="KONSORSIUM">Konsorsium</SelectItem>
                            <SelectItem value="B2B">B2B</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge>{jamaah.notePaket || "FULLSERVICE"}</Badge>
                      )}
                    </div>
                  </div>
                  {/* Show Agen Name here too if exists */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Didaftarkan oleh
                      </p>
                      {editingSection === "paket" ? (
                        <Select
                          value={inlineForm.agenId || "none"}
                          onValueChange={(value) =>
                            setInlineForm((prev) => ({ ...prev, agenId: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih agen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tanpa Agen</SelectItem>
                            {agenList.map((agen) => (
                              <SelectItem key={agen.id} value={agen.id.toString()}>
                                {agen.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : jamaah.agen ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <p className="font-medium">
                            {jamaah.agen.user?.fullName || jamaah.agen.fullName}
                          </p>
                          {jamaah.agen.currentStar > 0 &&
                            renderStars(jamaah.agen.currentStar)}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Tidak ada agen</p>
                      )}
                    </div>
                </div>

                <div className="space-y-4">
                  {jamaah.package && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          <Plane className="h-3 w-3 inline mr-1" />
                          Berangkat
                        </p>
                        <p className="font-medium">
                          {formatDate(jamaah.package.departureDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Pulang</p>
                        <p className="font-medium">
                          {formatDate(jamaah.package.returnDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        <Building className="h-3 w-3 inline mr-1" />
                        Kamar Makkah
                        {!jamaah.roomTypeMakkah && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      <p className="font-medium">
                        {editingSection === "paket" ? (
                          <Select
                            value={inlineForm.roomTypeMakkah || "none"}
                            onValueChange={(value) =>
                              setInlineForm((prev) => ({
                                ...prev,
                                roomTypeMakkah: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe kamar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-</SelectItem>
                              <SelectItem value="DOUBLE">Double</SelectItem>
                              <SelectItem value="TRIPLE">Triple</SelectItem>
                              <SelectItem value="QUAD">Quad</SelectItem>
                              <SelectItem value="QUINT">Quint</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          jamaah.roomTypeMakkah || (
                            <span className="text-gray-400 italic">
                              Belum dipilih
                            </span>
                          )
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Kamar Madinah
                        {!jamaah.roomTypeMadinah && (
                          <AlertCircle className="h-3 w-3 inline ml-1 text-yellow-500" />
                        )}
                      </p>
                      <p className="font-medium">
                        {editingSection === "paket" ? (
                          <Select
                            value={inlineForm.roomTypeMadinah || "none"}
                            onValueChange={(value) =>
                              setInlineForm((prev) => ({
                                ...prev,
                                roomTypeMadinah: value === "none" ? "" : value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe kamar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-</SelectItem>
                              <SelectItem value="DOUBLE">Double</SelectItem>
                              <SelectItem value="TRIPLE">Triple</SelectItem>
                              <SelectItem value="QUAD">Quad</SelectItem>
                              <SelectItem value="QUINT">Quint</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          jamaah.roomTypeMadinah || (
                            <span className="text-gray-400 italic">
                              Belum dipilih
                            </span>
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rincian Harga */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Rincian Harga</CardTitle>
            </CardHeader>
            <CardContent>
              {parseFloat(
                editingSection === "paket"
                  ? inlineForm.hargaPaket || "0"
                  : jamaah.hargaPaket || "0",
              ) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Harga Belum Ditetapkan</p>
                  <p className="text-sm">
                    Pilih paket terlebih dahulu atau atur harga manual
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Harga Paket</span>
                      <span className="font-medium">
                        {formatRupiah(
                          editingSection === "paket"
                            ? inlineForm.hargaPaket
                            : jamaah.hargaPaket,
                        )}
                      </span>
                    </div>
                  {parseFloat(
                    editingSection === "paket"
                      ? inlineForm.potonganFeeAgen || "0"
                      : jamaah.potonganFeeAgen || "0",
                  ) > 0 && (
                    <div className="flex justify-between py-2 text-red-600">
                      <span>- Potongan Fee Agen</span>
                      <span>
                        {formatRupiah(
                          editingSection === "paket"
                            ? inlineForm.potonganFeeAgen
                            : jamaah.potonganFeeAgen,
                        )}
                      </span>
                    </div>
                  )}
                  {parseFloat(
                    editingSection === "paket"
                      ? inlineForm.potonganPoinAgen || "0"
                      : jamaah.potonganPoinAgen || "0",
                  ) > 0 && (
                    <div className="flex justify-between py-2 text-red-600">
                      <span>- Potongan Poin Agen</span>
                      <span>
                        {formatRupiah(
                          editingSection === "paket"
                            ? inlineForm.potonganPoinAgen
                            : jamaah.potonganPoinAgen,
                        )}
                      </span>
                    </div>
                  )}
                  {parseFloat(
                    editingSection === "paket"
                      ? inlineForm.potonganCashbackKK || "0"
                      : jamaah.potonganCashbackKK || "0",
                  ) > 0 && (
                    <div className="flex justify-between py-2 text-red-600">
                      <span>- Cashback Kartu Kredit</span>
                      <span>
                        {formatRupiah(
                          editingSection === "paket"
                            ? inlineForm.potonganCashbackKK
                            : jamaah.potonganCashbackKK,
                        )}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-lg">Harga Final</span>
                    <span className="font-bold text-xl text-primary">
                      {formatRupiah(jamaah.hargaFinal)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Total Dibayar</span>
                    <span className="font-semibold">
                      {formatRupiah(jamaah.totalPayment)}
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
                      {formatRupiah(jamaah.outstanding)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PEMBAYARAN TAB ===== */}
        <TabsContent value="pembayaran">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Riwayat Pembayaran</CardTitle>
                <CardDescription>
                  {formatRupiah(jamaah.totalPayment)} dari{" "}
                  {formatRupiah(jamaah.hargaFinal)}
                </CardDescription>
              </div>
              <Dialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-secondary hover:bg-secondary/90 text-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pembayaran
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pembayaran</DialogTitle>
                    <DialogDescription>
                      Booking: {jamaah.bookingNumber}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama Penyetor *</Label>
                      <Input
                        value={paymentForm.paidBy}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            paidBy: e.target.value,
                          })
                        }
                        placeholder="Nama yang menyetor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Bayar *</Label>
                      <Input
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            paymentDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jumlah (Rp) *</Label>
                      <Input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="Contoh: 5000000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Tujuan</Label>
                      <Select
                        value={paymentForm.bankId}
                        onValueChange={(val) =>
                          setPaymentForm({ ...paymentForm, bankId: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-- Pilih Bank --" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem
                              key={bank.id}
                              value={bank.id.toString()}
                            >
                              {bank.bankName} - {bank.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Input
                        value={paymentForm.notes}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Catatan tambahan (opsional)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setPaymentDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={() => {
                        if (!paymentForm.paidBy || !paymentForm.amount) {
                          toast({
                            variant: "destructive",
                            title: "Data tidak lengkap",
                            description: "Nama penyetor dan jumlah wajib diisi",
                          });
                          return;
                        }
                        addPaymentMutation.mutate({
                          paidBy: paymentForm.paidBy,
                          paymentDate: paymentForm.paymentDate,
                          amount: parseFloat(paymentForm.amount),
                          bankId: paymentForm.bankId
                            ? parseInt(paymentForm.bankId)
                            : undefined,
                          notes: paymentForm.notes,
                        });
                      }}
                      disabled={addPaymentMutation.isPending}
                    >
                      {addPaymentMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Simpan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-200" />
                  <p className="text-gray-500 font-medium">
                    Belum ada pembayaran
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Klik tombol &quot;Tambah Pembayaran&quot; untuk mencatat pembayaran
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Penyetor</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.paymentNumber}
                          </TableCell>
                          <TableCell>
                            {formatShortDate(payment.paymentDate)}
                          </TableCell>
                          <TableCell>{payment.paidBy || "-"}</TableCell>
                          <TableCell>{payment.bank?.bankName || "-"}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatRupiah(payment.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              {getPaymentProofBadge(payment)}
                              {payment.proofStatus === "REJECTED" && payment.rejectionReason && (
                                <p className="text-xs text-red-600 max-w-[220px] mx-auto break-words">
                                  {payment.rejectionReason}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {(payment.proofStatus || "UPLOADED") !== "VERIFIED" && (
                              <div className="flex items-center justify-center gap-2">
                                {(payment.proofStatus || "UPLOADED") === "UPLOADED" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:bg-green-50"
                                      onClick={() =>
                                        verifyPaymentMutation.mutate(payment.id)
                                      }
                                      disabled={verifyPaymentMutation.isPending}
                                    >
                                      {verifyPaymentMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Verify
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => openRejectPaymentDialog(payment.id)}
                                      disabled={rejectPaymentMutation.isPending}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {(payment.proofStatus || "UPLOADED") === "REJECTED" && (
                                  <span className="text-xs text-red-600">Menunggu upload ulang</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DOKUMEN TAB ===== */}
        <TabsContent value="dokumen">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dokumen Jamaah</CardTitle>
              <CardDescription>
                Status kelengkapan dokumen untuk proses pendaftaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "fotoUrl", label: "Pas Foto", icon: User },
                  { key: "ktpUrl", label: "KTP", icon: FileText },
                  { key: "kkUrl", label: "Kartu Keluarga", icon: Users },
                  { key: "pasporUrl", label: "Paspor", icon: FileText },
                  { key: "bukuNikahUrl", label: "Buku Nikah", icon: FileText },
                  { key: "aktaLahirUrl", label: "Akta Lahir", icon: FileText },
                  { key: "ijazahUrl", label: "Ijazah", icon: FileText },
                  {
                    key: "vaksinUrl",
                    label: "Sertifikat Vaksin",
                    icon: FileText,
                  },
                  {
                    key: "meningitisUrl",
                    label: "Sertifikat Meningitis",
                    icon: FileText,
                  },
                ].map((doc) => {
                  const DocIcon = doc.icon;
                  const url = jamaah[doc.key as keyof typeof jamaah] as
                    | string
                    | null;
                  return (
                    <div
                      key={doc.key}
                      className={`p-4 rounded-lg border-2 ${
                        url
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              url ? "bg-green-100" : "bg-gray-200"
                            }`}
                          >
                            <DocIcon
                              className={`h-5 w-5 ${
                                url ? "text-green-600" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {doc.label}
                            </p>
                            {url ? (
                              <p className="text-xs text-green-600">
                                Sudah diupload
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400">
                                Belum diupload
                              </p>
                            )}
                          </div>
                        </div>
                        {url && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
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
    </div>
  );
}

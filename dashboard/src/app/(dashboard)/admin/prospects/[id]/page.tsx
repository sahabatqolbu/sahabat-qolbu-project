"use client";

import Link from "next/link";
import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  Package,
  Phone,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import {
  prospectService,
  type ProspectFollowUp,
  type ProspectInterest,
  type PublicPackage,
} from "@/services/prospectService";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statuses = ["BARU", "DIHUBUNGI", "TERTARIK", "BELUM_RESPON", "CONVERTED"];

const statusClass: Record<string, string> = {
  BARU: "bg-blue-100 text-blue-800 border-blue-200",
  DIHUBUNGI: "bg-amber-100 text-amber-800 border-amber-200",
  TERTARIK: "bg-green-100 text-green-800 border-green-200",
  BELUM_RESPON: "bg-gray-100 text-gray-800 border-gray-200",
  CONVERTED: "bg-purple-100 text-purple-800 border-purple-200",
};

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

const whatsappUrl = (phone?: string | null) => {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "62");
  return normalized ? `https://wa.me/${normalized}` : null;
};

export default function ProspectDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const role = useAuthStore((state) => state.user?.role);
  const basePath = role === "STAFF" ? "/staff/prospects" : "/admin/prospects";
  const isAdmin = role === "ADMIN";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-prospect-detail", id],
    queryFn: () => prospectService.getAdminProspectDetail(id),
    enabled: Boolean(id),
  });

  const { data: packagesData } = useQuery({
    queryKey: ["prospect-public-packages", "admin-convert"],
    queryFn: () => prospectService.getPublicPackages({ limit: 100 }),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const detail = data?.data;
  const prospect = detail?.prospect;
  const interests: ProspectInterest[] = detail?.interests || [];
  const followUps: ProspectFollowUp[] = detail?.followUps || [];
  const packages: PublicPackage[] = packagesData?.data?.packages || [];
  const wa = whatsappUrl(prospect?.phone);

  const followUpMutation = useMutation({
    mutationFn: (formData: FormData) =>
      prospectService.addFollowUp(id, {
        status: String(formData.get("status") || "DIHUBUNGI"),
        note: String(formData.get("note") || "").trim() || null,
      }),
    onSuccess: () => {
      toast({ title: "Follow up tersimpan" });
      queryClient.invalidateQueries({ queryKey: ["admin-prospect-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-prospects"] });
    },
    onError: (error: any) =>
      toast({
        variant: "destructive",
        title: "Gagal menyimpan",
        description: error?.response?.data?.message || "Silakan coba lagi.",
      }),
  });

  const convertMutation = useMutation({
    mutationFn: (formData: FormData) =>
      prospectService.adminConvert(id, Number(formData.get("packageId"))),
    onSuccess: () => {
      toast({
        title: "Calon jamaah dikonversi",
        description: "User sekarang masuk flow jamaah dan dapat melengkapi onboarding.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-prospect-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-prospects"] });
    },
    onError: (error: any) =>
      toast({
        variant: "destructive",
        title: "Gagal convert",
        description: error?.response?.data?.message || "Silakan coba lagi.",
      }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="space-y-4">
        <Link href={basePath}>
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Button>
        </Link>
        <Card>
          <CardContent className="p-10 text-center text-gray-500">
            Calon jamaah tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link href={basePath} className="mb-2 inline-flex items-center text-sm text-gray-500">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{prospect.fullName}</h1>
          <p className="text-sm text-gray-500">Detail calon jamaah dan timeline follow up.</p>
        </div>
        <Badge className={statusClass[prospect.followUpStatus] || ""} variant="outline">
          {prospect.followUpStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-5 w-5" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Info icon={Mail} label="Email" value={prospect.email} />
              <Info icon={Phone} label="WhatsApp" value={prospect.phone || "-"} />
              <Info icon={Calendar} label="Tanggal Register" value={date(prospect.createdAt)} />
              <Info icon={Package} label="Sumber" value={`${prospect.sourceType || "GENERAL"} ${prospect.sourceSlug || ""}`} />
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="md:col-span-2">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Phone className="mr-2 h-4 w-4" />
                    Hubungi via WhatsApp
                  </Button>
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paket Diminati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interests.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada paket diminati.</p>
              ) : (
                interests.map((interest) => (
                  <div key={interest.id} className="rounded-xl border p-4">
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                      <div>
                        <Badge variant="secondary">{interest.actionType.replaceAll("_", " ")}</Badge>
                        <p className="mt-2 font-semibold text-gray-900">{interest.packageName}</p>
                        <p className="text-sm text-gray-500">{interest.packageCode || `#${interest.packageId}`}</p>
                      </div>
                      <p className="text-sm text-gray-500">{date(interest.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline Follow Up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {followUps.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada catatan follow up.</p>
              ) : (
                followUps.map((item) => (
                  <div key={item.id} className="border-l-2 border-[var(--color-primary)] pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusClass[item.status] || ""} variant="outline">
                        {item.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{date(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{item.note || "-"}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Oleh {item.actorName || "Admin/Staff"} ({item.actorRole || "-"})
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tambah Follow Up</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={(formData) => followUpMutation.mutate(formData)} className="space-y-4">
                <Select name="status" defaultValue={prospect.followUpStatus || "DIHUBUNGI"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea name="note" placeholder="Catatan follow up..." rows={5} />
                <Button className="w-full" disabled={followUpMutation.isPending}>
                  Simpan Follow Up
                </Button>
              </form>
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Convert ke Jamaah</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={(formData) => convertMutation.mutate(formData)} className="space-y-4">
                  <Select name="packageId" defaultValue={String(interests[0]?.packageId || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Convert akan membuat data jamaah status DRAFT dan user lanjut ke onboarding.
                  </p>
                  <Button className="w-full" disabled={convertMutation.isPending || packages.length === 0}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Convert
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

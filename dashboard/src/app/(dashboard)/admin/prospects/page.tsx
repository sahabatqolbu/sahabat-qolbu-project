"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Eye, MessageCircle, Phone, Search, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import { prospectService, type AdminProspect } from "@/services/prospectService";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "BARU", label: "Baru" },
  { value: "DIHUBUNGI", label: "Dihubungi" },
  { value: "TERTARIK", label: "Tertarik" },
  { value: "BELUM_RESPON", label: "Belum Respon" },
  { value: "CONVERTED", label: "Converted" },
];

const statusClass: Record<string, string> = {
  BARU: "bg-blue-100 text-blue-800 border-blue-200",
  DIHUBUNGI: "bg-amber-100 text-amber-800 border-amber-200",
  TERTARIK: "bg-green-100 text-green-800 border-green-200",
  BELUM_RESPON: "bg-gray-100 text-gray-800 border-gray-200",
  CONVERTED: "bg-purple-100 text-purple-800 border-purple-200",
};

const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
    : "-";

const whatsappUrl = (phone?: string | null) => {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "62");
  return normalized ? `https://wa.me/${normalized}` : null;
};

export default function ProspectsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const basePath = role === "STAFF" ? "/staff/prospects" : "/admin/prospects";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, search, status],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-prospects", queryParams],
    queryFn: () => prospectService.getAdminProspects(queryParams),
    staleTime: 20_000,
  });

  const prospects: AdminProspect[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calon Jamaah</h1>
          <p className="mt-1 text-sm text-gray-500">
            Leads dari register dashboard, paket diminati, dan histori follow up.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Cari nama, email, WhatsApp, atau sumber..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5" />
            Daftar Calon Jamaah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paket Terakhir</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                      Belum ada calon jamaah.
                    </TableCell>
                  </TableRow>
                ) : (
                  prospects.map((prospect) => {
                    const wa = whatsappUrl(prospect.phone);
                    return (
                      <TableRow key={prospect.id}>
                        <TableCell>
                          <p className="font-medium">{prospect.fullName}</p>
                          <p className="text-xs text-gray-500">{prospect.sourceType || "GENERAL"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{prospect.email}</p>
                          <p className="text-xs text-gray-500">{prospect.phone || "-"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusClass[prospect.followUpStatus] || ""} variant="outline">
                            {prospect.followUpStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[220px] truncate text-sm">
                            {prospect.latestInterest?.packageName || "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {prospect.latestInterest?.actionType?.replaceAll("_", " ") || ""}
                          </p>
                        </TableCell>
                        <TableCell>{date(prospect.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {wa ? (
                              <a href={wa} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              </a>
                            ) : null}
                            <Link href={`${basePath}/${prospect.id}`}>
                              <Button size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </>
        ) : prospects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Belum ada calon jamaah.
            </CardContent>
          </Card>
        ) : (
          prospects.map((prospect) => {
            const wa = whatsappUrl(prospect.phone);
            return (
              <Card key={prospect.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge className={statusClass[prospect.followUpStatus] || ""} variant="outline">
                        {prospect.followUpStatus}
                      </Badge>
                      <h2 className="mt-2 truncate font-semibold text-gray-900">{prospect.fullName}</h2>
                      <p className="text-sm text-gray-500">{prospect.email}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {date(prospect.createdAt)}
                      </p>
                    </div>
                    <MessageCircle className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    Paket: {prospect.latestInterest?.packageName || "-"}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">WhatsApp</Button>
                      </a>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>WhatsApp</Button>
                    )}
                    <Link href={`${basePath}/${prospect.id}`}>
                      <Button className="w-full">Detail</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {pagination ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} dari {pagination.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

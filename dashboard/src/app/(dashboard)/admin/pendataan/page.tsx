"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { jamaahService, type DataCollectionRow } from "@/services/jamaahService";

type Filter = "ALL" | "NOT_SENT" | "INCOMPLETE" | "COMPLETE";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "NOT_SENT", label: "Belum dikirim link" },
  { value: "INCOMPLETE", label: "Belum lengkap" },
  { value: "COMPLETE", label: "Lengkap" },
];

const shortDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "";

const statusText = (row: DataCollectionRow) => {
  const seat = row.seatConfirmed ? "Seat dikonfirmasi. " : "";
  return seat + linkText(row);
};

const linkText = (row: DataCollectionRow) => {
  if (row.complete && row.submitted) return "Lengkap dan sudah dikirim ke admin";
  if (row.complete) return "Data lengkap, jamaah belum menekan Kirim";
  if (!row.link) return "Link belum dikirim";
  if (!row.link.active) return "Link kedaluwarsa atau dicabut";
  if (row.link.lastUsedAt) return `Dibuka ${row.link.useCount}x, terakhir ${shortDate(row.link.lastUsedAt)}`;
  return `Link dikirim ${shortDate(row.link.sentAt)}, belum dibuka`;
};

const matches = (row: DataCollectionRow, filter: Filter) =>
  filter === "ALL" ||
  (filter === "NOT_SENT" && !row.link?.active && !row.complete) ||
  (filter === "INCOMPLETE" && !row.complete) ||
  (filter === "COMPLETE" && row.complete);

export default function DataCollectionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/staff") ? "/staff" : "/admin";
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [armedConfirm, setArmedConfirm] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["data-collection"], queryFn: jamaahService.getDataCollection });
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const visible = rows.filter((row) => matches(row, filter));

  const stats = [
    { label: "Akun jamaah", value: rows.length },
    { label: "Link terkirim", value: rows.filter((r) => r.link).length },
    { label: "Sudah dibuka", value: rows.filter((r) => r.link?.lastUsedAt).length },
    { label: "Data lengkap", value: rows.filter((r) => r.complete).length },
  ];

  const sendMutation = useMutation({
    mutationFn: ({ row }: { row: DataCollectionRow; tab: Window | null }) => jamaahService.createDataLink(row.bookingNumber),
    onSuccess: async (link, { tab }) => {
      if (link.whatsappUrl && tab) {
        tab.location.href = link.whatsappUrl;
      } else {
        tab?.close();
        try {
          await navigator.clipboard.writeText(link.message);
          toast({ title: "Nomor HP belum ada", description: "Pesan berisi link sudah disalin. Kirim manual ke jamaah." });
        } catch {
          toast({ title: "Nomor HP belum ada", description: link.url });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["data-collection"] });
    },
    onError: (error, { tab }) => {
      tab?.close();
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Gagal membuat link", description: message || "Coba lagi" });
    },
    onSettled: () => setSendingFor(null),
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingNumber: string) => jamaahService.confirmSeat(bookingNumber),
    onSuccess: (result) => {
      toast({ title: result.message, description: result.data.emailSent ? undefined : "Kirim link lewat WhatsApp karena email belum ada atau gagal terkirim." });
      queryClient.invalidateQueries({ queryKey: ["data-collection"] });
    },
    onError: (error) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Gagal konfirmasi", description: message || "Coba lagi" });
    },
    onSettled: () => setArmedConfirm(null),
  });

  // Two clicks so a seat is never confirmed by a stray tap.
  const confirm = (row: DataCollectionRow) => {
    if (armedConfirm !== row.bookingNumber) {
      setArmedConfirm(row.bookingNumber);
      window.setTimeout(() => setArmedConfirm((current) => (current === row.bookingNumber ? null : current)), 4000);
      return;
    }
    confirmMutation.mutate(row.bookingNumber);
  };

  const send = (row: DataCollectionRow) => {
    // Open the tab inside the click so the browser does not block it as a popup.
    const tab = row.phone ? window.open("", "_blank") : null;
    setSendingFor(row.bookingNumber);
    sendMutation.mutate({ row, tab });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pendataan Jamaah</h1>
          <p className="mt-1 text-sm text-gray-600">
            Kirim link pribadi lewat WhatsApp agar jamaah mengisi datanya sendiri, lalu pantau siapa yang sudah membuka dan melengkapi.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Muat ulang
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <dt className="text-xs text-gray-500">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter pendataan">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-md border px-3 py-1.5 text-sm ${filter === option.value ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {option.label} <span className="tabular-nums opacity-70">{rows.filter((row) => matches(row, option.value)).length}</span>
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : query.isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Data pendataan gagal dimuat. Coba muat ulang.</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          {rows.length === 0 ? "Belum ada akun jamaah. Tambahkan jamaah lewat Kelola User terlebih dahulu." : "Tidak ada jamaah pada filter ini."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {visible.map((row) => (
            <li key={row.userId} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_310px] sm:items-center sm:gap-6">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{row.name}</p>
                <p className="text-xs text-gray-500">
                  <span className="font-mono">{row.bookingNumber}</span>
                  {row.members.length > 1 && ` · ${row.members.length} anggota keluarga`}
                  {row.phone ? ` · ${row.phone}` : " · tanpa nomor HP"}
                  {row.email ? ` · ${row.email}` : " · tanpa email"}
                </p>
                <p className="mt-1 text-xs text-gray-600">{statusText(row)}</p>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Kelengkapan</span>
                  <span className="tabular-nums">{row.progress}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.progress} aria-label={`Kelengkapan data ${row.name}`}>
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${row.progress}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {!row.seatConfirmed && (
                  <Button size="sm" variant={armedConfirm === row.bookingNumber ? "default" : "outline"} onClick={() => confirm(row)} disabled={confirmMutation.isPending && armedConfirm === row.bookingNumber}>
                    {confirmMutation.isPending && armedConfirm === row.bookingNumber ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    {armedConfirm === row.bookingNumber ? "Klik lagi untuk konfirmasi" : "Konfirmasi"}
                  </Button>
                )}
                {!(row.complete && row.submitted) && (
                  <Button size="sm" onClick={() => send(row)} disabled={sendingFor === row.bookingNumber} className="bg-green-600 hover:bg-green-700">
                    {sendingFor === row.bookingNumber ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-1 h-4 w-4" />}
                    {row.complete ? "Ingatkan" : row.link?.active ? "Kirim ulang" : "Kirim WA"}
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${basePath}/jamaah/${encodeURIComponent(row.bookingNumber)}`}>
                    Detail <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        &ldquo;Konfirmasi&rdquo; mengunci seat dan mengirim email akses serta rekening pembayaran ke jamaah. &ldquo;Kirim ulang&rdquo; membuat link baru dan mematikan link lama. Satu link berlaku untuk semua anggota keluarga dalam satu akun.
      </p>
    </div>
  );
}

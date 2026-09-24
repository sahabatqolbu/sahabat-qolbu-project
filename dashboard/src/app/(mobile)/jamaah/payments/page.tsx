// dashboard/src/app/(mobile)/jamaah/payments/page.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
import { masterService } from "@/services/masterService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Calendar,
  Building,
  Phone,
  Upload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function JamaahPaymentsPage() {
  const queryClient = useQueryClient();
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    bankId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paidBy: "",
    notes: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-payments"],
    queryFn: () => jamaahSelfService.getPayments(),
  });

  const { data: banksData } = useQuery({
    queryKey: ["jamaah-payment-banks"],
    queryFn: () => masterService.banks.getActive(),
  });
  const banks = Array.isArray(banksData?.data) ? banksData.data : [];

  const submitPaymentMutation = useMutation({
    mutationFn: () => {
      if (!proofFile) throw new Error("Bukti transfer wajib dipilih");
      return jamaahSelfService.submitPayment({
        ...paymentForm,
        proof: proofFile,
      });
    },
    onSuccess: () => {
      setPaymentForm({
        amount: "",
        bankId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paidBy: "",
        notes: "",
      });
      setProofFile(null);
      queryClient.invalidateQueries({ queryKey: ["jamaah-payments"] });
    },
  });

  const replaceProofMutation = useMutation({
    mutationFn: (payload: { paymentId: number; file: File }) =>
      jamaahSelfService.replacePaymentProof(payload.paymentId, payload.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jamaah-payments"] });
    },
  });

  const summary = data?.data?.summary;
  const payments = data?.data?.payments || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-32 w-full rounded-2xl mb-4" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  const hargaFinal = parseFloat(summary?.hargaFinal || "0");
  const totalPayment = parseFloat(summary?.totalPayment || "0");
  const outstanding = parseFloat(summary?.outstanding || "0");
  const progress = hargaFinal > 0 ? (totalPayment / hargaFinal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:max-w-7xl md:px-6 mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/jamaah">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Pembayaran</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div
            className={`p-5 text-white ${
              summary?.statusPayment === "LUNAS"
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : summary?.statusPayment === "CICILAN"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Status Pembayaran</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              {summary?.statusPayment === "LUNAS" ? (
                <CheckCircle className="h-6 w-6" />
              ) : summary?.statusPayment === "CICILAN" ? (
                <Clock className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              <span className="text-2xl font-bold">
                {summary?.statusPayment === "LUNAS"
                  ? "LUNAS"
                  : summary?.statusPayment === "CICILAN"
                    ? "CICILAN"
                    : "BELUM BAYAR"}
              </span>
            </div>
          </div>

          <CardContent className="p-4">
            {/* Progress */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Terbayar</span>
                <span className="font-medium">
                  Rp {totalPayment.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress >= 100
                      ? "bg-green-500"
                      : progress > 0
                        ? "bg-amber-500"
                        : "bg-gray-300"
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">
                  Rp {hargaFinal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Outstanding */}
            {outstanding > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700">
                    Sisa Pembayaran
                  </span>
                  <span className="font-bold text-amber-700">
                    Rp {outstanding.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="font-semibold">Kirim Bukti Pembayaran</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Upload bukti transfer agar admin dapat memeriksa dan memverifikasi pembayaran Anda.
            </p>
            <div className="space-y-3">
              <input
                type="number"
                min="1"
                placeholder="Nominal transfer"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, amount: event.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <select
                value={paymentForm.bankId}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, bankId: event.target.value })
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">Pilih rekening tujuan</option>
                {banks.map((bank: any) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.accountNumber}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paymentDate: event.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Nama penyetor"
                value={paymentForm.paidBy}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paidBy: event.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border px-3 py-2 text-sm"
              />
              <Button
                className="w-full"
                disabled={
                  submitPaymentMutation.isPending ||
                  !paymentForm.amount ||
                  !proofFile
                }
                onClick={() => submitPaymentMutation.mutate()}
              >
                {submitPaymentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Kirim untuk Diverifikasi
              </Button>
              {submitPaymentMutation.isError && (
                <p className="text-xs text-red-600">
                  {(submitPaymentMutation.error as any)?.response?.data?.message ||
                    (submitPaymentMutation.error as Error).message ||
                    "Bukti pembayaran gagal dikirim"}
                </p>
              )}
              {submitPaymentMutation.isSuccess && (
                <p className="text-xs text-green-600">
                  Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="border-0 shadow-md rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Informasi Pembayaran</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Untuk melakukan pembayaran, silakan hubungi agen atau transfer ke
              rekening yang ditentukan.
            </p>
            <p className="text-xs text-gray-500">
              ⚠️ Pelunasan wajib dilakukan H-45 sebelum keberangkatan
            </p>
          </CardContent>
        </Card>

        {/* Payment History */}
        <div>
          <h2 className="font-semibold text-sm mb-3 px-1">
            Riwayat Pembayaran
          </h2>

          {payments.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6 text-center">
                <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Belum ada riwayat pembayaran
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment: any) => (
                <Card
                  key={payment.id}
                  className="border-0 shadow-sm rounded-2xl"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          Pembayaran #{payment.paymentNumber}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(payment.paymentDate),
                            "dd MMM yyyy",
                            {
                              locale: id,
                            },
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          payment.verifiedAt
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {payment.proofStatus === "VERIFIED"
                          ? "Terverifikasi"
                          : payment.proofStatus === "REJECTED"
                            ? "Ditolak"
                            : "Menunggu verifikasi"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {payment.bank && (
                          <>
                            <Building className="h-4 w-4" />
                            <span>{payment.bank.name}</span>
                          </>
                        )}
                      </div>
                      <span className="font-bold text-[var(--color-primary)]">
                        Rp {parseFloat(payment.amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {payment.proofStatus !== "VERIFIED" && (
                      <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-dashed px-3 py-2 text-xs text-blue-700 hover:bg-blue-50">
                        {replaceProofMutation.isPending ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="mr-1 h-3.5 w-3.5" />
                        )}
                        {payment.proofUrl ? "Ganti Bukti Transfer" : "Upload Bukti Transfer"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={replaceProofMutation.isPending}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              replaceProofMutation.mutate({
                                paymentId: payment.id,
                                file,
                              });
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav role="JAMAAH" />
    </div>
  );
}

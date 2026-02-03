// dashboard/src/app/(mobile)/jamaah/payments/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { jamaahSelfService } from "@/services/jamaahSelfService";
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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function JamaahPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["jamaah-payments"],
    queryFn: () => jamaahSelfService.getPayments(),
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
    <div className="min-h-screen bg-gray-50 pb-24">
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
                        {payment.verifiedAt ? "Terverifikasi" : "Pending"}
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

"use client";

import { CalendarDays, ClipboardCheck, FileText, Route } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const DEFAULT_REGISTRATION_REQUIREMENTS = [
  "Fotokopi KTP",
  "Fotokopi Kartu Keluarga",
  "Paspor aktif sesuai ketentuan paket",
  "Pas foto 4x6",
  "Sehat jasmani dan rohani",
].join("\n");

export const DEFAULT_TERMS_CONDITIONS = [
  "Pendaftaran dan penguncian seat berlaku setelah data serta pembayaran DP dikonfirmasi",
  "Pembayaran hanya dilakukan ke rekening resmi PT Sahabat Qolbu Cahaya Baitullah",
  "Biaya yang tidak tercantum dalam fasilitas paket menjadi tanggungan jamaah",
  "Jadwal, hotel, dan maskapai dapat menyesuaikan kondisi operasional dengan pemberitahuan resmi",
  "Dokumen perjalanan dan ketentuan kesehatan wajib dipenuhi sebelum keberangkatan",
].join("\n");

export const DEFAULT_REGISTRATION_STEPS = [
  "Hubungi admin untuk mengecek seat, jadwal, dan pilihan kamar",
  "Pilih paket serta komposisi kamar yang sesuai",
  "Kirim data dan dokumen pendaftaran",
  "Bayar DP melalui rekening resmi perusahaan",
  "Konfirmasi pembayaran kepada admin",
  "Ikuti grup keberangkatan untuk persiapan lanjutan",
].join("\n");

export type PackageItineraryDraft = {
  dayNumber: number;
  title: string;
  activities: string;
};

const parseDate = (value?: string) => {
  if (!value) return null;
  const parts = value.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part)))
    return null;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
};

export const getItineraryDuration = (
  departureDate?: string,
  returnDate?: string,
) => {
  const departure = parseDate(departureDate);
  const returning = parseDate(returnDate);
  if (!departure || !returning || returning < departure) return 0;
  return Math.min(
    Math.floor((returning.getTime() - departure.getTime()) / 86400000) + 1,
    45,
  );
};

export const buildItineraryDrafts = (
  departureDate?: string,
  returnDate?: string,
  current: PackageItineraryDraft[] = [],
) => {
  const duration = getItineraryDuration(departureDate, returnDate);
  const currentList = Array.isArray(current) ? current : [];
  const currentByDay = new Map(
    currentList
      .filter((item) => item && typeof item === "object" && typeof item.dayNumber === "number")
      .map((item) => [item.dayNumber, item]),
  );
  return Array.from({ length: duration }, (_, index) => {
    const dayNumber = index + 1;
    return (
      currentByDay.get(dayNumber) || { dayNumber, title: "", activities: "" }
    );
  });
};

const formatItineraryDate = (
  departureDate: string | undefined,
  dayNumber: number,
) => {
  const date = parseDate(departureDate);
  if (!date) return "Tanggal belum tersedia";
  date.setUTCDate(date.getUTCDate() + dayNumber - 1);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

type PackageContentEditorProps = {
  departureDate?: string;
  returnDate?: string;
  itinerary: PackageItineraryDraft[];
  onItineraryChange: (items: PackageItineraryDraft[]) => void;
  registrationRequirements: string;
  termsConditions: string;
  registrationSteps: string;
  onContentChange: (
    field: "registrationRequirements" | "termsConditions" | "registrationSteps",
    value: string,
  ) => void;
};

export default function PackageContentEditor({
  departureDate,
  returnDate,
  itinerary,
  onItineraryChange,
  registrationRequirements,
  termsConditions,
  registrationSteps,
  onContentChange,
}: PackageContentEditorProps) {
  const days = buildItineraryDrafts(departureDate, returnDate, itinerary);
  const updateDay = (
    dayNumber: number,
    field: "title" | "activities",
    value: string,
  ) => {
    onItineraryChange(
      days.map((day) =>
        day.dayNumber === dayNumber ? { ...day, [field]: value } : day,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Itinerary Teks
          </CardTitle>
          <CardDescription>
            Hari dan tanggal mengikuti periode paket. Kosongkan hari yang belum
            final; publik akan melihat status menunggu konfirmasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.length ? (
            days.map((day) => (
              <div
                key={day.dayNumber}
                className="grid gap-4 rounded-lg border bg-slate-50/60 p-4 md:grid-cols-[170px_minmax(0,1fr)]"
              >
                <div>
                  <p className="text-sm font-bold text-primary">
                    Hari {day.dayNumber}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {formatItineraryDate(departureDate, day.dayNumber)}
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    value={day.title}
                    onChange={(event) =>
                      updateDay(day.dayNumber, "title", event.target.value)
                    }
                    placeholder="Judul, contoh: Keberangkatan menuju Madinah"
                    maxLength={255}
                  />
                  <Textarea
                    value={day.activities}
                    onChange={(event) =>
                      updateDay(day.dayNumber, "activities", event.target.value)
                    }
                    rows={3}
                    placeholder="Satu kegiatan per baris"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
              Isi tanggal keberangkatan dan kepulangan untuk membuat itinerary
              otomatis.
            </div>
          )}
          {days.length < itinerary.length ? (
            <p className="text-sm font-medium text-amber-700">
              Durasi dipersingkat. Hari di luar tanggal kepulangan akan dihapus
              saat paket disimpan.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            field: "registrationRequirements" as const,
            title: "Syarat Daftar",
            description: "Dokumen dan persyaratan jamaah",
            value: registrationRequirements,
            icon: ClipboardCheck,
          },
          {
            field: "termsConditions" as const,
            title: "Syarat & Ketentuan",
            description: "Ketentuan yang berlaku pada paket",
            value: termsConditions,
            icon: FileText,
          },
          {
            field: "registrationSteps" as const,
            title: "Tata Cara Daftar",
            description: "Urutan proses pendaftaran",
            value: registrationSteps,
            icon: CalendarDays,
          },
        ].map(({ field, title, description, value, icon: Icon }) => (
          <Card key={field}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="sr-only">{title}</Label>
              <Textarea
                value={value}
                onChange={(event) => onContentChange(field, event.target.value)}
                rows={12}
                placeholder="Satu poin per baris"
              />
              <p className="mt-2 text-xs text-slate-500">
                Pisahkan setiap poin dengan Enter.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

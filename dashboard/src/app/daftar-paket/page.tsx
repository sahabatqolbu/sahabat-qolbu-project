"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Minus, Plus } from "lucide-react";
import api from "@/lib/axios";
import { prospectService } from "@/services/prospectService";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ADMIN_WHATSAPP = "6281240000101";
const ROOMS = [
  { value: "QUAD", label: "Quad", hint: "4 orang sekamar", field: "priceQuad" },
  { value: "TRIPLE", label: "Triple", hint: "3 orang sekamar", field: "priceTriple" },
  { value: "DOUBLE", label: "Double", hint: "2 orang sekamar", field: "priceDouble" },
] as const;

type RoomType = (typeof ROOMS)[number]["value"];
type PriceFields = { priceQuad?: string | number | null; priceTriple?: string | number | null; priceDouble?: string | number | null };
type PackageOption = PriceFields & { id: number; name: string; isDefault?: boolean; isActive?: boolean };
type PublicPackage = PriceFields & {
  id: number;
  name: string;
  departureDate?: string;
  isBookable?: boolean;
  options?: PackageOption[];
};
type Registered = { continueUrl: string; whatsappNumber: string; packageName: string; staffSessionKept?: boolean };

const rupiah = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
const price = (source: PriceFields | undefined, room: RoomType) =>
  Number(source?.[ROOMS.find((r) => r.value === room)!.field] || 0);
const dateLabel = (value?: string) =>
  value ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "";

function RegistrationForm() {
  const params = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [startedAt] = useState(() => Date.now());
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState<number | null>(Number(params.get("paket")) || null);
  const [optionId, setOptionId] = useState<number | null>(Number(params.get("opsi")) || null);
  const [roomType, setRoomType] = useState<RoomType>("QUAD");
  const [people, setPeople] = useState(1);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState<Registered | null>(null);
  const [error, setError] = useState<{ message: string; registered?: boolean } | null>(null);

  const packagesQuery = useQuery({
    queryKey: ["daftar-paket-packages"],
    queryFn: async () => {
      const result = await prospectService.getPublicPackages({ limit: 100 });
      return ((result.data?.packages || []) as PublicPackage[]).filter((pkg) => pkg.isBookable !== false);
    },
  });
  const packages = useMemo(() => packagesQuery.data ?? [], [packagesQuery.data]);
  const selected = packages.find((pkg) => pkg.id === packageId) || null;
  const options = (selected?.options || []).filter((option) => option.isActive !== false);
  const option = options.find((item) => item.id === optionId) || options.find((item) => item.isDefault) || options[0];
  const priceSource: PriceFields | undefined = option || selected || undefined;
  const unitPrice = price(priceSource, roomType);

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.post("/auth/register/paket", {
        fullName,
        email,
        phone,
        packageId,
        packageOptionId: option?.id,
        roomType,
        people,
        memberNames: memberNames.slice(0, people - 1),
        honeypot,
        formStartedAt: startedAt,
      })).data?.data,
    onSuccess: (data) => {
      if (data?.user) setAuth(data.user);
      setDone({ continueUrl: data.continueUrl, whatsappNumber: data.whatsappNumber, packageName: data.packageName, staffSessionKept: data.staffSessionKept });
    },
    onError: (err: unknown) => {
      const response = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      setError({ message: response?.message || "Pendaftaran gagal. Coba lagi sebentar lagi.", registered: response?.code === "ALREADY_REGISTERED" });
    },
  });

  const changePeople = (next: number) => setPeople(Math.min(10, Math.max(1, next)));
  const canSubmit = fullName.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(email.trim()) && phone.replace(/\D/g, "").length >= 9 && selected && unitPrice > 0;

  if (done?.staffSessionKept) {
    const forwardText = `Assalamu'alaikum, pendaftaran umroh ${done.packageName} sudah kami terima. Silakan lengkapi data jamaah lewat link berikut (berlaku 14 hari, tanpa password):
${done.continueUrl}`;
    return (
      <div className="space-y-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Pendaftaran tercatat</h1>
        <p className="text-sm text-gray-600">Anda tetap login sebagai admin. Kirim link lanjutan ke WhatsApp jamaah agar mereka melengkapi data.</p>
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <a href={`https://wa.me/${done.whatsappNumber}?text=${encodeURIComponent(forwardText)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> Kirim link ke WhatsApp jamaah
          </a>
        </Button>
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Daftarkan jamaah lain</Button>
      </div>
    );
  }

  if (done) {
    const saveText = `Link lanjutan pendaftaran umroh saya (${done.packageName}):\n${done.continueUrl}`;
    return (
      <div className="space-y-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Pendaftaran diterima</h1>
        <p className="text-sm text-gray-600">
          Tim Sahabat Qolbu akan menghubungi Anda lewat WhatsApp untuk konfirmasi seat. Sambil menunggu, lengkapi data diri Anda.
        </p>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => window.location.assign("/jamaah/onboarding")}>Lanjut isi data diri</Button>
          <Button asChild variant="outline" className="w-full">
            <a href={`https://wa.me/${done.whatsappNumber}?text=${encodeURIComponent(saveText)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Simpan link ke WhatsApp saya
            </a>
          </Button>
        </div>
        <p className="text-xs text-gray-500">Link berlaku 14 hari untuk melanjutkan pengisian kapan saja, tanpa password.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (canSubmit) mutation.mutate();
      }}
    >
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Daftar umroh</h1>
        <p className="mt-1 text-sm text-gray-600">Sekitar 1 menit. Tanpa password, belum perlu bayar sekarang.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nama lengkap sesuai KTP</Label>
        <Input id="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <p className="text-xs text-gray-500">Konfirmasi pendaftaran dan link akses dikirim ke email ini.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Nomor WhatsApp</Label>
        <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="08xx xxxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="package">Paket</Label>
        {packagesQuery.isLoading ? (
          <div className="flex h-10 items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat paket</div>
        ) : (
          <select
            id="package"
            value={packageId ?? ""}
            onChange={(e) => { setPackageId(Number(e.target.value) || null); setOptionId(null); }}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            required
          >
            <option value="">Pilih paket</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>{pkg.name}{pkg.departureDate ? ` · ${dateLabel(pkg.departureDate)}` : ""}</option>
            ))}
          </select>
        )}
      </div>

      {options.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="option">Pilihan hotel</Label>
          <select id="option" value={option?.id ?? ""} onChange={(e) => setOptionId(Number(e.target.value))} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm">
            {options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      )}

      {selected && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-900">Tipe kamar</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROOMS.map((room) => {
              const roomPrice = price(priceSource, room.value);
              const active = roomType === room.value;
              return (
                <button
                  key={room.value}
                  type="button"
                  disabled={roomPrice <= 0}
                  aria-pressed={active}
                  onClick={() => setRoomType(room.value)}
                  className={`rounded-md border p-2 text-left disabled:opacity-40 ${active ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-gray-300"}`}
                >
                  <span className="block text-sm font-medium text-gray-900">{room.label}</span>
                  <span className="block text-[11px] text-gray-500">{room.hint}</span>
                  <span className="mt-1 block text-xs tabular-nums text-gray-800">{roomPrice > 0 ? rupiah(roomPrice) : "Tidak tersedia"}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="space-y-2">
        <Label>Jumlah orang</Label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" aria-label="Kurangi" onClick={() => changePeople(people - 1)} disabled={people <= 1}><Minus className="h-4 w-4" /></Button>
          <span className="w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">{people}</span>
          <Button type="button" variant="outline" size="icon" aria-label="Tambah" onClick={() => changePeople(people + 1)} disabled={people >= 10}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {people > 1 && (
        <div className="space-y-2">
          <Label>Nama anggota keluarga (boleh diisi nanti)</Label>
          {Array.from({ length: people - 1 }, (_, index) => (
            <Input
              key={index}
              aria-label={`Nama anggota ${index + 2}`}
              placeholder={`Anggota ${index + 2}`}
              value={memberNames[index] || ""}
              onChange={(e) => setMemberNames((names) => { const next = [...names]; next[index] = e.target.value; return next; })}
            />
          ))}
        </div>
      )}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden="true" />

      {selected && unitPrice > 0 && (
        <div className="flex items-baseline justify-between rounded-md border border-gray-200 bg-gray-50 p-3">
          <span className="text-sm text-gray-600">Estimasi total ({people} orang)</span>
          <span className="text-lg font-semibold tabular-nums text-gray-900">{rupiah(unitPrice * people)}</span>
        </div>
      )}

      {error && (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <p>{error.message}</p>
          {error.registered && (
            <a className="inline-flex items-center font-medium underline" href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noopener noreferrer">
              Hubungi admin lewat WhatsApp
            </a>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit || mutation.isPending}>
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Daftar sekarang
      </Button>
      <p className="text-center text-xs text-gray-500">
        Seat dikunci setelah dikonfirmasi tim kami atau setelah DP. Sudah punya akun? <a href="/login" className="underline">Masuk</a>
      </p>
    </form>
  );
}

export default function PackageRegistrationPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <img src="/images/icon.png" alt="Sahabat Qolbu" className="mb-4 h-10 w-10 object-contain" />
        <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-gray-400" />}>
          <RegistrationForm />
        </Suspense>
      </div>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getDashboardUrl } from "@/lib/dashboard-url";

type RegisterForm = {
  fullName: string;
  phone: string;
  city: string;
  experience: string;
  referral: string;
};

type SessionUser = {
  fullName?: string;
  role?: string;
};

const whatsappNumber = "6281255871984";

const initialForm: RegisterForm = {
  fullName: "",
  phone: "",
  city: "",
  experience: "Belum pernah menjadi agen",
  referral: "",
};

const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(
    /\/+$/,
    "",
  );

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const dashboardUrl = useMemo(
    () => getDashboardUrl(sessionUser?.role),
    [sessionUser?.role],
  );

  useEffect(() => {
    let cancelled = false;

    const readStoredUser = () => {
      try {
        const stored = window.localStorage.getItem("user_data");
        return stored ? (JSON.parse(stored) as SessionUser) : null;
      } catch {
        window.localStorage.removeItem("user_data");
        return null;
      }
    };

    const checkSession = async () => {
      const storedUser = readStoredUser();
      if (!cancelled && storedUser) {
        setSessionUser(storedUser);
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          window.localStorage.removeItem("user_data");
          if (!cancelled) setSessionUser(null);
          return;
        }

        const payload = await response.json();
        const user = payload?.data as SessionUser | undefined;
        if (user) {
          window.localStorage.setItem("user_data", JSON.stringify(user));
          if (!cancelled) setSessionUser(user);
        }
      } catch {
        // Keep local session state if the API is unreachable.
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateForm = (field: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitRegistration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = [
      "Assalamualaikum, saya ingin daftar jadi agen Sahabat Qolbu.",
      "",
      `Nama: ${form.fullName}`,
      `No. WhatsApp: ${form.phone}`,
      `Kota/Domisili: ${form.city}`,
      `Pengalaman: ${form.experience}`,
      `Referral/Perekrut: ${form.referral || "-"}`,
      "",
      "Mohon dibantu proses pendaftarannya.",
    ].join("\n");

    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message,
    )}`;
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-primary">
      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,193,7,0.24),transparent_34%),linear-gradient(135deg,#0A2C45_0%,#133C5A_100%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
              <Sparkles className="h-4 w-4" />
              Pendaftaran Agen Sahabat Qolbu
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Bangun jaringan umroh dengan sistem yang rapi dan transparan.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Isi data singkat di halaman ini. Tim kami akan menghubungi Anda
              untuk verifikasi, aktivasi akun, dan panduan melengkapi profil
              agen di dashboard.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Review admin", "Data agen diverifikasi sebelum aktif"],
                ["Dashboard online", "Kelola profil, jamaah, dan komisi"],
                ["Dibimbing tim", "Ada alur onboarding setelah akun dibuat"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <CheckCircle2 className="mb-3 h-5 w-5 text-gold" />
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-sm text-white/65">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white p-5 text-primary shadow-2xl sm:p-7">
            <div className="mb-6 rounded-2xl bg-primary-50 p-4">
              {checkingSession ? (
                <div className="flex items-center gap-3 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengecek status login...
                </div>
              ) : sessionUser ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-primary">
                      Akun aktif terdeteksi
                    </p>
                    <p className="text-sm text-neutral-600">
                      {sessionUser.fullName || "Pengguna"} sudah login. Lanjut
                      ke dashboard untuk melengkapi data.
                    </p>
                  </div>
                  <a
                    href={dashboardUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-600"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-primary">
                      Sudah punya akun?
                    </p>
                    <p className="text-sm text-neutral-600">
                      Masuk ke dashboard untuk lanjutkan pendaftaran.
                    </p>
                  </div>
                  <a
                    href={`${getDashboardUrl()}/login`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Login
                  </a>
                </div>
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary-600">
                Form Minat Agen
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-primary">
                Daftar untuk dihubungi tim
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Data ini akan dikirim ke WhatsApp admin agar tim bisa membuat
                akun dan menjelaskan tahap berikutnya.
              </p>
            </div>

            <form onSubmit={submitRegistration} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-primary"
                >
                  Nama Lengkap
                </label>
                <input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  placeholder="Nama sesuai KTP"
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-primary outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-primary"
                  >
                    No. WhatsApp
                  </label>
                  <input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-primary outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-semibold text-primary"
                  >
                    Kota/Domisili
                  </label>
                  <input
                    id="city"
                    required
                    value={form.city}
                    onChange={(event) => updateForm("city", event.target.value)}
                    placeholder="Contoh: Bogor"
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-primary outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="mb-2 block text-sm font-semibold text-primary"
                >
                  Pengalaman
                </label>
                <select
                  id="experience"
                  value={form.experience}
                  onChange={(event) =>
                    updateForm("experience", event.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-primary outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
                >
                  <option>Belum pernah menjadi agen</option>
                  <option>Pernah menjadi agen travel</option>
                  <option>Punya komunitas/jaringan jamaah</option>
                  <option>Sudah punya tim penjualan</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="referral"
                  className="mb-2 block text-sm font-semibold text-primary"
                >
                  Referral/Perekrut
                </label>
                <input
                  id="referral"
                  value={form.referral}
                  onChange={(event) => updateForm("referral", event.target.value)}
                  placeholder="Opsional"
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-primary outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-6 py-4 font-extrabold text-primary shadow-lg shadow-gold/25 transition hover:bg-secondary-400"
              >
                <Send className="h-5 w-5" />
                Kirim Pendaftaran via WhatsApp
              </button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [ShieldCheck, "Legalitas resmi"],
                [Users, "Jaringan agen"],
                [ArrowRight, "Onboarding jelas"],
              ].map(([Icon, label]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-3 text-sm font-semibold text-primary"
                >
                  <Icon className="h-4 w-4 text-secondary-600" />
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

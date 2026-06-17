import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import PackageCard from "@/components/marketing/PackageCard";
import { getFeaturedMarketingPackages } from "@/lib/public-api";

const stats = [
  { label: "Jamaah Terlayani", value: "10K+", icon: Users },
  { label: "Legalitas PPIU", value: "Resmi", icon: ShieldCheck },
  { label: "Pendampingan", value: "Full", icon: Handshake },
];

const valueProps = [
  "Paket aktif langsung dari database operasional",
  "Tim membantu pilih jadwal, hotel, dan skema kamar",
  "Konsultasi WhatsApp cepat sebelum booking seat",
];

export default async function LandingPage() {
  const packages = await getFeaturedMarketingPackages(3);

  return (
    <div className="bg-neutral-50">
      <section
        id="beranda"
        className="relative overflow-hidden bg-primary pb-20 pt-36 text-white md:pt-44"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,193,7,0.25),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(255,255,255,0.12),transparent_24rem)]" />
        <div className="container-custom relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-bold backdrop-blur">
                <Sparkles className="h-4 w-4 text-secondary" />
                Travel umroh resmi dengan layanan personal
              </div>
              <h1 className="font-display text-5xl font-black leading-[1.02] md:text-7xl">
                Umroh yang tertata, tenang, dan jelas sejak awal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
                Sahabat Qolbu membantu jamaah memilih paket, memahami fasilitas,
                dan berkonsultasi sebelum booking. Semua paket publik di halaman
                ini diambil dari database terbaru.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/landing/paket" className="btn-primary">
                  Lihat Paket Umroh
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="https://wa.me/6281255871984?text=Assalamualaikum,%20saya%20ingin%20konsultasi%20paket%20umroh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline-white"
                >
                  Konsultasi WhatsApp
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
                  >
                    <Icon className="mb-4 h-7 w-7 text-secondary" />
                    <p className="font-display text-3xl font-black">{value}</p>
                    <p className="mt-1 text-sm font-semibold text-white/65">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-secondary/30 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/25 backdrop-blur">
                <div
                  aria-label="Jamaah Sahabat Qolbu"
                  className="aspect-[4/5] w-full rounded-[1.5rem] bg-cover bg-center"
                  style={{ backgroundImage: "url('/landing/images/about-1.webp')" }}
                />
                <div className="absolute bottom-8 left-8 right-8 rounded-3xl bg-white p-5 text-primary shadow-xl">
                  <div className="flex items-center gap-2 text-sm font-bold text-secondary">
                    <BadgeCheck className="h-5 w-5" />
                    Pendampingan jamaah
                  </div>
                  <p className="mt-2 text-lg font-black">
                    Jadwal, hotel, seat, dan konsultasi dalam satu alur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="bg-white py-20">
        <div className="container-custom grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="badge badge-secondary mb-5">Tentang Kami</p>
            <h2 className="heading-section">
              Bukan sekadar menjual paket, tapi menjaga perjalanan ibadah.
            </h2>
          </div>
          <div className="grid gap-4">
            {valueProps.map((item) => (
              <div
                key={item}
                className="flex gap-4 rounded-3xl border-4 border-neutral-100 bg-neutral-50 p-5"
              >
                <Star className="mt-1 h-6 w-6 flex-none fill-secondary text-secondary" />
                <p className="text-body font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="paket" className="bg-neutral-50 py-20">
        <div className="container-custom">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="badge badge-secondary mb-5">Paket Pilihan</p>
              <h2 className="heading-section">Paket umroh terbaru</h2>
              <p className="mt-4 max-w-2xl text-body">
                Paket berikut diambil dari database publik. Buka detail untuk
                melihat jadwal, fasilitas, hotel, dan harga.
              </p>
            </div>
            <Link href="/landing/paket" className="btn-secondary">
              Semua Paket
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {packages.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  detailBasePath="/landing/paket"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-4 border-neutral-100 bg-white p-10 text-center">
              <p className="font-bold text-neutral-600">
                Paket belum tersedia. Silakan hubungi admin untuk jadwal terbaru.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="testimoni" className="bg-white py-20">
        <div className="container-custom grid gap-6 md:grid-cols-3">
          {[
            ["Pelayanan jelas", "Tim responsif dari konsultasi sampai persiapan."],
            ["Paket mudah dipahami", "Detail hotel, jadwal, dan harga tersaji rapi."],
            ["Pendampingan tenang", "Cocok untuk jamaah yang ingin dibantu dari awal."],
          ].map(([title, body]) => (
            <div key={title} className="card p-7">
              <div className="mb-4 flex gap-1 text-secondary">
                {[0, 1, 2, 3, 4].map((item) => (
                  <Star key={item} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <h3 className="heading-card">{title}</h3>
              <p className="mt-3 text-neutral-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="section-primary py-20">
        <div className="container-custom text-center">
          <MapPin className="mx-auto mb-5 h-10 w-10 text-secondary" />
          <h2 className="font-display text-4xl font-black">
            Siap konsultasi paket yang cocok?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Kirim pertanyaan melalui WhatsApp. Tim akan bantu cek jadwal,
            ketersediaan seat, dan pilihan kamar.
          </p>
          <a
            id="daftar"
            href="https://wa.me/6281255871984?text=Assalamualaikum,%20saya%20ingin%20konsultasi%20paket%20umroh"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-8"
          >
            Chat Sekarang
          </a>
        </div>
      </section>
    </div>
  );
}

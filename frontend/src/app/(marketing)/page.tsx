"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useBranding } from "@/components/providers/BrandingProvider";
import GalleryMarquee from "@/components/marketing/GalleryMarquee";
import HeroSlider from "@/components/marketing/HeroSlider";
import PackageCard from "@/components/marketing/PackageCard";
import PackageSearchBar, {
  type PackageFilters,
} from "@/components/marketing/PackageSearchBar";
import {
  getMarketingPackages,
  getPublicGallery,
  getPublicHeroSlides,
  type MarketingPackage,
  type PublicGalleryImage,
  type PublicHeroSlide,
} from "@/lib/public-api";

const EMPTY_PACKAGE_FILTERS: PackageFilters = {
  departureMonth: "",
  duration: "",
  airline: "",
};

export default function MarketingHomePage() {
  const branding = useBranding();
  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [galleryImages, setGalleryImages] = useState<PublicGalleryImage[]>([]);
  const [heroSlides, setHeroSlides] = useState<PublicHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PackageFilters>(EMPTY_PACKAGE_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<PackageFilters>(EMPTY_PACKAGE_FILTERS);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getMarketingPackages(),
      getPublicGallery(),
      getPublicHeroSlides(),
    ]).then(([packageResult, galleryResult, heroResult]) => {
      if (!active) return;
      if (packageResult.status === "fulfilled") {
        setPackages(packageResult.value);
      }
      if (galleryResult.status === "fulfilled") {
        setGalleryImages(galleryResult.value);
      }
      if (heroResult.status === "fulfilled") {
        setHeroSlides(heroResult.value);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredPackages = useMemo(
    () =>
      packages.filter(
        (pkg) =>
          (!appliedFilters.departureMonth ||
            pkg.departureDate?.startsWith(appliedFilters.departureMonth)) &&
          (!appliedFilters.duration ||
            String(pkg.duration) === appliedFilters.duration) &&
          (!appliedFilters.airline ||
            pkg.airline?.name === appliedFilters.airline),
      ),
    [appliedFilters, packages],
  );
  const featuredPackages = filteredPackages.slice(0, 6);
  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);

  const handlePackageSearch = () => {
    setAppliedFilters(filters);
    window.setTimeout(() => {
      document.getElementById("paket")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const resetPackageSearch = () => {
    setFilters(EMPTY_PACKAGE_FILTERS);
    setAppliedFilters(EMPTY_PACKAGE_FILTERS);
  };

  const messageConsult = encodeURIComponent(
    `Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik dengan paket umroh ${branding.companyName}`,
  );
  const waHeroLink = `https://wa.me/${branding.whatsappNumber}?text=${messageConsult}`;

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-800">
      {/* HERO SECTION */}
      <section
        id="beranda"
        className="relative bg-[#071a33] pb-20 pt-20 md:pb-16"
      >
        <h1 className="sr-only">
          Sahabat Qolbu, Travel Umroh Sunnah Berizin Resmi
        </h1>
        <p className="sr-only">
          Berangkat Umroh, Pulang Berhijrah dengan pendampingan jamaah dari
          seluruh Indonesia sesuai Al-Qur&apos;an dan Sunnah.
        </p>
        <HeroSlider slides={heroSlides} />

        <svg
          className="pointer-events-none absolute -bottom-[38px] left-0 z-[5] h-10 w-full md:-bottom-[48px] md:h-[50px]"
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 0 H1440 V1 Q720 69 0 1 Z" fill="#0a2c45" />
          <path
            d="M0 1 Q720 69 1440 1"
            fill="none"
            stroke="#ffc107"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </section>

      <div className="relative z-20 -mt-16 md:-mt-[58px]">
        <PackageSearchBar
          packages={packages}
          filters={filters}
          onChange={setFilters}
          onSearch={handlePackageSearch}
        />
      </div>

      {/* PAKET UMROH */}
      <section id="paket" className="scroll-mt-24 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-gold font-semibold text-sm uppercase tracking-wider">
              Paket Umroh
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
              Seat Terbatas! Booking Sekarang
            </h2>
            <p className="text-gray-600 font-medium">
              {hasActiveFilters
                ? `${filteredPackages.length} paket sesuai pencarian Anda`
                : "Rasakan Kekhusyukan Saat Beribadah bersama Sahabat Qolbu"}
            </p>
            <div className="mt-4 bg-primary/5 inline-block px-4 py-2 rounded-lg text-sm sm:text-base">
              <span className="text-primary font-bold">
                📢 Satu-satunya Travel Umroh dengan Tim Medis Pribadi!
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold text-primary">
                Paket yang dicari belum tersedia
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Coba ubah pilihan bulan, durasi, atau maskapai.
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetPackageSearch}
                  className="mt-5 rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  Tampilkan Semua Paket
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}

          {/* Lihat Semua Button */}
          <div className="text-center mt-10">
            <Link
              href="/paket"
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <span>Lihat Semua Paket</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          {/* Urgency Alert */}
          <div className="mt-10 p-4 bg-red-50 border border-red-100 rounded-xl max-w-2xl mx-auto text-center animate-pulse">
            <p className="text-red-600 font-bold">
              ⚠️ Segera booking seat sebelum kehabisan!
            </p>
            <p className="text-sm text-red-500">
              Kuota setiap keberangkatan terbatas untuk menjaga kenyamanan
              jamaah.
            </p>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="relative overflow-hidden bg-primary py-16 text-white md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/20" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold">
              Keunggulan Kami
            </span>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl">
              Mengapa Sahabat Qolbu?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
              Setiap detail perjalanan disiapkan agar jamaah bisa fokus
              beribadah dengan jadwal, fasilitas, dan pendampingan yang jelas.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Harga Terbaik</h3>
              <p className="text-sm leading-6 text-gray-300">
                Paket Umroh dan Haji dengan fasilitas terbaik di kelasnya.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Sesuai Syariat</h3>
              <p className="text-sm leading-6 text-gray-300">
                Kegiatan ibadah InsyaAllah sesuai Al-Quran & Sunnah.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Tim Medis Pribadi</h3>
              <p className="text-sm leading-6 text-gray-300">
                Satu-satunya travel umroh dengan pendampingan tim medis pribadi.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Jadwal Tepat</h3>
              <p className="text-sm leading-6 text-gray-300">
                Tanggal berangkat, nomor pesawat & itinerary sudah tertera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {galleryImages.length > 0 ? (
        <section id="gallery" className="overflow-hidden bg-gray-50 py-16 md:py-24">
          <div className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                Gallery
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                Dokumentasi Perjalanan Jamaah
              </h2>
              <p className="text-gray-600">
                Momen jamaah Sahabat Qolbu dalam perjalanan ibadah.
              </p>
            </div>
          </div>
          <GalleryMarquee images={galleryImages} />
        </section>
      ) : null}

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-primary py-16 md:py-24">
        {/* Decorative Elements */}
        <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/15" />
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/10">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-8 md:p-10 lg:p-12">
                <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Siap Konsultasi?
                </span>
                <h2 className="mt-6 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                  Wujudkan Rindu Baitullah Bersama Kami
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-gray-200 md:text-lg">
                  &quot;Rasakan Kekhusyukan Saat Beribadah&quot;. Tim kami siap
                  bantu jelaskan paket, jadwal, fasilitas, dan alur pendaftaran.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={waHeroLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-md bg-gold px-7 py-4 text-base font-bold text-primary shadow-lg shadow-gold/20 transition hover:bg-gold-dark"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                  <Link
                    href="/paket"
                    className="inline-flex items-center justify-center rounded-md border border-white/25 px-7 py-4 text-base font-bold text-white transition hover:bg-white hover:text-primary"
                  >
                    Lihat Semua Paket
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.06] p-8 md:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <div className="grid gap-4">
                  {[
                    "Konsultasi paket dan jadwal keberangkatan",
                    "Arahan pendaftaran calon jamaah",
                    "Informasi hotel, maskapai, dan fasilitas",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-4"
                    >
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-primary">
                        ✓
                      </span>
                      <p className="text-sm leading-6 text-gray-100">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

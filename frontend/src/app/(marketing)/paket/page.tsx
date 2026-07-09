"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useBranding } from "@/components/providers/BrandingProvider";
import PackageCard from "@/components/marketing/PackageCard";
import { getMarketingPackages, type MarketingPackage } from "@/lib/public-api";

// Helper categories matching legacy style
const typeList = [
  {
    id: "all",
    name: "Semua",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    id: "reguler",
    name: "Reguler",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    id: "extreme",
    name: "Extreme",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    id: "semi-mandiri",
    name: "Semi Mandiri",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    id: "fleksibilitas",
    name: "Fleksibel",
    icon: (
      <svg
        className="w-4 h-4"
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
    ),
  },
  {
    id: "konsorsium",
    name: "Konsorsium",
    icon: (
      <svg
        className="w-4 h-4"
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
    ),
  },
  {
    id: "la",
    name: "Land Arrangement",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
        />
      </svg>
    ),
  },
];

const getTabFromPackageType = (typeQuery: string | null) => {
  if (typeQuery === "UMRAH") return "reguler";
  if (typeQuery === "UMRAH_RAMADHAN") return "fleksibilitas";
  if (typeQuery === "UMRAH_PLUS") return "extreme";
  return "all";
};

function PackagesInnerPage() {
  const branding = useBranding();
  const searchParams = useSearchParams();

  // Active filter tab
  const [activeTab, setActiveTab] = useState(() =>
    getTabFromPackageType(searchParams.get("type")),
  );
  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMarketingPackages()
      .then((data) => {
        if (active) {
          setPackages(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load packages", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Map package raw type to tipeList IDs
  const getMappedType = (pkg: MarketingPackage) => {
    const rawType = pkg.backendType || "";
    if (rawType === "FULL_SERVICE") return "reguler";
    if (rawType === "EXTREME") return "extreme";
    if (rawType === "SEMI_MANDIRI") return "semi-mandiri";
    if (rawType === "FLEKSIBILITAS") return "fleksibilitas";
    if (rawType === "KONSORSIUM") return "konsorsium";
    if (rawType === "LA") return "la";
    return "reguler";
  };

  // Filter packages based on activeTab
  const filteredPackages = packages.filter((pkg) => {
    if (activeTab === "all") return true;
    return getMappedType(pkg) === activeTab;
  });

  // Count helper
  const getCountByTipe = (tipeId: string) => {
    if (tipeId === "all") return packages.length;
    return packages.filter((p) => getMappedType(p) === tipeId).length;
  };

  const messageConsult = encodeURIComponent(
    "Halo, saya mau konsultasi paket umroh",
  );
  const waContactLink = `https://wa.me/${branding.whatsappNumber}?text=${messageConsult}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
      {/* Page Header */}
      <section className="bg-primary pt-28 pb-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
              Pilih Paket Umroh
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
              Menampilkan{" "}
              <span className="text-gold font-bold">
                {filteredPackages.length}
              </span>{" "}
              paket
            </p>
          </div>

          {/* MOBILE: Dropdown Filter */}
          <div className="md:hidden max-w-sm mx-auto">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {typeList.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-primary text-white"
                  >
                    {t.name} ({getCountByTipe(t.id)})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* DESKTOP: Tabs Filter */}
          <div className="hidden md:flex gap-2 justify-center flex-wrap">
            {typeList.map((t) => {
              const count = getCountByTipe(t.id);
              const isActive = activeTab === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`filter-btn group/btn relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-white text-primary shadow-lg"
                        : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                >
                  <span className="transition-transform duration-200 group-hover/btn:scale-110">
                    {t.icon}
                  </span>
                  <span>{t.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors
                      ${isActive ? "bg-primary/10 text-primary" : "bg-white/10 text-white/60"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {/* Grid Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto">
              <p className="text-xl font-bold text-primary">
                Paket belum tersedia
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Silakan cek kembali nanti atau hubungi admin untuk jadwal
                terbaru.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* CTA Section */}
      <section className="relative overflow-hidden bg-primary py-16 md:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/10 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
            <div>
              <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold">
                Butuh Bantuan Pilih Paket?
              </span>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
                Konsultasi Dulu Sebelum Menentukan Keberangkatan
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-200">
                Tim kami bantu cocokkan jadwal, budget, hotel, maskapai, dan
                kebutuhan keluarga agar pilihan paket lebih tenang.
              </p>
              <a
                href={waContactLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center gap-3 rounded-md bg-gold px-7 py-4 text-base font-bold text-primary shadow-lg shadow-gold/20 transition hover:bg-gold-dark"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                Chat WhatsApp
              </a>
            </div>

            <div className="grid gap-3">
              {[
                "Rekomendasi paket sesuai jadwal dan budget",
                "Penjelasan fasilitas hotel, maskapai, dan itinerary",
                "Arahan pendaftaran calon jamaah dari awal",
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
      </section>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PackagesInnerPage />
    </Suspense>
  );
}

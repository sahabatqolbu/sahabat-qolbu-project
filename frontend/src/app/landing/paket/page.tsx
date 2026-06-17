import Link from "next/link";
import { ArrowLeft, Filter, PackageSearch } from "lucide-react";
import PackageCard from "@/components/marketing/PackageCard";
import PackageFilters from "@/components/marketing/PackageFilters";
import { getMarketingPackages } from "@/lib/public-api";

type SearchParams = Promise<{
  search?: string;
  type?: string;
  month?: string;
}>;

const normalizeTypeFilter = (value?: string) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["umrah", "regular", "reguler", "full_service"].includes(normalized)) {
    return "UMRAH";
  }

  if (["umrah_plus", "plus", "extreme", "la"].includes(normalized)) {
    return "UMRAH_PLUS";
  }

  if (["umrah_ramadhan", "ramadhan", "ramadan"].includes(normalized)) {
    return "UMRAH_RAMADHAN";
  }

  return "";
};

export default async function LandingPackagesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = String(params.search || "").trim().toLowerCase();
  const type = normalizeTypeFilter(params.type);
  const month = Number.parseInt(String(params.month || ""), 10);

  const packages = await getMarketingPackages();
  const filteredPackages = packages.filter((pkg) => {
    if (type && pkg.type !== type) return false;
    if (search && !pkg.name.toLowerCase().includes(search)) return false;

    if (Number.isFinite(month) && month > 0) {
      const departureMonth = new Date(pkg.departureDate).getMonth() + 1;
      if (departureMonth !== month) return false;
    }

    return true;
  });

  return (
    <div className="bg-gradient-to-b from-neutral-50 to-white pb-20 pt-32">
      <section className="container-custom mb-12">
        <Link
          href="/landing"
          className="mb-6 inline-flex items-center gap-2 font-bold text-primary transition-colors hover:text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
          Kembali ke Beranda
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-white shadow-2xl md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,193,7,0.28),transparent_24rem),radial-gradient(circle_at_86%_18%,rgba(255,255,255,0.12),transparent_22rem)]" />
          <div className="relative max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-black text-primary">
              <PackageSearch className="h-4 w-4" />
              Paket database terbaru
            </p>
            <h1 className="font-display text-4xl font-black md:text-6xl">
              Pilih paket umroh yang paling pas.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/75">
              Semua paket di halaman ini dirender dari data backend publik, bukan
              HTML lama. Gunakan filter untuk mencari tipe paket, bulan, atau nama.
            </p>
          </div>
        </div>
      </section>

      <section className="container-custom">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <div className="mb-4 flex items-center gap-2 font-black text-primary lg:hidden">
              <Filter className="h-5 w-5 text-secondary" />
              Filter Paket
            </div>
            <PackageFilters basePath="/landing/paket" />
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border-2 border-neutral-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-500">Total hasil</p>
                <p className="text-2xl font-black text-primary">
                  {filteredPackages.length} paket
                </p>
              </div>
              <Link
                href="/landing/paket"
                className="text-sm font-bold text-secondary transition-colors hover:text-secondary-600"
              >
                Reset filter
              </Link>
            </div>

            {filteredPackages.length > 0 ? (
              <div className="grid gap-6 md:gap-8 xl:grid-cols-2">
                {filteredPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    detailBasePath="/landing/paket"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-4 border-neutral-100 bg-white px-6 py-16 text-center shadow-lg">
                <h2 className="mb-3 text-2xl font-bold text-primary">
                  Paket Tidak Ditemukan
                </h2>
                <p className="mx-auto max-w-2xl text-neutral-600">
                  Tidak ada paket yang cocok dengan filter saat ini. Coba ubah
                  pencarian atau hapus filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

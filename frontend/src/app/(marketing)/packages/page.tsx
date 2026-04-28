import Link from "next/link";
import { getMarketingPackages } from "@/lib/public-api";
import PackageCard from "@/components/marketing/PackageCard";
import PackageFilters from "@/components/marketing/PackageFilters";

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

export default async function PackagesPage({
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
    if (type && pkg.type !== type) {
      return false;
    }

    if (search && !pkg.name.toLowerCase().includes(search)) {
      return false;
    }

    if (Number.isFinite(month) && month > 0) {
      const departureMonth = new Date(pkg.departureDate).getMonth() + 1;
      if (departureMonth !== month) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="bg-gradient-to-b from-neutral-50 to-white pb-20 pt-32">
      <section className="container-custom mb-12">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border-2 border-secondary/20 bg-secondary/10 px-5 py-2 text-sm font-bold text-primary">
            Paket Umroh Publik
          </p>
          <h1 className="mb-4 font-display text-4xl font-black text-primary md:text-5xl">
            Temukan Paket Umroh yang Sesuai
          </h1>
          <p className="text-lg text-neutral-600">
            Halaman ini menampilkan paket aktif dari backend publik tanpa iframe.
            Gunakan filter untuk menyaring tipe paket, bulan keberangkatan, atau
            nama paket.
          </p>
        </div>
      </section>

      <section className="container-custom">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside>
            <PackageFilters />
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border-2 border-neutral-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-500">
                  Total hasil
                </p>
                <p className="text-2xl font-black text-primary">
                  {filteredPackages.length} paket
                </p>
              </div>
              <Link
                href="/"
                className="text-sm font-bold text-secondary transition-colors hover:text-secondary-600"
              >
                Kembali ke beranda
              </Link>
            </div>

            {filteredPackages.length > 0 ? (
              <div className="grid gap-6 md:gap-8 xl:grid-cols-2">
                {filteredPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-4 border-neutral-100 bg-white px-6 py-16 text-center shadow-lg">
                <h2 className="mb-3 text-2xl font-bold text-primary">
                  Paket Tidak Ditemukan
                </h2>
                <p className="mx-auto max-w-2xl text-neutral-600">
                  Tidak ada paket yang cocok dengan filter saat ini. Coba ubah
                  pencarian atau hapus filter untuk melihat semua paket publik.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

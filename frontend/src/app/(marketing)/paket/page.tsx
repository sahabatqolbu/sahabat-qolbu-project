import type { Metadata } from "next";
import { Suspense } from "react";
import PackageBrowser from "@/components/sq/PackageBrowser";
import { WaLink } from "@/components/sq/chrome";
import { IconCalendar, IconCheck } from "@/components/sq/icons";
import { Closing, PageHead, rupiah, titleCase, viewPackage } from "@/components/sq/ui";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { getMarketingPackages, getPublicPackageScheduleLists } from "@/lib/public-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Paket Umroh Sahabat Qolbu",
  description:
    "Semua paket umroh Sahabat Qolbu: jadwal, harga kamar Quad, Triple, dan Double, status seat, dan riwayat keberangkatan.",
  alternates: { canonical: "/paket" },
};

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const monthName = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : key;
};
const scheduleStatus: Record<string, string> = { CHECK_SEAT: "Cek seat", SOLD_OUT: "Penuh", CLOSED: "Tutup" };

export default async function PackagesPage() {
  const [packages, lists] = await Promise.all([getMarketingPackages(), getPublicPackageScheduleLists()]);
  const open = packages.map(viewPackage).filter((v) => v.open);
  const cheapest = open.length ? Math.min(...open.map((v) => v.price).filter(Boolean)) : 0;
  const months = [...new Set(open.map((v) => v.month).filter(Boolean))].sort();
  const now = new Date().toISOString().slice(0, 10);
  const activeLists = lists
    .map((list) => ({ ...list, items: list.items.filter((item) => item.departureDate >= now) }))
    .filter((list) => list.items.length);

  return (
    <>
      <PageHead
        image="/sq/clock-tower.webp"
        crumbs={[{ href: "/", label: "Beranda" }, { label: "Paket Umroh" }]}
        title="Paket umroh Sahabat Qolbu"
        lead="Saring berdasarkan bulan, jenis, maskapai, atau status. Harga per orang untuk setiap tipe kamar langsung terlihat."
      >
        <div className="hchips">
          <span className="ok"><IconCheck />{open.length} jadwal masih tersedia</span>
          {months.length ? (
            <span><IconCalendar />{monthName(months[0])}{months.length > 1 ? ` sampai ${monthName(months[months.length - 1])}` : ""}</span>
          ) : null}
          {cheapest ? <span>Mulai {rupiah(cheapest)}</span> : null}
        </div>
      </PageHead>

      <Suspense fallback={null}>
        <PackageBrowser packages={packages} />
      </Suspense>

      {activeLists.length ? (
        <section className="sec sched" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <h2 className="h2" style={{ fontSize: 26 }}>Jadwal dan harga lainnya</h2>
            <p className="lead">Jadwal tambahan yang dikonfirmasi admin lewat WhatsApp.</p>
            {activeLists.map((list) => (
              <details key={list.id}>
                <summary>
                  <span>{titleCase(list.name)} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({list.items.length} jadwal)</span></span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </summary>
                <div style={{ padding: "0 22px 22px" }}>
                  {list.subtitle ? <p style={{ color: "var(--muted)", marginBottom: 14 }}>{list.subtitle}</p> : null}
                  <div className="scroll">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th scope="col">Berangkat</th>
                          <th scope="col">Maskapai</th>
                          <th scope="col">Hotel</th>
                          <th scope="col" className="n">Quad</th>
                          <th scope="col" className="n">Triple</th>
                          <th scope="col" className="n">Double</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ whiteSpace: "nowrap" }}>{item.departureDate}{item.duration ? `, ${item.duration} hari` : ""}</td>
                            <td>{item.airline?.name || "-"}</td>
                            <td>Makkah: {item.hotelMakkahLabel}<br />Madinah: {item.hotelMadinahLabel}</td>
                            <td className="n">{rupiah(Number(item.priceQuad))}</td>
                            <td className="n">{rupiah(Number(item.priceTriple))}</td>
                            <td className="n">{rupiah(Number(item.priceDouble))}</td>
                            <td>
                              {item.effectiveStatus === "CHECK_SEAT" ? (
                                <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin cek seat ${list.name} tanggal ${item.departureDate}`}>Cek seat</WaLink>
                              ) : (
                                scheduleStatus[item.effectiveStatus] || item.effectiveStatus
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {list.note ? <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 12 }}>{list.note}</p> : null}
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <Closing
        title="Belum menemukan jadwal yang pas?"
        text="Ceritakan rencana keluarga Anda. Admin bantu carikan tanggal, maskapai, dan tipe kamar yang sesuai."
        primary={<WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin dicarikan jadwal umroh">Konsultasi via WhatsApp</WaLink>}
        secondary={<a className="btn btn-ghost" href={`${getDashboardBaseUrl()}/daftar-paket`}>Isi form pendaftaran</a>}
      />
    </>
  );
}

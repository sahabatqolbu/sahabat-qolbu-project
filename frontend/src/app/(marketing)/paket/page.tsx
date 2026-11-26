import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PackageExplorer from "@/components/sq/PackageExplorer";
import { WaLink } from "@/components/sq/chrome";
import { IconCalendar, IconCheck } from "@/components/sq/icons";
import { Closing, PageHead, rupiah, titleCase, typeLabel, viewPackage } from "@/components/sq/ui";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { getMarketingPackages, getPublicPackageScheduleLists } from "@/lib/public-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Paket Umroh Sahabat Qolbu",
  description:
    "Jadwal dan harga paket umroh Sahabat Qolbu: full service, konsorsium, dan umroh Ramadhan. Bandingkan harga kamar Quad, Triple, dan Double.",
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
  const views = packages.map(viewPackage);
  const open = views.filter((v) => v.open).sort((a, b) => (a.pkg.departureDate || "").localeCompare(b.pkg.departureDate || ""));
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
        lead="Pilih jadwal keberangkatan, bandingkan harga per tipe kamar, lalu booking langsung lewat WhatsApp atau form pendaftaran."
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
        <PackageExplorer
          mode="full"
          packages={packages}
          askTitle="Butuh jadwal lain?"
          askText="Admin bisa bantu carikan tanggal, maskapai, dan tipe kamar yang sesuai, termasuk umroh plus Turki, Dubai, dan Mesir."
        />
      </Suspense>

      {open.length ? (
        <section className="sec sandband" id="bandingkan">
          <div className="wrap">
            <div className="head">
              <div>
                <h2 className="h2">Bandingkan harga per tipe kamar</h2>
                <p className="lead">Harga per orang. Semakin sedikit penghuni kamar, semakin tinggi harganya.</p>
              </div>
            </div>
            <div className="scroll" style={{ marginTop: 32, background: "#fff" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Paket</th>
                    <th scope="col">Berangkat</th>
                    <th scope="col">Maskapai</th>
                    <th scope="col" className="n">Quad (ber-4)</th>
                    <th scope="col" className="n">Triple (ber-3)</th>
                    <th scope="col" className="n">Double (ber-2)</th>
                    <th scope="col" className="n">Sisa seat</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map((v) => (
                    <tr key={v.pkg.id}>
                      <td>
                        <Link href={v.href}>{titleCase(v.pkg.name)}</Link>
                        <br />
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>{v.days} hari, {typeLabel(v.pkg)}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{v.date}</td>
                      <td>{v.pkg.airline.name}</td>
                      <td className="n">
                        <b>{v.quad ? rupiah(v.quad) : "-"}</b>
                        {v.oldPrice ? <><br /><s style={{ fontSize: 13, color: "var(--muted)" }}>{rupiah(v.oldPrice)}</s></> : null}
                      </td>
                      <td className="n">{v.triple ? rupiah(v.triple) : "-"}</td>
                      <td className="n">{v.double ? rupiah(v.double) : "-"}</td>
                      <td className="n">{v.seats} / {v.pkg.totalSeats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 14 }}>
              Harga dan ketersediaan seat dapat berubah. Konfirmasi ke admin sebelum melakukan pembayaran.
            </p>
          </div>
        </section>
      ) : null}

      {activeLists.map((list) => (
        <section className="sec" key={list.id}>
          <div className="wrap">
            <h2 className="h2">{titleCase(list.name)}</h2>
            {list.subtitle ? <p className="lead">{list.subtitle}</p> : null}
            <div className="scroll" style={{ marginTop: 28 }}>
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
                          <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin cek seat ${list.name} tanggal ${item.departureDate}`}>
                            Cek seat
                          </WaLink>
                        ) : (
                          scheduleStatus[item.effectiveStatus] || item.effectiveStatus
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.note ? <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 14 }}>{list.note}</p> : null}
          </div>
        </section>
      ))}

      <section className="sec">
        <div className="wrap">
          <h2 className="h2">Mengenal jenis paket kami</h2>
          <p className="lead">Setiap jenis punya cara pengaturan yang berbeda. Admin bisa bantu memilih yang paling cocok untuk keluarga Anda.</p>
          <div className="grid3" style={{ marginTop: 36 }}>
            <div className="panel"><h3>Full Service</h3><p className="txt">Tiket, hotel, visa, transportasi, makan, manasik, dan pendampingan diurus lengkap oleh Sahabat Qolbu. Cocok untuk keluarga dan jamaah lansia.</p></div>
            <div className="panel"><h3>Konsorsium</h3><p className="txt">Berangkat bersama rombongan travel anggota asosiasi Mutiara Haji Indonesia, dengan pembimbing dan program ibadah yang sama.</p></div>
            <div className="panel"><h3>Umroh Ramadhan</h3><p className="txt">Jadwal di bulan Ramadhan: awal, pertengahan, sampai i&apos;tikaf 10 malam terakhir dan Lebaran di Makkah.</p></div>
          </div>
        </div>
      </section>

      <Closing
        title="Belum menemukan jadwal yang pas?"
        text="Ceritakan rencana keluarga Anda. Admin bantu carikan tanggal, maskapai, dan tipe kamar yang sesuai."
        primary={<WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin dicarikan jadwal umroh">Konsultasi via WhatsApp</WaLink>}
        secondary={<a className="btn btn-ghost" href={`${getDashboardBaseUrl()}/daftar-paket`}>Isi form pendaftaran</a>}
      />
    </>
  );
}

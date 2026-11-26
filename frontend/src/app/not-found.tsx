import Link from "next/link";
import { Poppins } from "next/font/google";
import { SiteFooter, SiteHeader, WaLink } from "@/components/sq/chrome";
import "@/components/sq/sq.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

export default function NotFoundPage() {
  return (
    <div className={`sq ${poppins.variable}`}>
      <SiteHeader />
      <main className="lost">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sq/hero-haram-desktop.webp" alt="" />
        <div className="shade" />
        <div className="wrap">
          <div className="code" aria-hidden="true">404</div>
          <h1>Halaman yang Anda cari tidak ditemukan</h1>
          <p>Mungkin paketnya sudah ditutup atau tautannya berubah. Coba salah satu halaman di bawah, atau tanyakan ke admin.</p>
          <div className="cta" style={{ justifyContent: "flex-start" }}>
            <Link className="btn btn-gold" href="/paket">Lihat paket yang tersedia</Link>
            <WaLink className="btn btn-ghost" message="Assalamualaikum, saya tidak menemukan halaman yang saya cari di website">Tanya admin</WaLink>
          </div>
          <nav className="quick" aria-label="Halaman populer">
            <Link href="/paket?tipe=ramadhan"><b>Umroh Ramadhan</b><small>Jadwal di bulan Ramadhan</small></Link>
            <Link href="/faq"><b>Pertanyaan umum</b><small>Paspor, vaksin, dan pembayaran</small></Link>
            <Link href="/artikel"><b>Artikel panduan</b><small>Tuntunan ibadah dan ulasan hotel</small></Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

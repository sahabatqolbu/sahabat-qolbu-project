"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useBranding } from "@/components/providers/BrandingProvider";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import { IconMenu, IconShield, IconWa } from "./icons";

const DEFAULT_MESSAGE =
  "Assalamualaikum, saya ingin konsultasi paket umroh Sahabat Qolbu";

const SOURCE_TAG = "Lihat dari web sahabatqolbu.com";

/** Semua pesan WhatsApp dari website diberi penanda sumber supaya admin tahu asal lead. */
export const withSource = (message?: string) => {
  const text = (message || DEFAULT_MESSAGE).trim();
  return text.includes(SOURCE_TAG) ? text : `${text}\n\n(${SOURCE_TAG})`;
};

export const useWaHref = (message?: string) => {
  const { whatsappNumber } = useBranding();
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(withSource(message))}`;
};

/** Link WhatsApp yang mengikuti nomor perusahaan, atau nomor agen bila ada ?agent=. */
export function WaLink({
  message,
  className,
  children,
  ariaLabel,
}: {
  message?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const href = useWaHref(message);
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
      {children}
    </a>
  );
}

const pages = [
  { href: "/", label: "Beranda" },
  { href: "/paket", label: "Paket Umroh" },
  { href: "/tentang-kami", label: "Tentang Kami" },
  { href: "/artikel", label: "Artikel" },
  { href: "/faq", label: "FAQ" },
];

const isCurrent = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

function Brand() {
  const branding = useBranding();
  return (
    <Link className="brand" href={branding.logoLink || "/"} aria-label={`${branding.companyName}, ke beranda`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sq/brand-icon.png" alt="" width={42} height={42} />
      <span>
        <b>
          {branding.isAgentActive ? "MITRA SAHABAT " : "SAHABAT "}
          <span>QOLBU</span>
        </b>
        <small>TOUR &amp; TRAVEL</small>
      </span>
    </Link>
  );
}

const noSubscribe = () => () => {};

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const branding = useBranding();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  // Cookie sq_account dipasang dashboard setelah login; belum punya akun = ajak daftar.
  const hasAccount = useSyncExternalStore(
    noSubscribe,
    () => /(?:^|;\s*)sq_account=1/.test(document.cookie),
    () => false,
  );
  const waHref = useWaHref();
  const account = hasAccount
    ? { href: `${getDashboardBaseUrl()}/login`, label: "Masuk", sheet: "Masuk ke akun saya" }
    : { href: `${getDashboardBaseUrl()}/login?tab=register`, label: "Daftar", sheet: "Daftar akun jamaah" };
  const instagramHandle = branding.instagram
    ? "@" + branding.instagram.replace(/\/+$/, "").split("/").pop()
    : "";

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>
            <IconShield />
            PPIU Berizin Resmi No. {branding.ppiu}
          </span>
          <span className="hide">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp {branding.phone}
            </a>
            {instagramHandle ? (
              <>
                {" "}&nbsp;|&nbsp;{" "}
                <a href={branding.instagram} target="_blank" rel="noopener noreferrer">
                  {instagramHandle}
                </a>
              </>
            ) : null}
          </span>
        </div>
      </div>
      <header className={`nav${solid || open ? " solid" : ""}`}>
        <div className="wrap">
          <Brand />
          <nav className="links" aria-label="Menu utama">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                aria-current={isCurrent(pathname, page.href) ? "page" : undefined}
              >
                {page.label}
              </Link>
            ))}
            <a className="btn btn-gold" href={account.href}>
              {account.label}
            </a>
          </nav>
          <button
            className="burger"
            type="button"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="sq-sheet"
            onClick={() => setOpen((value) => !value)}
          >
            <IconMenu width={22} height={22} />
          </button>
        </div>
        {open ? (
          <nav className="sheet" id="sq-sheet" aria-label="Menu ponsel">
            {pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                aria-current={isCurrent(pathname, page.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {page.label}
              </Link>
            ))}
            <a href={account.href}>{account.sheet}</a>
            <a className="btn btn-gold" href={waHref} target="_blank" rel="noopener noreferrer">
              Konsultasi via WhatsApp
            </a>
          </nav>
        ) : null}
      </header>
    </>
  );
}

export function SiteFooter() {
  const branding = useBranding();
  const waHref = useWaHref();
  return (
    <>
      <footer>
        <div className="wrap fgrid">
          <div>
            <Brand />
            <p style={{ marginTop: 16, maxWidth: 380 }}>
              PT. Sahabat Qolbu Cahaya Baitullah, travel umroh sunnah berizin resmi PPIU No. {branding.ppiu}.
            </p>
            <p style={{ marginTop: 10, maxWidth: 380 }}>{branding.address}</p>
          </div>
          <div>
            <h4>Paket</h4>
            <ul>
              <li><Link href="/paket">Semua paket</Link></li>
              <li><Link href="/paket?tipe=ramadhan">Umroh Ramadhan</Link></li>
              <li><a href={`${getDashboardBaseUrl()}/daftar-paket`}>Daftar paket</a></li>
            </ul>
          </div>
          <div>
            <h4>Informasi</h4>
            <ul>
              <li><Link href="/tentang-kami">Tentang kami</Link></li>
              <li><Link href="/artikel">Artikel</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/kebijakan-privasi">Kebijakan privasi</Link></li>
            </ul>
          </div>
          <div>
            <h4>Kontak</h4>
            <ul>
              <li><a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp {branding.phone}</a></li>
              {branding.email ? <li><a href={`mailto:${branding.email}`}>{branding.email}</a></li> : null}
              {branding.instagram ? <li><a href={branding.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li> : null}
              {branding.tiktok ? <li><a href={branding.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li> : null}
              {branding.facebook ? <li><a href={branding.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li> : null}
            </ul>
          </div>
        </div>
        <div className="wrap legal">
          <span>© {new Date().getFullYear()} PT. Sahabat Qolbu Cahaya Baitullah</span>
          <span>Berangkat Umroh, Pulang Berhijrah</span>
        </div>
      </footer>
      <a className="float" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Chat admin di WhatsApp">
        <IconWa className="" width={28} height={28} />
      </a>
    </>
  );
}

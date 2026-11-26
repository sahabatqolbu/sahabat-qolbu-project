import Link from "next/link";
import { Suspense } from "react";
import HeroSlider, { type HeroItem } from "@/components/sq/HeroSlider";
import PackageExplorer from "@/components/sq/PackageExplorer";
import { WaLink } from "@/components/sq/chrome";
import { IconBook, IconCheck, IconHeart, IconPlane, IconReceipt, IconWa } from "@/components/sq/icons";
import { Closing, titleCase } from "@/components/sq/ui";
import { getDashboardBaseUrl } from "@/lib/dashboard-url";
import {
  getActiveBanks,
  getMarketingPackages,
  getPublicFaqs,
  getPublicGallery,
  getPublicHeroSlides,
  type PublicHeroSlide,
} from "@/lib/public-api";
import { getHomeContent, photo } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
/** 48900000 menjadi "Rp 48,9 juta". */
const juta = (value: number) =>
  `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} juta`;
const day = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const slugify = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const BACKGROUNDS: Record<string, string> = {
  HARAM: "/sq/hero-haram-desktop.webp",
  CLOCK: "/sq/clock-tower.webp",
};

const toHeroItem = (slide: PublicHeroSlide, index: number): HeroItem => {
  const pkg = slide.package;
  const name = slide.headline || (pkg ? titleCase(pkg.name) : slide.title || "Promo umroh");
  if (slide.kind === "BANNER" && slide.imageUrl) {
    return {
      kind: "banner",
      label: slide.title || slide.headline || `Banner ${index + 1}`,
      image: slide.imageUrl,
      alt: slide.altText || slide.title || "Banner promo Sahabat Qolbu",
      ctaLabel: slide.ctaLabel || "",
      ctaUrl: slide.ctaUrl || "",
    };
  }
  const current = num(pkg?.priceQuad) || num(pkg?.discountPrice) || num(pkg?.price);
  const original = num(pkg?.price);
  const facts: Extract<HeroItem, { kind: "promo" }>["facts"] = [];
  if (pkg?.departureDate) facts.push({ icon: "date", text: day(pkg.departureDate) });
  if (pkg?.duration) facts.push({ icon: "days", text: `${pkg.duration} hari` });
  if (pkg?.airline) facts.push({ icon: "plane", text: pkg.airline });
  const flyer = slide.imageUrl || pkg?.image || "";
  return {
    kind: "promo",
    label: slide.title || name,
    tag: slide.tag || "Promo spesial",
    headline: name,
    facts,
    price: slide.priceLabel || (current ? juta(current) : ""),
    oldPrice: slide.oldPriceLabel || (original > current && current ? juta(original) : ""),
    priceNote: slide.priceLabel || current ? "/ orang, kamar berempat" : "",
    note: slide.note || (pkg?.remainingSeats ? `Sisa ${pkg.remainingSeats} seat.` : ""),
    flyer,
    background: slide.background === "FLYER" && flyer ? flyer : BACKGROUNDS[slide.background || "HARAM"] || BACKGROUNDS.HARAM,
    blurBackground: slide.background === "FLYER" && Boolean(flyer),
    ctaLabel: slide.ctaLabel || "Booking sekarang",
    ctaUrl: slide.ctaUrl || "",
    waMessage: `Assalamualaikum, saya ingin booking ${name}`,
    detailHref: pkg ? `/paket/${slugify(pkg.name)}` : "/paket",
    alt: slide.altText || `Flyer ${name}`,
  };
};

export default async function HomePage() {
  const [content, packages, slides, gallery, faqs, banks] = await Promise.all([
    getHomeContent(),
    getMarketingPackages(),
    getPublicHeroSlides(),
    getPublicGallery(),
    getPublicFaqs(),
    getActiveBanks(),
  ]);

  const heroItems: HeroItem[] = [
    ...(content.hero.show
      ? [
          {
            kind: "welcome" as const,
            label: "Sahabat Qolbu",
            headline: content.hero.headline,
            license: content.hero.license,
            points: content.hero.points,
            primaryLabel: content.hero.primaryLabel,
            secondaryLabel: content.hero.secondaryLabel,
            background: photo(content.hero.backgroundUrl) || "/sq/hero-haram-desktop.webp",
          },
        ]
      : []),
    ...slides.map(toHeroItem),
  ];
  const whyPhoto = photo(content.why.photoUrl) || gallery[0]?.imageUrl || "";
  const half = Math.ceil(gallery.length / 2);
  const rails = [gallery.slice(0, half), gallery.slice(half)].filter((rail) => rail.length);
  const perkIcons = [IconBook, IconHeart, IconPlane, IconReceipt];

  return (
    <>
      <HeroSlider items={heroItems} />

      <Suspense fallback={null}>
        <PackageExplorer
          mode="home"
          packages={packages}
          heading={content.packages.heading}
          lead={content.packages.lead}
          between={
      <section className="trust" aria-label="Legalitas">
            <div className="wrap">
              <div className="logo-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sq/kemenhaj.png" alt="Logo Kementerian Haji dan Umrah RI" width={64} height={64} />
                <span><b>Diawasi Kemenhaj RI</b>PPIU 12112100038690008</span>
              </div>
              <div className="logo-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sq/mutiara-haji.png" alt="Logo Mutiara Haji Indonesia" width={64} height={64} />
                <span><b>Anggota Mutiara Haji</b>Asosiasi travel umroh sunnah</span>
              </div>
              <div className="chips">
                {content.trust.chips.map((chip) => (
                  <span key={chip}><IconCheck />{chip}</span>
                ))}
              </div>
            </div>
          </section>
              }
        />
      </Suspense>


      <section className="sec why" id="keunggulan">
        <div className="wrap">
          <div>
            <h2 className="h2">{content.why.heading}</h2>
            <p className="lead">{content.why.lead}</p>
            {whyPhoto ? (
              <figure className="photo" style={{ margin: "30px 0 0" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={whyPhoto} alt={content.why.photoCaption} loading="lazy" />
                <figcaption>{content.why.photoCaption}</figcaption>
              </figure>
            ) : null}
          </div>
          <div className="perks">
            {content.why.items.slice(0, 4).map((item, i) => {
              const Icon = perkIcons[i % perkIcons.length];
              return (
                <div className="perk" key={item.title}>
                  <i><Icon width={24} height={24} className="" /></i>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec" id="cara-daftar">
        <div className="wrap">
          <div className="head">
            <div>
              <h2 className="h2">{content.steps.heading}</h2>
              <p className="lead">{content.steps.lead}</p>
            </div>
            <a className="btn btn-gold" href={`${getDashboardBaseUrl()}/daftar-paket`}>{content.steps.ctaLabel}</a>
          </div>
          <ol className="steps">
            {content.steps.items.map((step, i) => (
              <li className="step" key={step.title}>
                <b>{i + 1}</b>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {rails.length ? (
        <section className="sec gallery" id="galeri">
          <div className="wrap">
            <h2 className="h2">{content.gallery.heading}</h2>
            <p className="lead">{content.gallery.lead}</p>
          </div>
          {rails.map((rail, r) => (
            <div className={`rail${r ? " rev" : ""}`} key={r} aria-hidden="true">
              {[...rail, ...rail].map((item, i) => (
                <figure className="shot" style={{ margin: 0 }} key={`${item.id}-${i}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" loading="lazy" />
                  {item.title ? <span>{titleCase(item.title)}</span> : null}
                </figure>
              ))}
            </div>
          ))}
        </section>
      ) : null}

      {faqs.length ? (
        <section className="sec faq" id="faq">
          <div className="wrap">
            <div>
              <h2 className="h2">{content.faq.heading}</h2>
              <p className="lead">{content.faq.lead}</p>
              <div className="help">
                <h3>Rekening resmi pembayaran</h3>
                <p>Pembayaran hanya melalui rekening atas nama PT. Sahabat Qolbu Cahaya Baitullah.</p>
                {banks.length ? (
                  <dl>
                    {banks.map((bank) => (
                      <div key={bank.id}><dt>{bank.bankName}</dt><dd>{bank.accountNumber}</dd></div>
                    ))}
                  </dl>
                ) : null}
                <WaLink className="btn btn-gold" message="Assalamualaikum, saya punya pertanyaan tentang umroh">
                  <IconWa />Tanya admin di WhatsApp
                </WaLink>
              </div>
            </div>
            <div>
              {faqs.slice(0, 6).map((faq, i) => (
                <details key={faq.id} name="faq-beranda" open={i === 0}>
                  <summary>
                    {faq.question}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  </summary>
                  <p className="ans">{faq.answer}</p>
                </details>
              ))}
              <Link className="btn btn-line" href="/faq" style={{ marginTop: 8 }}>Lihat semua pertanyaan</Link>
            </div>
          </div>
        </section>
      ) : null}

      <Closing
        image={photo(content.closing.backgroundUrl) || "/sq/clock-tower.webp"}
        title={content.closing.heading}
        text={content.closing.text}
        primary={<a className="btn btn-gold" href={`${getDashboardBaseUrl()}/daftar-paket`}>Daftar sekarang</a>}
        secondary={<WaLink className="btn btn-ghost">Konsultasi via WhatsApp</WaLink>}
      />
    </>
  );
}

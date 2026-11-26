import type { Metadata } from "next";
import Link from "next/link";
import { WaLink } from "@/components/sq/chrome";
import {
  IconCheck,
  IconElder,
  IconHeart,
  IconHotel,
  IconMail,
  IconMoon,
  IconPhone,
  IconPin,
  IconPlane,
  IconPlay,
  IconPulse,
  IconShield,
  IconSteth,
  IconSun,
  IconWalk,
} from "@/components/sq/icons";
import { Arc } from "@/components/sq/ui";
import { getActiveBanks, getPublicCompanyProfile, getPublicGallery } from "@/lib/public-api";
import { getAboutContent, photo, type PhotoItem } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Tentang SQ Travel – Umroh Sunnah & Tim Medis Pribadi",
  description:
    "Kenali Sahabat Qolbu Tour & Travel, travel umroh sunnah berizin resmi, anggota Mutiara Haji dengan pendampingan Tim Medis Pribadi untuk jamaah.",
  alternates: { canonical: "/tentang-kami" },
};

const RISK_ICONS = [IconSun, IconWalk, IconPlane, IconMoon, IconPulse, IconElder];
const SERVICE_ICONS = [IconSteth, IconPlane, IconHotel];

function Real({ src, caption, className = "", style }: { src: string; caption?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <figure className={`real ${className}`} style={{ margin: 0, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption || ""} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

const withPhotos = (items: PhotoItem[]) =>
  items.map((item) => ({ ...item, src: photo(item.photoUrl) })).filter((item) => item.src);

export default async function AboutPage() {
  const [c, company, banks, gallery] = await Promise.all([
    getAboutContent(),
    getPublicCompanyProfile(),
    getActiveBanks(),
    getPublicGallery(),
  ]);
  const ppiu = company?.ppiu || "12112100038690008";
  const address = [company?.address, company?.city, company?.province, company?.postalCode].filter(Boolean).join(", ");
  const galleryAt = (i: number) => gallery[i]?.imageUrl || "";

  const heroPhoto = photo(c.hero.photoUrl) || galleryAt(3) || galleryAt(0);
  const whoPhoto = photo(c.who.photoUrl) || galleryAt(0);
  const medicalPhoto = photo(c.medical.photoUrl);
  const leaderPhoto = photo(c.network.leaderPhotoUrl);
  const proofs = withPhotos(c.network.proofs);
  const wall = withPhotos(c.proof.items);
  const fallbackWall = wall.length ? wall : gallery.slice(0, 6).map((g) => ({ label: g.title || "Jamaah Sahabat Qolbu", photoUrl: g.imageUrl, src: g.imageUrl }));
  const officePhotos = withPhotos(c.office.photos);
  const mapsHref = c.office.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Sahabat Qolbu Tour & Travel")}`;
  const youtube = c.proof.videoLink.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1];

  return (
    <div className="about">
      {/* 01 Hero */}
      <section className="ahero">
        <div className="wrap">
          <div>
            <ol className="crumb"><li><Link href="/">Beranda</Link></li><li>Tentang Kami</li></ol>
            <span className="kick">{c.hero.kicker}</span>
            <h1>{c.hero.headline}</h1>
            <p>{c.hero.text}</p>
            <div className="cta" style={{ justifyContent: "flex-start" }}>
              <WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin konsultasi perjalanan umroh bersama Sahabat Qolbu">{c.hero.ctaLabel}</WaLink>
              <a className="btn btn-ghost" href="#medical-care">Kenali {c.medical.title}</a>
            </div>
            <div className="trustrow">
              {c.hero.trustChips.map((chip, i) => (
                <span key={chip}>{i === 0 ? <IconShield /> : i === 2 ? <IconHeart /> : <IconCheck />}{chip}</span>
              ))}
            </div>
          </div>
          {heroPhoto ? (
            <div className="hero-media">
              <Real src={heroPhoto} caption={c.hero.photoCaption} />
              <div className="seal">
                <i><IconSteth /></i>
                <span><b>{c.medical.title}</b><small>Tim medis pribadi mendampingi jamaah</small></span>
              </div>
            </div>
          ) : null}
        </div>
        <Arc stroke="#D4AF37" />
      </section>

      {/* Pilar */}
      <section className="sec" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="pillars">
            {c.pillars.map((p) => (
              <div key={p.title}><i /><b>{p.title}</b><p>{p.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 Mengenal */}
      <section className="sec">
        <div className="wrap who">
          {whoPhoto ? <Real src={whoPhoto} caption={c.who.photoCaption} style={{ aspectRatio: "4/3" }} /> : null}
          <div>
            <span className="eyebrow">{c.who.eyebrow}</span>
            <h2 className="ah2">{c.who.heading}</h2>
            {c.who.paragraphs.map((p) => <p className="body-l" key={p.slice(0, 40)}>{p}</p>)}
            <p className="quote">{c.who.quote}</p>
            <p className="body-l">{c.who.closing}</p>
          </div>
        </div>
      </section>

      {/* 03 Edukasi kesehatan */}
      <section className="sec cream">
        <div className="wrap">
          <div className="edu">
            <div>
              <span className="eyebrow">{c.health.eyebrow}</span>
              <h2 className="ah2">{c.health.heading}</h2>
              <p className="body-l">{c.health.text}</p>
            </div>
            <div className="callout">
              {c.health.callout.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </div>
          </div>
          <div className="risks">
            {c.health.risks.map((risk, i) => {
              const Icon = RISK_ICONS[i % RISK_ICONS.length];
              return <div className="risk" key={risk}><i><Icon /></i><b>{risk}</b></div>;
            })}
          </div>
        </div>
      </section>

      {/* 04 SQ Private Medical Care */}
      <section className="sec dark" id="medical-care">
        <div className={`wrap${medicalPhoto ? " sig" : ""}`}>
          {medicalPhoto ? <Real src={medicalPhoto} caption="Tim Medis Pribadi SQ" style={{ aspectRatio: "4/3" }} /> : null}
          <div style={medicalPhoto ? undefined : { maxWidth: 860 }}>
            <span className="badge-lg"><IconHeart />{c.medical.badge}</span>
            <h2 className="sigtitle">
              {/medical care$/i.test(c.medical.title) ? (
                <>{c.medical.title.replace(/\s*medical care$/i, "")} <span>Medical Care</span></>
              ) : (
                c.medical.title
              )}
            </h2>
            <p className="sigsub">{c.medical.subtitle}</p>
            <p className="body-l">{c.medical.text}</p>
            <div className="svc" style={medicalPhoto ? undefined : { gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
              {c.medical.items.map((item, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                return (
                  <div key={item.title}>
                    <i><Icon /></i>
                    <span><b>{item.title}</b><p>{item.text}</p></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 05 Perjalanan pelayanan */}
      <section className="sec">
        <div className="wrap">
          <span className="eyebrow">{c.journey.eyebrow}</span>
          <h2 className="ah2" style={{ maxWidth: 820 }}>{c.journey.heading}</h2>
          <ol className="journey">
            {c.journey.stages.map((stage, i) => {
              const src = photo(stage.photoUrl);
              return (
                <li key={stage.title}>
                  {src ? (
                    <Real src={src} />
                  ) : (
                    <div className="jicon" aria-hidden="true"><b>{String(i + 1).padStart(2, "0")}</b></div>
                  )}
                  <div className="jb">
                    <span className="st">{stage.label}</span>
                    <h3>{stage.title}</h3>
                    <p>{stage.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="amanah">{c.journey.closing}</p>
        </div>
      </section>

      {/* 06 Mutiara Haji */}
      <section className="sec cream">
        <div className="wrap">
          <span className="eyebrow">{c.network.eyebrow}</span>
          <h2 className="ah2">{c.network.heading}</h2>
          <p className="body-l">{c.network.text}</p>
          <div className="net">
            <div>
              <div className="leader" style={leaderPhoto ? undefined : { gridTemplateColumns: "1fr" }}>
                {leaderPhoto ? <Real src={leaderPhoto} style={{ aspectRatio: "4/5" }} /> : null}
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="mh" src="/sq/mutiara-haji.png" alt="Logo Mutiara Haji Indonesia" width={72} height={72} />
                  <b>{c.network.leaderName}</b>
                  <small>{c.network.leaderRole}</small>
                </div>
              </div>
              {c.network.paragraphs.map((p) => <p className="body-l" key={p.slice(0, 40)}>{p}</p>)}
            </div>
            <div>
              <div className="roles">
                {c.network.roles.map((r) => (
                  <div className="role" key={r.title}><b>{r.title}</b><p>{r.text}</p></div>
                ))}
              </div>
              {proofs.length ? (
                <div className="proofs">
                  {proofs.map((p) => <Real key={p.src} src={p.src} caption={p.label} style={{ aspectRatio: "4/3" }} />)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 07 Legalitas */}
      <section className="sec">
        <div className="wrap">
          <span className="eyebrow">{c.legal.eyebrow}</span>
          <h2 className="ah2" style={{ maxWidth: 820 }}>{c.legal.heading}</h2>
          <p className="body-l">{c.legal.text}</p>
          <div className="legalbox">
            <div className="license">
              <small>Penyelenggara Perjalanan Ibadah Umrah</small>
              <b>PT. Sahabat Qolbu Cahaya Baitullah</b>
              <div className="no">PPIU {ppiu}</div>
              {banks.length ? (
                <p className="body-l" style={{ fontSize: 15 }}>
                  Pembayaran hanya melalui rekening resmi atas nama perusahaan:{" "}
                  {banks.map((b) => `${b.bankName} ${b.accountNumber}`).join(" dan ")}.
                </p>
              ) : null}
            </div>
            <div className="logos">
              {/* eslint-disable @next/next/no-img-element */}
              <div><img src="/sq/kemenhaj.png" alt="" width={72} height={72} />Kementerian Haji dan Umrah RI</div>
              <div><img src="/sq/5pasti.png" alt="" width={72} height={72} />5 Pasti Umroh</div>
              <div><img src="/sq/mutiara-haji.png" alt="" width={72} height={72} />Mutiara Haji Indonesia</div>
              {/* eslint-enable @next/next/no-img-element */}
            </div>
          </div>
        </div>
      </section>

      {/* 08 Bukti nyata */}
      {fallbackWall.length || youtube ? (
        <section className="sec cream">
          <div className="wrap">
            <span className="eyebrow">{c.proof.eyebrow}</span>
            <h2 className="ah2" style={{ maxWidth: 820 }}>{c.proof.heading}</h2>
            <p className="body-l">{c.proof.text}</p>
            {fallbackWall.length ? (
              <div className="wall">
                {fallbackWall.slice(0, 9).map((item, i) => (
                  <Real key={`${item.src}-${i}`} src={item.src} caption={item.label} className={i === 0 && fallbackWall.length >= 5 ? "big" : ""} />
                ))}
              </div>
            ) : null}
            {youtube ? (
              <div className="vidbox">
                <a className="real" href={c.proof.videoLink} target="_blank" rel="noopener noreferrer" style={{ aspectRatio: "16/9", display: "block" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`} alt={c.proof.videoTitle} loading="lazy" />
                  <span className="vplay"><IconPlay className="" width={64} height={64} /></span>
                </a>
                <div>
                  <h3 style={{ fontSize: 24, color: "#fff" }}>{c.proof.videoTitle}</h3>
                  <p className="body-l">{c.proof.videoText}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 09 Kantor */}
      <section className="sec" id="kantor">
        <div className="wrap">
          <span className="eyebrow">{c.office.eyebrow}</span>
          <h2 className="ah2" style={{ maxWidth: 820 }}>{c.office.heading}</h2>
          <p className="body-l">{c.office.text}</p>
          <div className={officePhotos.length ? "office2" : ""} style={{ marginTop: 36 }}>
            {officePhotos.length ? (
              <div className="shots" style={officePhotos.length === 1 ? { gridTemplateColumns: "1fr" } : undefined}>
                {officePhotos.map((p) => <Real key={p.src} src={p.src} caption={p.label} style={{ minHeight: 320 }} />)}
              </div>
            ) : null}
            <div className="contact" style={officePhotos.length ? undefined : { maxWidth: 640 }}>
              <h3>Kantor Sahabat Qolbu Tour &amp; Travel</h3>
              <ul>
                {address ? <li><IconPin /><span>{address}</span></li> : null}
                {company?.whatsapp ? <li><IconPhone /><span>{company.whatsapp}</span></li> : null}
                {company?.email ? <li><IconMail /><span>{company.email}</span></li> : null}
              </ul>
              <div className="cta" style={{ justifyContent: "flex-start", marginTop: 20 }}>
                <a className="btn btn-navy" href={mapsHref} target="_blank" rel="noopener noreferrer">Petunjuk arah Google Maps</a>
                <WaLink className="btn btn-wa" message="Assalamualaikum, saya ingin berkunjung ke kantor Sahabat Qolbu">Atur jadwal kunjungan</WaLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 Closing */}
      <section className="aclose">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sq/hero-haram-desktop.webp" alt="" loading="lazy" />
        <div className="wrap">
          <span className="eyebrow">{c.closing.eyebrow}</span>
          <h2>{c.closing.heading}</h2>
          <p>{c.closing.text}</p>
          <span className="motto">{c.closing.motto}</span>
          <div className="cta">
            <WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin konsultasi umroh bersama SQ">Konsultasi umroh bersama SQ</WaLink>
            <Link className="btn btn-ghost" href="/paket">Lihat program umroh SQ</Link>
          </div>
          <small>{c.closing.note}</small>
          <div className="promise">
            {c.closing.promises.map((p) => (
              <div key={p.title}><b>{p.title}</b><p>{p.text}</p></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWaHref } from "./chrome";
import { IconCalendar, IconCheck, IconChevron, IconClock, IconPlane, IconWa } from "./icons";

export type HeroItem =
  | {
      kind: "welcome";
      label: string;
      headline: string;
      license: string;
      points: string[];
      primaryLabel: string;
      secondaryLabel: string;
      background: string;
    }
  | {
      kind: "promo";
      label: string;
      tag: string;
      headline: string;
      facts: { icon: "date" | "days" | "plane"; text: string }[];
      price: string;
      oldPrice: string;
      priceNote: string;
      note: string;
      flyer: string;
      background: string;
      blurBackground: boolean;
      ctaLabel: string;
      ctaUrl: string;
      waMessage: string;
      detailHref: string;
      alt: string;
    }
  | {
      kind: "banner";
      label: string;
      image: string;
      alt: string;
      ctaLabel: string;
      ctaUrl: string;
    };

const DURATION = 7000;
const factIcon = { date: IconCalendar, days: IconClock, plane: IconPlane };

function Welcome({ item, active }: { item: Extract<HeroItem, { kind: "welcome" }>; active: boolean }) {
  const waHref = useWaHref("Assalamualaikum, saya ingin konsultasi paket umroh Sahabat Qolbu");
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="bg"
        src={item.background}
        srcSet={item.background.startsWith("/sq/") ? "/sq/hero-haram-mobile.webp 800w, /sq/hero-haram-desktop.webp 1672w" : undefined}
        sizes="100vw"
        alt=""
        fetchPriority={active ? "high" : "auto"}
      />
      <div className="scrim" />
      <div className="wrap inner">
        <div className="welcome">
          <div className="mark rise">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sq/brand-icon.png" alt="" width={62} height={62} />
            <span>
              <b>Sahabat Qolbu</b>
              <small>TOUR &amp; TRAVEL</small>
            </span>
          </div>
          {active ? <h1 className="rise">{item.headline}</h1> : <h2 className="rise h1like">{item.headline}</h2>}
          <p className="lic rise">{item.license}</p>
          <div className="points rise">
            {item.points.map((point) => (
              <span key={point}>
                <IconCheck />
                {point}
              </span>
            ))}
          </div>
          <div className="cta rise">
            <a className="btn btn-gold" href="#paket">{item.primaryLabel}</a>
            <a className="btn btn-ghost" href={waHref} target="_blank" rel="noopener noreferrer">
              {item.secondaryLabel}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function Promo({ item }: { item: Extract<HeroItem, { kind: "promo" }> }) {
  const waHref = useWaHref(item.waMessage);
  const ctaHref = item.ctaUrl || waHref;
  const external = /^https?:/i.test(ctaHref);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`bg${item.blurBackground ? " blurbg" : ""}`} src={item.background} alt="" loading="lazy" />
      <div className="scrim side" />
      <div className="wrap inner">
        <div className="promo">
          <div>
            <span className="tag rise">{item.tag}</span>
            <h2 className="rise">{item.headline}</h2>
            {item.facts.length ? (
              <div className="facts rise">
                {item.facts.map((fact) => {
                  const Icon = factIcon[fact.icon];
                  return (
                    <span key={fact.text}>
                      <Icon />
                      {fact.text}
                    </span>
                  );
                })}
              </div>
            ) : null}
            {item.price ? (
              <div className="price rise">
                {item.oldPrice ? <s>{item.oldPrice}</s> : null}
                <b>{item.price}</b>
                {item.priceNote ? <em>{item.priceNote}</em> : null}
              </div>
            ) : null}
            {item.note ? <p className="note rise">{item.note}</p> : null}
            <div className="cta rise">
              <a
                className="btn btn-gold"
                href={ctaHref}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {item.ctaUrl ? null : <IconWa />}
                {item.ctaLabel}
              </a>
              <Link className="btn btn-ghost" href={item.detailHref}>
                Lihat detail paket
              </Link>
            </div>
          </div>
          {item.flyer ? (
            <Link className="flyer" href={item.detailHref} aria-label={`Flyer ${item.headline}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.flyer} alt={item.alt} loading="lazy" />
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Banner({ item }: { item: Extract<HeroItem, { kind: "banner" }> }) {
  const external = /^https?:/i.test(item.ctaUrl);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bg blurbg" src={item.image} alt="" loading="lazy" />
      <div className="scrim" />
      <div className="wrap inner">
        <div className="bannerbox rise">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.alt} loading="lazy" />
          {item.ctaUrl ? (
            <a
              className="btn btn-gold"
              href={item.ctaUrl}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.ctaLabel || "Lihat selengkapnya"}
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function HeroSlider({ items }: { items: HeroItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const show = useCallback(
    (index: number) => {
      setCurrent((index + items.length) % items.length);
      setTick((t) => t + 1);
    },
    [items.length],
  );

  useEffect(() => {
    if (items.length < 2 || paused || reduce.current) return;
    const timer = window.setTimeout(() => show(current + 1), DURATION);
    return () => window.clearTimeout(timer);
  }, [current, paused, show, items.length, tick]);

  if (!items.length) return null;

  return (
    <section
      className={`hero${paused ? " paused" : ""}`}
      id="beranda"
      aria-roledescription="carousel"
      aria-label="Sorotan dan promo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ ["--dur" as string]: `${DURATION}ms` }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.kind}-${index}`}
          className={`slide${index === current ? " on" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} dari ${items.length}: ${item.label}`}
          aria-hidden={index !== current}
        >
          {item.kind === "welcome" ? (
            <Welcome item={item} active={index === 0} />
          ) : item.kind === "promo" ? (
            <Promo item={item} />
          ) : (
            <Banner item={item} />
          )}
        </div>
      ))}
      {items.length > 1 ? (
        <div className="hnav">
          <div className="hnav-in">
            <button type="button" className="harrow" aria-label="Slide sebelumnya" onClick={() => show(current - 1)}>
              <IconChevron dir="left" />
            </button>
            <div className="hsegs" role="tablist" aria-label="Pilih slide">
              {items.map((item, index) => (
                <button
                  key={`seg-${index}-${index === current ? tick : 0}`}
                  type="button"
                  role="tab"
                  className={`hseg${index === current ? " on" : ""}`}
                  aria-label={`Slide ${index + 1}: ${item.label}`}
                  aria-selected={index === current}
                  onClick={() => show(index)}
                >
                  <i />
                </button>
              ))}
            </div>
            <span className="hcount" aria-hidden="true">
              <b>{String(current + 1).padStart(2, "0")}</b>/{String(items.length).padStart(2, "0")}
            </span>
            <span className="hlabel" aria-live="polite">{items[current]?.label}</span>
            <button type="button" className="harrow" aria-label="Slide berikutnya" onClick={() => show(current + 1)}>
              <IconChevron dir="right" />
            </button>
          </div>
        </div>
      ) : null}
      <svg className="arc" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 56V20Q720 76 1440 20V56Z" fill="#fff" />
        <path d="M0 20Q720 76 1440 20" fill="none" stroke="#FFC107" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </section>
  );
}

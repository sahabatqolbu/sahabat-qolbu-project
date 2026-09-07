"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Plane,
  PlayCircle,
  Route,
  X,
} from "lucide-react";

export type PackageVendor = {
  key: string;
  label: string;
  kind: "hotel" | "airline";
  name: string;
  detailUrl?: string;
  imageUrl?: string;
  gallery?: string[];
  description?: string;
  meta?: string;
  address?: string;
  mapUrl?: string;
  departureDate?: string;
  route?: string;
  facilities?: string[];
  videoUrls?: string[];
  articles?: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
  }[];
};

const getEmbedUrl = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return `https://www.youtube-nocookie.com/embed/${url.pathname.split("/").filter(Boolean)[0]}`;
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const id =
        url.searchParams.get("v") ||
        url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      const match = url.pathname.match(/\/(?:p|reel|tv)\/([^/?]+)/);
      return match ? `https://www.instagram.com/p/${match[1]}/embed` : null;
    }
  } catch {
    return null;
  }
  return null;
};

const getGoogleMapsEmbedUrl = (
  mapUrl: string | undefined,
  address: string | undefined,
  name: string,
) => {
  if (!mapUrl) return null;

  let query = address || name;
  try {
    const url = new URL(mapUrl);
    const host = url.hostname.replace(/^www\./, "");
    const isGoogleMapsHost =
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "google.com" ||
      host.endsWith(".google.com");
    if (!isGoogleMapsHost) return null;

    if (url.pathname.startsWith("/maps/embed")) return url.toString();
    query =
      url.searchParams.get("q") ||
      url.searchParams.get("query") ||
      decodeURIComponent(
        url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1] || "",
      ).replace(/\+/g, " ") ||
      query;
  } catch {
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
};

export default function VendorInfoDrawer({
  vendors,
}: {
  vendors: PackageVendor[];
}) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(vendors[0]?.key || "");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const active =
    vendors.find((vendor) => vendor.key === activeKey) || vendors[0];
  const activeImages = active
    ? (Array.from(
        new Set(
          [active.imageUrl, ...(active.gallery || [])].filter(Boolean),
        ),
      ) as string[])
    : [];
  const mapEmbedUrl = active
    ? getGoogleMapsEmbedUrl(active.mapUrl, active.address, active.name)
    : null;

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!vendors.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="vendor-info-floating group fixed bottom-5 left-4 z-40 inline-flex items-center gap-3 rounded-md border border-gold/60 bg-primary px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-primary/25 transition hover:bg-primary-700 sm:bottom-7 sm:left-7"
        aria-label="Buka informasi hotel dan maskapai paket"
      >
        <span className="vendor-info-floating-icon grid h-9 w-9 flex-none place-items-center rounded-sm bg-gold text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gold">
            Lihat fasilitas
          </span>
          <span className="mt-0.5 block">Info Hotel & Maskapai</span>
        </span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-gold" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Tutup informasi hotel dan maskapai"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-primary/65 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Informasi hotel dan maskapai"
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl md:inset-y-0 md:left-auto md:w-[520px] md:max-h-none md:rounded-none"
          >
            <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-gold">
                  Layanan perjalanan
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-primary">
                  Hotel & Maskapai
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 px-4 py-3">
              {vendors.map((vendor) => (
                <button
                  key={vendor.key}
                  type="button"
                  onClick={() => {
                    setActiveKey(vendor.key);
                    setActiveImageIndex(0);
                  }}
                  className={`whitespace-nowrap rounded-sm px-4 py-2 text-sm font-extrabold transition ${active?.key === vendor.key ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                >
                  {vendor.label}
                </button>
              ))}
            </div>

            {active ? (
              <div className="overflow-y-auto p-5 sm:p-6">
                {activeImages.length ? (
                  <div className="mb-5 space-y-3">
                    <div className="h-56 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50 sm:h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImages[activeImageIndex] || activeImages[0]}
                      alt={`${active.name} - foto ${activeImageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    </div>
                    {activeImages.length > 1 ? (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {activeImages.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            aria-label={`Tampilkan foto ${index + 1} ${active.name}`}
                            className={`h-16 w-20 flex-none overflow-hidden rounded-sm border-2 bg-neutral-100 transition ${activeImageIndex === index ? "border-gold" : "border-transparent hover:border-neutral-300"}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-start gap-3">
                  <span className="mt-1 text-gold">
                    {active.kind === "airline" ? (
                      <Plane className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-2xl font-extrabold text-primary">
                      {active.name}
                    </h3>
                    {active.meta ? (
                      <p className="mt-1 text-sm font-bold text-neutral-500">
                        {active.meta}
                      </p>
                    ) : null}
                  </div>
                </div>

                {active.kind === "airline" &&
                (active.departureDate || active.route) ? (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {active.departureDate ? (
                      <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-3">
                        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-neutral-500">
                          <CalendarDays className="h-4 w-4 text-gold" />
                          Berangkat
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-primary">
                          {active.departureDate}
                        </p>
                      </div>
                    ) : null}
                    {active.route ? (
                      <div className="rounded-sm border border-neutral-200 bg-neutral-50 p-3">
                        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-neutral-500">
                          <Route className="h-4 w-4 text-gold" />
                          Rute
                        </p>
                        <p className="mt-2 text-sm font-extrabold text-primary">
                          {active.route}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {active.description ? (
                  <p className="mt-5 leading-7 text-neutral-700">
                    {active.description}
                  </p>
                ) : (
                  <p className="mt-5 leading-7 text-neutral-500">
                    Informasi lengkap layanan ini sedang dilengkapi.
                  </p>
                )}

                {active.address ? (
                  <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-neutral-600">
                    <MapPin className="mt-0.5 h-4 w-4 flex-none text-gold" />
                    {active.address}
                  </p>
                ) : null}

                {active.facilities?.length ? (
                  <div className="mt-6">
                    <h4 className="font-extrabold text-primary">
                      Fasilitas utama
                    </h4>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {active.facilities.map((facility) => (
                        <li
                          key={facility}
                          className="rounded-sm bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-700"
                        >
                          {facility}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {active.kind === "hotel" && mapEmbedUrl ? (
                  <div className="mt-7">
                    <h4 className="flex items-center gap-2 font-extrabold text-primary">
                      <MapPin className="h-5 w-5 text-gold" />
                      Lokasi Hotel
                    </h4>
                    <div className="mt-3 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100">
                      <iframe
                        src={mapEmbedUrl}
                        title={`Peta lokasi ${active.name}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-64 w-full"
                      />
                    </div>
                  </div>
                ) : null}

                {active.videoUrls?.length ? (
                  <div className="mt-7">
                    <h4 className="flex items-center gap-2 font-extrabold text-primary">
                      <PlayCircle className="h-5 w-5 text-gold" />
                      Video
                    </h4>
                    <div className="mt-3 space-y-4">
                      {active.videoUrls.map((video) => {
                        const embedUrl = getEmbedUrl(video);
                        return embedUrl ? (
                          <iframe
                            key={video}
                            src={embedUrl}
                            title={`Video ${active.name}`}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            className="aspect-video w-full rounded-sm border"
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : null}

                {active.articles?.length ? (
                  <div className="mt-7">
                    <h4 className="font-extrabold text-primary">
                      Pelajari lebih lanjut
                    </h4>
                    <div className="mt-3 space-y-3">
                      {active.articles.slice(0, 3).map((article) => (
                        <Link
                          key={article.id}
                          href={`/artikel/${article.slug}`}
                          className="block rounded-sm border border-neutral-200 p-4 transition hover:border-gold"
                        >
                          <p className="font-extrabold text-primary">
                            {article.title}
                          </p>
                          {article.excerpt ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">
                              {article.excerpt}
                            </p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  {active.detailUrl ? (
                    <Link
                      href={active.detailUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 font-extrabold text-white"
                    >
                      Lihat Profil <ExternalLink className="h-4 w-4" />
                    </Link>
                  ) : null}
                  {active.mapUrl ? (
                    <a
                      href={active.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-sm border border-primary px-4 py-3 font-extrabold text-primary"
                    >
                      Buka Peta <MapPin className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

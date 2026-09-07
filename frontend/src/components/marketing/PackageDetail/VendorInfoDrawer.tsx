"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  MapPin,
  Plane,
  PlayCircle,
  X,
} from "lucide-react";

export type PackageVendor = {
  key: string;
  label: string;
  kind: "hotel" | "airline";
  name: string;
  detailUrl?: string;
  imageUrl?: string;
  description?: string;
  meta?: string;
  address?: string;
  mapUrl?: string;
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

export default function VendorInfoDrawer({
  vendors,
}: {
  vendors: PackageVendor[];
}) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(vendors[0]?.key || "");
  const active =
    vendors.find((vendor) => vendor.key === activeKey) || vendors[0];

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
        className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-primary px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:bg-primary-700"
      >
        <Building2 className="h-5 w-5 text-gold" />
        Info Hotel & Maskapai
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
                  onClick={() => setActiveKey(vendor.key)}
                  className={`whitespace-nowrap rounded-sm px-4 py-2 text-sm font-extrabold transition ${active?.key === vendor.key ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                >
                  {vendor.label}
                </button>
              ))}
            </div>

            {active ? (
              <div className="overflow-y-auto p-5 sm:p-6">
                {active.imageUrl ? (
                  <div className="mb-5 h-52 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.imageUrl}
                      alt={active.name}
                      className={`h-full w-full ${active.kind === "airline" ? "object-contain p-8" : "object-cover"}`}
                    />
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

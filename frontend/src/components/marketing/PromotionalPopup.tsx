"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import {
  getPublicPromotionalPopup,
  type PublicPromotionalPopup,
} from "@/lib/public-api";

const storageKey = (popup: PublicPromotionalPopup) =>
  `sq:promotional-popup:${popup.id}:${popup.updatedAt || "initial"}`;

export default function PromotionalPopup() {
  const [popup, setPopup] = useState<PublicPromotionalPopup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    getPublicPromotionalPopup()
      .then((campaign) => {
        if (!mounted || !campaign) return;
        const key = storageKey(campaign);
        if (window.localStorage.getItem(key)) return;

        setPopup(campaign);
        timer = setTimeout(
          () => {
            if (!mounted) return;
            window.localStorage.setItem(key, new Date().toISOString());
            setOpen(true);
          },
          Math.max(Number(campaign.delaySeconds || 0), 0) * 1000,
        );
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open || !popup) return null;

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={popup.imageUrl}
      alt={popup.altText || popup.title || "Informasi terbaru Sahabat Qolbu"}
      className="block max-h-[82vh] w-full object-contain"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={popup.title || "Informasi terbaru"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/70 text-white shadow-lg transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Tutup popup"
        >
          <X className="h-5 w-5" />
        </button>

        {popup.targetUrl ? (
          <a
            href={popup.targetUrl}
            target={popup.targetUrl.startsWith("http") ? "_blank" : undefined}
            rel={
              popup.targetUrl.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="group block"
          >
            {image}
            <span className="flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-bold text-white transition group-hover:bg-primary/90">
              Lihat Selengkapnya
              <ExternalLink className="h-4 w-4" />
            </span>
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
}

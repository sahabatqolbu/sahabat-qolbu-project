"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicHeroSlide } from "@/lib/public-api";

const FALLBACK_SLIDES: PublicHeroSlide[] = [
  {
    id: 0,
    title: "Sahabat Qolbu",
    altText: "Ka'bah di Masjidil Haram",
    imageUrl:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80",
  },
];

export default function HeroSlider({ slides }: { slides: PublicHeroSlide[] }) {
  const items = slides.length ? slides : FALLBACK_SLIDES;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const visibleIndex = activeIndex < items.length ? activeIndex : 0;

  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [items.length, paused]);

  const showPrevious = () =>
    setActiveIndex((visibleIndex - 1 + items.length) % items.length);
  const showNext = () =>
    setActiveIndex((visibleIndex + 1) % items.length);

  return (
    <div
      className="relative aspect-[1672/941] w-full overflow-hidden bg-[#071a33]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Informasi utama Sahabat Qolbu"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {items.map((slide, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.id}
          src={slide.imageUrl}
          alt={slide.altText || slide.title || "Informasi Sahabat Qolbu"}
          aria-hidden={index !== visibleIndex}
          loading={index === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-contain transition-[opacity,transform] duration-1000 ease-in-out ${
            index === visibleIndex
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-[1.015] opacity-0"
          }`}
        />
      ))}

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-primary/70 text-white shadow-lg backdrop-blur transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-gold md:left-6 md:h-12 md:w-12"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-primary/70 text-white shadow-lg backdrop-blur transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-gold md:right-6 md:h-12 md:w-12"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-primary/70 px-3 py-2 shadow-lg backdrop-blur md:bottom-7">
            {items.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gold ${
                  index === visibleIndex ? "w-7 bg-gold" : "w-2.5 bg-white/70"
                }`}
                aria-label={`Tampilkan slide ${index + 1}`}
                aria-current={index === visibleIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PackageFlyerGalleryProps = {
  images: string[];
  packageName: string;
};

export default function PackageFlyerGallery({
  images,
  packageName,
}: PackageFlyerGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const hasMultipleImages = images.length > 1;
  const showPrevious = () =>
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  const showNext = () =>
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );

  return (
    <div className="relative overflow-hidden rounded-sm border border-neutral-200 bg-primary shadow-lg shadow-primary/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[activeIndex]}
        alt={`${packageName} - flyer ${activeIndex + 1}`}
        className="block h-auto w-full object-contain"
      />

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Flyer sebelumnya"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm bg-primary/90 text-white shadow-lg transition hover:bg-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Flyer berikutnya"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm bg-primary/90 text-white shadow-lg transition hover:bg-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-sm bg-primary/90 px-3 py-2">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Lihat flyer ${index + 1}`}
                className={`h-1.5 transition-all ${
                  index === activeIndex ? "w-6 bg-gold" : "w-1.5 bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

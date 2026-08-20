"use client";

import type { PublicGalleryImage } from "@/lib/public-api";

interface GalleryMarqueeProps {
  images: PublicGalleryImage[];
}

const buildRow = (images: PublicGalleryImage[], offset: number, reverse = false) => {
  if (images.length === 0) return [];

  const reordered = images.map(
    (_, index) => images[(index + offset) % images.length],
  );
  const row = reverse ? reordered.reverse() : reordered;

  return Array.from({ length: Math.max(1, Math.ceil(6 / row.length)) }, () => row)
    .flat()
    .slice(0, Math.max(6, row.length));
};

function MarqueeRow({
  images,
  direction,
}: {
  images: PublicGalleryImage[];
  direction: "forward" | "reverse";
}) {
  const renderGroup = (duplicate: boolean) => (
    <div
      className="gallery-marquee-group"
      aria-hidden={duplicate || direction === "reverse" ? "true" : undefined}
    >
      {images.map((image, index) => (
        <figure
          key={`${direction}-${image.id}-${index}`}
          className="gallery-marquee-card group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.imageUrl}
            alt={
              duplicate || direction === "reverse"
                ? ""
                : image.title || "Dokumentasi perjalanan Sahabat Qolbu"
            }
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          />
          {image.title || image.description ? (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pb-4 pt-14 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {image.title ? (
                <p className="text-sm font-bold">{image.title}</p>
              ) : null}
              {image.description ? (
                <p className="mt-1 line-clamp-1 text-xs text-white/80">
                  {image.description}
                </p>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );

  return (
    <div className="gallery-marquee-row">
      <div
        className={`gallery-marquee-track ${
          direction === "reverse" ? "gallery-marquee-reverse" : ""
        }`}
      >
        {renderGroup(false)}
        {renderGroup(true)}
      </div>
    </div>
  );
}

export default function GalleryMarquee({ images }: GalleryMarqueeProps) {
  const firstRow = buildRow(images, 0);
  const secondRow = buildRow(images, Math.max(1, Math.floor(images.length / 2)), true);

  return (
    <div className="gallery-marquee-shell" aria-label="Dokumentasi perjalanan jamaah">
      <MarqueeRow images={firstRow} direction="forward" />
      <MarqueeRow images={secondRow} direction="reverse" />
    </div>
  );
}

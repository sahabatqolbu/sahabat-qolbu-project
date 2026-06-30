// src/components/marketing/PackageDetail/PackageGallery.tsx
"use client";

import { useState } from "react";

interface Props {
  images: string[];
}

export default function PackageGallery({ images }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const activeImage = images[selectedImage];

  return (
    <div className="mb-8">
      <div className="relative mb-4 overflow-hidden rounded-3xl">
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt="Poster paket"
            className="block h-auto max-h-[78vh] w-full bg-neutral-100 object-contain"
          />
        ) : (
          <div className="flex min-h-72 w-full items-center justify-center bg-neutral-100 text-center text-neutral-500">
            Gambar paket belum tersedia
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-video overflow-hidden rounded-xl border-3 transition-all ${
                selectedImage === index
                  ? "border-secondary"
                  : "border-neutral-200"
              }`}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={`Poster paket ${index + 1}`} className="h-full w-full bg-neutral-100 object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

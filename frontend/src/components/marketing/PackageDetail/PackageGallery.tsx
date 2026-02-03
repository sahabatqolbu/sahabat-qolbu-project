// src/components/marketing/PackageDetail/PackageGallery.tsx
"use client";

import { useState } from "react";

interface Props {
  images: string[];
}

export default function PackageGallery({ images }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="mb-8">
      {/* Main Image */}
      <div className="relative rounded-3xl overflow-hidden mb-4">
        <div
          className="w-full aspect-[16/10] bg-cover bg-center"
          style={{ backgroundImage: `url(${images[selectedImage]})` }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-video rounded-xl overflow-hidden border-3 transition-all ${
                selectedImage === index
                  ? "border-secondary"
                  : "border-neutral-200"
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${image})` }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

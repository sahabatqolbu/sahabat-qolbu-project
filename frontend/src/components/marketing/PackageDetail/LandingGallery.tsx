import Image from "next/image";
import { Camera } from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";

type Props = {
  pkg: MarketingPackage;
};

export function LandingGallery({ pkg }: Props) {
  const gallery =
    pkg.gallery?.length ? pkg.gallery : pkg.image ? [pkg.image] : [];

  if (gallery.length < 2) {
    return null;
  }

  const displayImages = gallery.slice(0, 6);
  const extraCount = gallery.length - displayImages.length;

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-neutral-100 bg-white shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-4 border-b-2 border-neutral-100 bg-neutral-50/60 p-5 sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-secondary shadow-lg shadow-primary/20">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Galeri
          </p>
          <h2 className="font-display text-2xl font-black tracking-tight text-primary sm:text-3xl">
            Visual Paket
          </h2>
        </div>
      </div>
      <div className="p-3 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {displayImages.map((image, index) => {
            const isFeature = index === 0;
            const isLast = index === displayImages.length - 1 && extraCount > 0;
            return (
              <div
                key={`${image}-${index}`}
                className={`group relative overflow-hidden rounded-2xl bg-primary/10 ${
                  isFeature ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
                }`}
              >
                <Image
                  src={image}
                  alt={`${pkg.name} ${index + 1}`}
                  fill
                  sizes={
                    isFeature
                      ? "(min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1024px) 25vw, 50vw"
                  }
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent opacity-60 transition group-hover:opacity-80" />
                {isLast ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/70 text-secondary backdrop-blur-sm">
                    <span className="font-display text-3xl font-black">
                      +{extraCount}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
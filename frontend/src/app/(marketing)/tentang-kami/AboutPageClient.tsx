"use client";

import Image from "next/image";
import { MapPin, Navigation } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  COMPANY_GOOGLE_MAPS_URL,
  COMPANY_MAP_EMBED_URL,
} from "@/lib/company-location";
import type { CompanyProfile } from "@/lib/public-api";

export default function AboutPageClient({
  profile,
}: {
  profile: CompanyProfile | null;
}) {
  const branding = useBranding();

  const description =
    profile?.description ||
    "Sahabat Qolbu adalah travel umroh Sunnah berizin resmi yang mendampingi jamaah dari seluruh Indonesia dengan pelayanan amanah dan fasilitas transparan.";
  const philosophy = profile?.philosophy || [];
  const targetMarket = profile?.targetMarket || [];

  return (
    <div className="bg-white pt-20 text-gray-800">
      <section className="bg-primary py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
            Tentang Kami
          </span>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Mitra Perjalanan Ibadah yang Amanah dan Terarah
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-200">
            Berangkat Umroh, Pulang Berhijrah. Kami mempersiapkan perjalanan
            jamaah sejak sebelum keberangkatan hingga kembali ke Tanah Air.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/images/about-1.webp"
                alt="Jamaah umroh Sahabat Qolbu"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                Sahabat Qolbu
              </span>
              <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
                Pelayanan Ibadah untuk Jamaah Seluruh Indonesia
              </h2>
              <p className="mt-6 leading-8 text-gray-600">
                <strong>{branding.companyName}</strong> {description}
              </p>
              <p className="mt-4 leading-8 text-gray-600">
                Bimbingan ibadah, jadwal keberangkatan, informasi fasilitas,
                dan pendampingan disampaikan secara jelas agar jamaah dapat
                fokus menjalankan ibadah.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="font-bold text-primary">PPIU Berizin Resmi</p>
                  <p className="mt-1 text-sm text-gray-500">
                    12112100038690008
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
                  <p className="font-bold text-primary">Anggota Asosiasi</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Mutiara Haji Indonesia
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
                  Legalitas & Afiliasi
                </p>
                <div className="grid grid-cols-3 items-center gap-3">
                  {[
                    [
                      "/images/partners/Logo_Kementerian_Haji_dan_Umrah.png",
                      "Kementerian Haji dan Umrah",
                    ],
                    ["/images/partners/logo_5p.png", "5 Pasti Umrah"],
                    [
                      "/images/partners/LOGO MHI utama.png",
                      "Mutiara Haji Indonesia",
                    ],
                  ].map(([src, alt]) => (
                    <div
                      key={src}
                      className="flex min-h-20 items-center justify-center border border-gray-100 bg-gray-50 p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Logo ${alt}`}
                        className="max-h-14 w-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {profile?.vision || profile?.mission || philosophy.length ? (
            <div className="mt-16 grid gap-5 lg:grid-cols-3">
              {profile?.vision || profile?.mission ? (
                <div className="bg-primary p-7 text-white shadow-lg lg:col-span-1">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    Arah Pelayanan
                  </span>
                  {profile?.vision ? (
                    <div className="mt-5">
                      <h2 className="text-xl font-bold">Visi</h2>
                      <p className="mt-2 text-sm leading-7 text-gray-200">
                        {profile.vision}
                      </p>
                    </div>
                  ) : null}
                  {profile?.mission ? (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <h2 className="text-xl font-bold">Misi</h2>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-200">
                        {profile.mission}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {philosophy.length ? (
                <div className="border border-gray-100 bg-white p-7 shadow-sm lg:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    Filosofi
                  </span>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {philosophy.map((item, index) => (
                      <article
                        key={`${item.title}-${index}`}
                        className="border border-gray-100 bg-gray-50 p-5"
                      >
                        <h3 className="font-bold text-primary">
                          {item.title || `Prinsip ${index + 1}`}
                        </h3>
                        {item.description ? (
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {item.description}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {targetMarket.length ? (
        <section className="border-y border-gray-100 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">
              Untuk Siapa Layanan Kami
            </span>
            <h2 className="mt-2 max-w-3xl text-3xl font-bold text-primary md:text-4xl">
              Mendampingi Setiap Jamaah Memilih dengan Tenang
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {targetMarket.map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="border border-gray-100 bg-gray-50 p-6"
                >
                  <span className="text-sm font-bold text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-bold text-primary">
                    {item.title || `Segmen ${index + 1}`}
                  </h3>
                  {item.description ? (
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {item.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden border border-gray-200 bg-white shadow-xl shadow-primary/5 lg:grid-cols-[0.85fr_0.62fr_1.15fr]">
            <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
              <span className="text-sm font-semibold uppercase tracking-wider text-gold">
                Lokasi Kami
              </span>
              <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                Kunjungi Kantor Sahabat Qolbu
              </h2>
              <p className="mt-4 leading-7 text-gray-600">
                Kami melayani konsultasi jamaah dari seluruh Indonesia secara
                online maupun langsung di kantor Sahabat Qolbu.
              </p>
              <div className="mt-7 flex items-start gap-3 border-l-2 border-gold pl-4">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-semibold leading-6 text-gray-700">
                  {branding.address ||
                    "Ruko Jl. Ebony, Metland Transyogi No.11, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820"}
                </p>
              </div>
              <a
                href={COMPANY_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex w-fit items-center gap-2 bg-primary px-5 py-3 font-bold text-white transition hover:bg-secondary"
              >
                <Navigation className="h-4 w-4" />
                Petunjuk Arah
              </a>
            </div>

            <div className="relative min-h-[380px] border-t border-gray-200 lg:min-h-[500px] lg:border-l lg:border-t-0">
              <Image
                src="/images/office-location.webp"
                alt="Kantor Sahabat Qolbu di Metland Transyogi"
                fill
                sizes="(max-width: 1023px) 100vw, 24vw"
                className="object-cover object-center"
              />
            </div>

            <div className="min-h-[380px] border-t border-gray-200 lg:min-h-[500px] lg:border-l lg:border-t-0">
              <iframe
                src={COMPANY_MAP_EMBED_URL}
                title="Peta lokasi kantor Sahabat Qolbu"
                className="h-full min-h-[380px] w-full lg:min-h-[500px]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

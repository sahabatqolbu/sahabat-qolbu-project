"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";

const trustItems = [
  {
    icon: ShieldCheck,
    label: "PPIU Resmi",
    detail: "No. 12112100038690008",
  },
  {
    icon: Check,
    label: "Sesuai Sunnah",
    detail: "Bimbingan selama perjalanan",
  },
  {
    icon: HeartPulse,
    label: "Pendampingan Jamaah",
    detail: "Pembimbing dan tim medis",
  },
  {
    icon: ClipboardCheck,
    label: "Pelayanan Transparan",
    detail: "Jadwal dan fasilitas jelas",
  },
];

export default function HomepageHero() {
  const branding = useBranding();
  const message = encodeURIComponent(
    "Assalamualaikum, saya ingin berkonsultasi mengenai perjalanan umroh bersama Sahabat Qolbu.",
  );
  const consultationUrl = `https://wa.me/${branding.whatsappNumber}?text=${message}`;

  return (
    <section
      id="beranda"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#071f32] text-white"
    >
      <div className="absolute inset-0 -z-30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2200&q=88"
          alt="Suasana perjalanan umroh bersama Sahabat Qolbu"
          className="h-full w-full object-cover object-[64%_center] sm:object-center"
        />
      </div>
      <div className="absolute inset-0 -z-20 bg-[#071f32]/72" />
      <div className="absolute inset-y-0 left-0 -z-10 w-full bg-[#071f32]/48 sm:w-[62%] sm:bg-[#071f32]/66" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-5 pb-48 pt-28 sm:px-8 sm:pb-44 sm:pt-32 lg:px-10">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7cf67] sm:text-xs">
            <span className="h-px w-8 bg-[#f2bd38]" />
            Travel Umroh Sunnah · PPIU Resmi
          </div>

          <h1 className="max-w-3xl font-serif text-[2.65rem] font-bold leading-[1.03] text-white sm:text-6xl lg:text-[4.65rem]">
            Berangkat Umroh,
            <span className="mt-2 block text-[#f2bd38]">
              Pulang Berhijrah.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/76 sm:text-lg sm:leading-8">
            Sahabat Qolbu mendampingi jamaah dari seluruh Indonesia menjalani
            umroh sesuai Al-Qur&apos;an dan Sunnah, dengan pelayanan amanah,
            fasilitas transparan, serta pendampingan sejak persiapan hingga
            kembali ke Tanah Air.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            <Link
              href="/paket"
              className="inline-flex min-h-13 items-center justify-center gap-3 bg-[#f2bd38] px-7 py-4 text-sm font-extrabold text-[#071f32] transition hover:bg-[#ffd15b]"
            >
              Lihat Paket Umroh
              <ArrowRight size={18} />
            </Link>
            <a
              href={consultationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-13 items-center justify-center gap-3 border border-white/45 bg-[#071f32]/35 px-7 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-[#071f32]"
            >
              <MessageCircle size={18} />
              Konsultasi dengan Kami
            </a>
          </div>

          <div className="mt-8 flex items-center gap-4 border-l-2 border-[#f2bd38] pl-4 sm:mt-9">
            <div className="flex h-11 w-16 shrink-0 items-center justify-center bg-white px-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/partners/LOGO MHI utama.png"
                alt="Logo Mutiara Haji Indonesia"
                className="max-h-9 max-w-full object-contain"
              />
            </div>
            <div>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/48">
                Anggota asosiasi
              </span>
              <strong className="mt-1 block text-sm text-white/90">
                Mutiara Haji Indonesia
              </strong>
              <span className="mt-1 block text-[10px] text-white/50">
                Ketua Umum: Ustadz Khalid Basalamah
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/12 bg-[#071f32]/94 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex min-h-[88px] items-center gap-3 py-3 ${
                  index % 2 === 0
                    ? "pr-3"
                    : "border-l border-white/10 pl-3"
                } ${index > 1 ? "border-t border-white/10 lg:border-t-0" : ""} lg:border-l lg:border-white/10 lg:px-6 first:lg:border-l-0 first:lg:pl-0`}
              >
                <Icon
                  className="h-5 w-5 shrink-0 text-[#f2bd38]"
                  strokeWidth={1.8}
                />
                <div>
                  <strong className="block text-[11px] font-bold text-white sm:text-sm">
                    {item.label}
                  </strong>
                  <span className="mt-1 block text-[9px] leading-4 text-white/50 sm:text-xs">
                    {item.detail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

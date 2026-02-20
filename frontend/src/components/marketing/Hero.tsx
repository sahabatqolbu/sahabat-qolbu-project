"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Phone, CheckCircle2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const heroImages = [
  "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1920&q=80",
  "https://images.unsplash.com/photo-1564769610819-790a44eac2e8?w=1920&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1920&q=80",
];

const achievements = [
  { value: "5000+", label: "Jamaah" },
  { value: "14 Tahun", label: "Pengalaman" },
  { value: "4.9/5", label: "Rating" },
];

const features = [
  "Terdaftar Resmi Kemenag RI",
  "Pembimbing Bersertifikat",
  "Hotel Dekat Masjidil Haram",
  "Harga Transparan & Terjangkau",
];

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-primary">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={cn(
              "absolute inset-0 transition-opacity duration-2000",
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
              }}
            />
          </div>
        ))}

        {/* Professional Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/98 via-primary/95 to-primary-700/90" />

        {/* Subtle Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFC107' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container-custom py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm px-5 py-2.5 rounded-full border-2 border-secondary/40">
              <Star className="w-5 h-5 text-secondary fill-secondary" />
              <span className="text-white font-bold text-sm">
                Terpercaya Sejak 2010
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="font-display font-black text-white leading-[1.1]">
                <span className="block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-4">
                  Wujudkan Impian
                </span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-secondary">
                  Umroh Anda
                </span>
              </h1>

              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white/90">
                Sahabat Qolbu Cahaya Baitullah
              </p>

              <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Mitra perjalanan ibadah umroh terpercaya dengan pengalaman 14
                tahun melayani ribuan jamaah dengan profesional dan penuh amanah
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/packages"
                className="group inline-flex items-center justify-center gap-3 bg-secondary hover:bg-secondary-600 text-primary font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl shadow-secondary/40 hover:shadow-secondary/60 transition-all duration-300 hover:scale-105"
              >
                <span>Lihat Paket Umroh</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="https://wa.me/6282121453311?text=Assalamualaikum,%20saya%20ingin%20konsultasi%20paket%20umroh"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm text-white font-bold text-lg px-10 py-5 rounded-2xl border-3 border-white/40 hover:border-white transition-all duration-300"
              >
                <Phone className="w-6 h-6" />
                <span>Konsultasi Gratis</span>
              </a>
            </div>

            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm sm:text-base">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Stats Card */}
          <div className="lg:flex justify-center items-center animate-scale-in">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 lg:p-10 shadow-2xl border-4 border-secondary/30 max-w-md w-full">
              {/* Stats Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-neutral-200">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Star className="w-8 h-8 text-primary fill-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl text-primary mb-2">
                  Kepercayaan Jamaah
                </h3>
                <p className="text-neutral-600 font-medium">
                  Bukti nyata pengalaman kami
                </p>
              </div>

              {/* Stats Grid */}
              <div className="space-y-6">
                {achievements.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-secondary/10 to-transparent rounded-2xl border-l-4 border-secondary hover:shadow-lg transition-all duration-300"
                  >
                    <div>
                      <div className="text-sm font-semibold text-neutral-600 mb-1">
                        {stat.label}
                      </div>
                      <div className="font-display font-black text-4xl text-primary">
                        {stat.value}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <div className="w-3 h-3 bg-secondary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="mt-8 pt-6 border-t-2 border-neutral-200 space-y-3">
                <a
                  href="tel:+622122866671"
                  className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all"
                >
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 font-semibold">
                      Hubungi Kami
                    </div>
                    <div className="font-bold text-primary">021-22866671</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === currentImageIndex
                ? "w-12 bg-secondary"
                : "w-6 bg-white/40 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />
    </section>
  );
}

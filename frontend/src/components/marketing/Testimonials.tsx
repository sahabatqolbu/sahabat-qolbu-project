"use client";

import { useState } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    id: 1,
    name: "H. Ahmad Fauzi",
    location: "Jakarta Selatan",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    rating: 5,
    date: "Februari 2024",
    text: "Alhamdulillah, pengalaman umroh bersama Sahabat Qolbu sangat memuaskan. Pelayanan ramah, hotel dekat Masjidil Haram, dan pembimbing yang sangat membantu. Terima kasih Sahabat Qolbu!",
    package: "Umroh Ramadhan 2024",
    verified: true,
    proofImage:
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80",
  },
  {
    id: 2,
    name: "Hj. Siti Nurhaliza",
    location: "Bandung",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    rating: 5,
    date: "Januari 2024",
    text: "Sangat puas dengan pelayanan dari awal sampai akhir. Tour guide sangat profesional dan sabar mengajarkan manasik. Harga juga sangat terjangkau untuk kualitas yang didapat. Recommended!",
    package: "Umroh Plus Turki",
    verified: true,
    proofImage:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
  },
  {
    id: 3,
    name: "H. Hendra Wijaya",
    location: "Surabaya",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    rating: 5,
    date: "Desember 2023",
    text: "Pertama kali umroh dan memilih Sahabat Qolbu adalah keputusan terbaik. Semua diatur dengan rapi, jadwal jelas, dan tim sangat responsif. Insya Allah akan umroh lagi bersama Sahabat Qolbu.",
    package: "Umroh Reguler",
    verified: true,
    proofImage:
      "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = testimonials[currentIndex];

  const next = () =>
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  return (
    <section className="py-20 md:py-28 section-primary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border-2 border-white/20">
            <Quote className="w-5 h-5 text-secondary" />
            <span className="text-white font-bold text-sm">
              Testimoni Jamaah
            </span>
          </div>

          <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-6">
            Apa Kata Mereka?
          </h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto font-medium">
            Kepuasan dan kepercayaan jamaah adalah kebanggaan terbesar kami
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Proof Image */}
            <div className="order-2 lg:order-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 border-2 border-white/20">
                {/* Proof Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-primary-900">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${current.proofImage})`,
                    }}
                  />

                  {/* Verified Badge */}
                  <div className="absolute top-4 right-4 bg-success text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 backdrop-blur-sm bg-success/95">
                    <CheckCircle2 className="w-5 h-5" />
                    Bukti Terverifikasi
                  </div>
                </div>

                {/* Caption */}
                <div className="mt-4 flex items-center gap-2 text-white/80 px-2">
                  <ImageIcon className="w-5 h-5 text-secondary" />
                  <span className="text-sm font-semibold">
                    Dokumentasi umroh {current.name} di Tanah Suci
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Testimonial Content */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border-4 border-secondary/30 relative">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-5">
                  <Quote className="w-24 h-24 text-primary" />
                </div>

                <div className="relative z-10">
                  {/* Stars */}
                  <div className="flex gap-1.5 mb-6">
                    {[...Array(current.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-7 h-7 fill-secondary text-secondary"
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <blockquote className="text-lg md:text-xl text-neutral-700 leading-relaxed mb-8 font-medium italic">
                    "{current.text}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-neutral-100">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-secondary/30 flex-shrink-0">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${current.avatar})` }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-bold text-xl text-primary">
                          {current.name}
                        </h4>
                        {current.verified && (
                          <CheckCircle2 className="w-5 h-5 text-success fill-success" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 font-semibold">
                        {current.location}
                      </p>
                    </div>
                  </div>

                  {/* Package & Date */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500 font-semibold">
                        Paket
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {current.package}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500 font-semibold">
                        Tanggal
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {current.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={prev}
                  className="w-12 h-12 bg-white hover:bg-secondary text-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Indicators */}
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === currentIndex
                          ? "w-12 bg-secondary"
                          : "w-6 bg-white/40 hover:bg-white/60"
                      )}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={next}
                  className="w-12 h-12 bg-white hover:bg-secondary text-primary rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {[
            { value: "4.9/5", label: "Rating Kepuasan" },
            { value: "500+", label: "Total Review" },
            { value: "98%", label: "Repeat Customer" },
            { value: "5000+", label: "Jamaah Terlayani" },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-white/20 hover:bg-white/20 transition-all"
            >
              <div className="font-display font-black text-4xl text-secondary mb-2">
                {stat.value}
              </div>
              <div className="text-white/90 font-semibold text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

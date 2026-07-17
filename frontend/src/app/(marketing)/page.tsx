"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBranding } from "@/components/providers/BrandingProvider";
import PackageCard from "@/components/marketing/PackageCard";
import { getCalonJamaahRegisterUrl } from "@/lib/dashboard-url";
import {
  getMarketingPackages,
  getPublicCompanyProfile,
  getPublicArticles,
  getPublicFaqs,
  getPublicGallery,
  type CompanyProfile,
  type MarketingPackage,
  type PublicArticle,
  type PublicFaq,
  type PublicGalleryImage,
} from "@/lib/public-api";

export default function MarketingHomePage() {
  const branding = useBranding();
  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [galleryImages, setGalleryImages] = useState<PublicGalleryImage[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>("");
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getMarketingPackages(),
      getPublicArticles("limit=3"),
      getPublicFaqs(),
      getPublicGallery(),
      getPublicCompanyProfile(),
    ])
      .then(([packageData, articleData, faqData, galleryData, profileData]) => {
        if (active) {
          setPackages(packageData);
          setArticles(articleData);
          setFaqs(faqData);
          const firstCategory = faqData.find((faq) => faq.category)?.category || faqData[0]?.category || "";
          setActiveFaqCategory(firstCategory);
          setOpenFaqId(faqData.find((faq) => faq.category === firstCategory)?.id ?? faqData[0]?.id ?? null);
          setGalleryImages(galleryData);
          setCompanyProfile(profileData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load marketing packages", err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredPackages = packages.slice(0, 6);
  const faqCategories = Array.from(
    new Map(
      faqs
        .map((faq) => faq.category?.trim())
        .filter((category): category is string => Boolean(category))
        .map((category) => [category, category]),
    ).values(),
  );
  const visibleFaqs = activeFaqCategory
    ? faqs.filter((faq) => faq.category === activeFaqCategory)
    : faqs.slice(0, 6);
  const philosophyItems = companyProfile?.philosophy || [];
  const targetMarketItems = companyProfile?.targetMarket || [];
  const hasBrandContent = Boolean(
    companyProfile?.vision ||
    companyProfile?.mission ||
    philosophyItems.length ||
    targetMarketItems.length,
  );
  const companyDescription = (
    companyProfile?.description ||
    "adalah travel umroh resmi yang tergabung dalam Asosiasi Mutiara Haji Indonesia. Fokus kami bukan hanya memberangkatkan jamaah umroh, tetapi juga membangun pelayanan, edukasi, dan pendampingan yang lebih baik bagi tamu-tamu Allah."
  ).trim();

  const messageConsult = encodeURIComponent(
    `Assalamualaikum, saya lihat di website sahabatqolbu.com dan tertarik dengan paket umroh ${branding.companyName}`,
  );
  const waHeroLink = `https://wa.me/${branding.whatsappNumber}?text=${messageConsult}`;
  const registerUrl = getCalonJamaahRegisterUrl();
  const renderFaqAnswer = (answer: string) =>
    answer.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
      if (!part.startsWith("http://") && !part.startsWith("https://")) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }

      const href = part.replace(/[),.]+$/, "");
      const suffix = part.slice(href.length);

      return (
        <span key={`${part}-${index}`}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold text-primary underline decoration-gold/60 underline-offset-4 transition hover:text-gold sm:break-words"
          >
            {href}
          </a>
          {suffix}
        </span>
      );
    });

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-800">
      {/* HERO SECTION */}
      <section id="beranda" className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80"
            alt="Ka'bah Masjidil Haram"
            className="w-full h-full object-cover"
          />
          <div className="gradient-overlay absolute inset-0"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="max-w-3xl animate-fade-in">
            {/* Badge Resmi */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white text-sm font-medium">
                Resmi PPIU: 12112100038690008
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Travel Umroh Sunnah Resmi & Terpercaya
              <span className="text-gold block mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                Tergabung dalam Asosiasi Mutiara Haji Indonesia
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
              {`${branding.companyName} melayani perjalanan umroh sesuai Al-Qur'an dan Sunnah, dengan legalitas resmi, pembimbing terpercaya, jadwal keberangkatan jelas, serta fasilitas perjalanan yang transparan.`}
            </p>

            {/* Promo Badge */}
            <div className="mb-8 inline-block bg-white text-primary px-6 py-3 rounded-lg font-bold transform -rotate-1 shadow-lg text-sm sm:text-base">
              Tergabung Asosiasi Mutiara Haji Indonesia - Ketua Umum: Ustadz
              Khalid Basalamah
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={registerUrl}
                className="gold-gradient text-primary font-bold px-8 py-4 rounded-full text-center hover:opacity-90 transition-all hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
                  />
                </svg>
                Daftar Jadi Calon Jamaah
              </a>
              <Link
                href="/paket"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full text-center hover:bg-white hover:text-primary transition-all inline-flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Lihat Paket
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gold"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Ratusan</p>
                  <p className="text-gray-400 text-xs">Jamaah Puas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gold"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Travel Resmi</p>
                  <p className="text-gray-400 text-xs">
                    PPIU 12112100038690008
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Profesional</p>
                  <p className="text-gray-400 text-xs">Tim Berpengalaman</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAKET UMROH */}
      <section id="paket" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-gold font-semibold text-sm uppercase tracking-wider">
              Paket Umroh
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
              Seat Terbatas! Booking Sekarang
            </h2>
            <p className="text-gray-600 font-medium">
              Rasakan Kekhusyukan Saat Beribadah bersama Sahabat Qolbu
            </p>
            <div className="mt-4 bg-primary/5 inline-block px-4 py-2 rounded-lg text-sm sm:text-base">
              <span className="text-primary font-bold">
                📢 Satu-satunya Travel Umroh dengan Tim Medis Pribadi!
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredPackages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold text-primary">
                Paket belum tersedia
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Data paket akan tampil otomatis setelah dipublish.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}

          {/* Lihat Semua Button */}
          <div className="text-center mt-10">
            <Link
              href="/paket"
              className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <span>Lihat Semua Paket</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          {/* Urgency Alert */}
          <div className="mt-10 p-4 bg-red-50 border border-red-100 rounded-xl max-w-2xl mx-auto text-center animate-pulse">
            <p className="text-red-600 font-bold">
              ⚠️ Segera booking seat sebelum kehabisan!
            </p>
            <p className="text-sm text-red-500">
              Kuota setiap keberangkatan terbatas untuk menjaga kenyamanan
              jamaah.
            </p>
          </div>
        </div>
      </section>

      {/* KEUNGGULAN */}
      <section className="relative overflow-hidden bg-primary py-16 text-white md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/20" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold">
              Keunggulan Kami
            </span>
            <h2 className="mt-5 text-3xl font-bold md:text-4xl">
              Mengapa Sahabat Qolbu?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-300">
              Setiap detail perjalanan disiapkan agar jamaah bisa fokus
              beribadah dengan jadwal, fasilitas, dan pendampingan yang jelas.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Harga Terbaik</h3>
              <p className="text-sm leading-6 text-gray-300">
                Paket Umroh dan Haji dengan fasilitas terbaik di kelasnya.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Sesuai Syariat</h3>
              <p className="text-sm leading-6 text-gray-300">
                Kegiatan ibadah InsyaAllah sesuai Al-Quran & Sunnah.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Tim Medis Pribadi</h3>
              <p className="text-sm leading-6 text-gray-300">
                Satu-satunya travel umroh dengan pendampingan tim medis pribadi.
              </p>
            </div>

            <div className="group rounded-lg border border-white/10 bg-white/[0.06] p-6 text-left shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-gold text-primary shadow-lg shadow-gold/20">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold">Jadwal Tepat</h3>
              <p className="text-sm leading-6 text-gray-300">
                Tanggal berangkat, nomor pesawat & itinerary sudah tertera.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TENTANG KAMI */}
      <section id="tentang" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/images/about-1.webp"
                  alt="Jamaah umroh Sahabat Qolbu"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-5 hidden sm:block border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">100%</p>
                    <p className="text-gray-500 text-sm">Amanah & Resmi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                Tentang Kami
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-6">
                Mitra Perjalanan Ibadah Anda yang Amanah
              </h2>
              <div className="prose text-gray-600 mb-8 leading-relaxed">
                <p className="mb-4">
                  <strong>{branding.companyName}</strong> {companyDescription}
                </p>
                <p className="mb-4">
                  Kami berkomitmen memberikan bimbingan ibadah intensif, jadwal
                  keberangkatan yang jelas, informasi fasilitas yang transparan,
                  dan pendampingan terbaik untuk kenyamanan jamaah.
                </p>
                <ul className="list-none space-y-2 ml-1">
                  <li className="flex items-center gap-2">
                    ✓ Bimbingan Ibadah Sesuai Qur&apos;an & Sunnah
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Pendampingan Tim Medis Pribadi
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Edukasi & Pembekalan Manasik Lengkap
                  </li>
                  <li className="flex items-center gap-2">
                    ✓ Harga, jadwal, dan fasilitas diinformasikan dengan jelas
                  </li>
                </ul>
                <p className="mt-4 italic font-medium text-primary">
                  &quot;Sehingga Jamaah khusyu dalam menjalankan Ibadah Haji dan
                  Umroh sesuai tuntunan Al-Qur&apos;an & Sunnah.&quot;
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gold"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 10l-6-6H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10zm-2 0v8H4V6h10l6 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-sm sm:text-base">
                      Legalitas Resmi
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      PPIU 12112100038690008
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-sm sm:text-base">
                      Tergabung Asosiasi
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Mutiara Haji Indonesia
                    </p>
                  </div>
                </div>
              </div>

              {/* Partner Logos */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary">
                  Legalitas & Afiliasi
                </p>
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/partners/Logo_Kementerian_Haji_dan_Umrah.png"
                      alt="Logo Kementerian Haji dan Umrah"
                      className="max-h-14 w-auto object-contain"
                    />
                  </div>
                  <div className="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/partners/logo_5p.png"
                      alt="Logo 5 Pasti Umrah"
                      className="max-h-14 w-auto object-contain"
                    />
                  </div>
                  <div className="flex min-h-20 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/partners/LOGO MHI utama.png"
                      alt="Logo MHI"
                      className="max-h-14 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasBrandContent ? (
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {companyProfile?.vision || companyProfile?.mission ? (
                <div className="rounded-2xl bg-primary p-6 text-white shadow-lg shadow-primary/10 lg:col-span-1">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    Arah Pelayanan
                  </span>
                  {companyProfile?.vision ? (
                    <div className="mt-5">
                      <h3 className="text-xl font-bold">Visi</h3>
                      <p className="mt-2 text-sm leading-7 text-gray-200">
                        {companyProfile.vision}
                      </p>
                    </div>
                  ) : null}
                  {companyProfile?.mission ? (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <h3 className="text-xl font-bold">Misi</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-gray-200">
                        {companyProfile.mission}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {philosophyItems.length > 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                    Filosofi
                  </span>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {philosophyItems.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <h3 className="font-bold text-primary">
                          {item.title || `Prinsip ${index + 1}`}
                        </h3>
                        {item.description ? (
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {targetMarketItems.length > 0 ? (
        <section className="border-y border-gray-100 bg-white py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                  Market Sahabat Qolbu
                </span>
                <h2 className="mt-2 text-3xl font-bold text-primary md:text-4xl">
                  Untuk Calon Jamaah yang Ingin Memilih dengan Tenang
                </h2>
                <p className="mt-4 leading-7 text-gray-600">
                  Informasi ini ditarik dari dashboard admin agar positioning
                  layanan selalu bisa diperbarui mengikuti kebutuhan market.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {targetMarketItems.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-gold">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-primary">
                      {item.title || `Segmen ${index + 1}`}
                    </h3>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {galleryImages.length > 0 ? (
        <section id="gallery" className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                Gallery
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                Momen Perjalanan Jamaah
              </h2>
              <p className="text-gray-600">
                Momen jamaah Sahabat Qolbu dalam perjalanan ibadah.
              </p>
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {galleryImages.map((image) => (
                <figure
                  key={image.id}
                  className="group relative break-inside-avoid overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.imageUrl}
                    alt={image.title || "Dokumentasi Sahabat Qolbu"}
                    loading="lazy"
                    className="w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  {image.title || image.description ? (
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-4 pt-12 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {image.title ? (
                        <h3 className="font-semibold">{image.title}</h3>
                      ) : null}
                      {image.description ? (
                        <p className="mt-1 text-sm text-white/80">
                          {image.description}
                        </p>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {articles.length > 0 ? (
        <section id="artikel" className="border-y border-gray-100 bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                  Artikel
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                  Panduan Sebelum Berangkat Umroh
                </h2>
                <p className="text-gray-600 leading-7">
                  Baca penjelasan singkat tentang hotel, maskapai, fasilitas,
                  dan persiapan perjalanan agar calon jamaah bisa memilih paket
                  dengan lebih yakin.
                </p>
              </div>
              <Link
                href="/artikel"
                className="inline-flex items-center justify-center rounded-md border border-primary px-5 py-3 font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                Lihat Semua Artikel
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {articles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/artikel/${article.slug}`}
                  className="group overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-primary/10"
                >
                  {article.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-primary/5 text-primary">
                      <svg
                        className="h-10 w-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h9l5 5v9a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gold">
                      {article.category || "Artikel"}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-extrabold text-primary group-hover:text-gold">
                      {article.title}
                    </h3>
                    {article.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                        {article.excerpt}
                      </p>
                    ) : null}
                    <span className="mt-5 inline-flex font-bold text-primary group-hover:text-gold">
                      Baca selengkapnya →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length > 0 ? (
        <section id="faq" className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-gold font-semibold text-sm uppercase tracking-wider">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
                Pertanyaan yang Sering Ditanyakan
              </h2>
              <p className="text-gray-600">
                Jawaban singkat untuk membantu calon jamaah memahami layanan
                sebelum konsultasi.
              </p>
            </div>

            {faqCategories.length > 0 ? (
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {faqCategories.map((category) => {
                  const isActive = activeFaqCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveFaqCategory(category);
                        setOpenFaqId(faqs.find((faq) => faq.category === category)?.id ?? null);
                      }}
                      className={`rounded-sm border px-4 py-2 text-sm font-bold transition ${
                        isActive
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-gray-200 bg-white text-primary hover:border-gold hover:bg-gold/10"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-3">
              {visibleFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;

                return (
                  <article
                    key={faq.id}
                    className={`rounded-xl border bg-white shadow-sm transition ${
                      isOpen
                        ? "border-gold/50 bg-gold/5"
                        : "border-gray-100 hover:border-gold/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-primary"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary transition ${
                          isOpen ? "rotate-45 bg-primary text-white" : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="border-t border-gold/20 px-5 pb-5 pt-4">
                        <div className="whitespace-pre-line break-words leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                          {renderFaqAnswer(faq.answer)}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-primary py-16 md:py-24">
        {/* Decorative Elements */}
        <div className="absolute inset-x-0 top-0 h-px bg-gold/50" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/15" />
        <div className="absolute right-0 top-0 h-72 w-72 translate-x-1/3 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 rounded-full bg-black/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/10">
            <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="p-8 md:p-10 lg:p-12">
                <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gold">
                  Siap Konsultasi?
                </span>
                <h2 className="mt-6 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                  Wujudkan Rindu Baitullah Bersama Kami
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-gray-200 md:text-lg">
                  &quot;Rasakan Kekhusyukan Saat Beribadah&quot;. Tim kami siap
                  bantu jelaskan paket, jadwal, fasilitas, dan alur pendaftaran.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={waHeroLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 rounded-md bg-gold px-7 py-4 text-base font-bold text-primary shadow-lg shadow-gold/20 transition hover:bg-gold-dark"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                  <Link
                    href="/paket"
                    className="inline-flex items-center justify-center rounded-md border border-white/25 px-7 py-4 text-base font-bold text-white transition hover:bg-white hover:text-primary"
                  >
                    Lihat Semua Paket
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/10 bg-white/[0.06] p-8 md:p-10 lg:border-l lg:border-t-0 lg:p-12">
                <div className="grid gap-4">
                  {[
                    "Konsultasi paket dan jadwal keberangkatan",
                    "Arahan pendaftaran calon jamaah",
                    "Informasi hotel, maskapai, dan fasilitas",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-4"
                    >
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-primary">
                        ✓
                      </span>
                      <p className="text-sm leading-6 text-gray-100">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


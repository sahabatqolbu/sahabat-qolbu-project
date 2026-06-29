// src/components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/providers/BrandingProvider";

const navigation = [
  { name: "Beranda", href: "/#beranda" },
  { name: "Tentang", href: "/#tentang" },
  { name: "Paket", href: "/#paket" },
  { name: "Testimoni", href: "/#testimoni" },
];

export default function Navbar() {
  const branding = useBranding();
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 50 : false,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const messageConsult = encodeURIComponent(
    "Assalamualaikum, saya lihat di website sahabatqolbu.com  dan tertarik konsultasi tentang paket umroh",
  );
  const waConsultLink = `https://wa.me/${branding.whatsappNumber}?text=${messageConsult}`;

  return (
    <header
      id="header"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-primary shadow-lg" : "",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={branding.logoLink}
            className="flex items-center gap-2 md:gap-3"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logo}
                alt="Logo Sahabat Qolbu"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-lg md:text-xl font-bold">
                <span className="js-logo-sahabat text-white transition-colors duration-300">
                  {branding.logoTextSahabat}
                </span>{" "}
                <span className="js-logo-qolbu text-gold transition-colors duration-300">
                  {branding.logoTextQolbu}
                </span>
              </span>
              <span className="js-company-tagline hidden sm:block text-xs text-gray-300 transition-colors duration-300">
                {branding.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-link text-white hover:text-gold transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3 border-l border-white/20 pl-5">
              <Link
                href="/login"
                className="nav-link text-white hover:text-gold transition-colors font-semibold"
              >
                Login
              </Link>
              <a
                href={waConsultLink}
                target="_blank"
                rel="noopener noreferrer"
                className="gold-gradient text-primary font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
              >
                Hubungi Kami
              </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-white hover:text-gold transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka menu navigasi"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden bg-primary border-t border-white/10"
          id="mobileMenu"
        >
          <div className="px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-white hover:text-gold py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/login"
              className="block text-white hover:text-gold py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <a
              href={waConsultLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block gold-gradient text-primary font-semibold px-5 py-3 rounded-full text-center mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

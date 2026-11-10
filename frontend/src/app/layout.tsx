import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { generateMetadata as getMetadata, safeJsonLd } from "@/lib/seo";
import QueryProvider from "@/components/providers/QueryProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

export const metadata: Metadata = getMetadata();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["TravelAgency", "Organization"],
      "@id": "https://sahabatqolbu.com/#organization",
      name: "Sahabat Qolbu Cahaya Baitullah",
      legalName: "PT Sahabat Qolbu Cahaya Baitullah",
      alternateName: "Sahabat Qolbu",
      slogan: "Berangkat Umroh, Pulang Berhijrah",
      description:
        "Travel umroh Sunnah resmi berizin Kemenag (PPIU 12112100038690008) yang melayani jamaah dari seluruh Indonesia dengan bimbingan ibadah sesuai Sunnah, pelayanan amanah, dan akomodasi terpercaya.",
      url: "https://sahabatqolbu.com",
      logo: "https://sahabatqolbu.com/landing/images/icon.png",
      image: "https://sahabatqolbu.com/og-image.jpg",
      telephone: "+62-812-5587-1984",
      email: "Sahabatqolbucahayabaitullah@gmail.com",
      priceRange: "Rp 34.900.000 - Rp 45.000.000",
      currenciesAccepted: "IDR",
      paymentAccepted: "Cash, Bank Transfer",
      identifier: {
        "@type": "PropertyValue",
        name: "Nomor PPIU",
        value: "12112100038690008",
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Ruko Jl. Ebony, Metland Transyogi No. 11",
        addressLocality: "Cileungsi",
        addressRegion: "Jawa Barat",
        postalCode: "16820",
        addressCountry: "ID",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -6.4040448,
        longitude: 106.9765834,
      },
      hasMap: "https://maps.app.goo.gl/iUtoNEKQhq8T1ftKA",
      areaServed: {
        "@type": "Country",
        name: "Indonesia",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:30",
          closes: "17:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Saturday",
          opens: "08:30",
          closes: "14:00",
        },
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+62-812-5587-1984",
        contactType: "customer service",
        areaServed: "ID",
        availableLanguage: ["id", "en", "ar"],
      },
      memberOf: {
        "@type": "Organization",
        name: "Asosiasi Mutiara Haji Indonesia",
      },
      knowsAbout: [
        "Ibadah Umroh Sunnah",
        "Paket Umroh Ramadhan",
        "Kereta Cepat Haramain",
        "Visa Umroh",
        "Hotel Dekat Masjidil Haram",
        "Hotel Dekat Masjid Nabawi",
        "Bimbingan Manasik Sesuai Sunnah",
      ],
      sameAs: [
        "https://www.facebook.com/sahabatqolbu.ofc",
        "https://www.instagram.com/sahabatqolbu.ofc/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://sahabatqolbu.com/#website",
      url: "https://sahabatqolbu.com",
      name: "Sahabat Qolbu",
      publisher: {
        "@id": "https://sahabatqolbu.com/#organization",
      },
      inLanguage: "id-ID",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <BrandingProvider>
            {children}
            <Toaster />
          </BrandingProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

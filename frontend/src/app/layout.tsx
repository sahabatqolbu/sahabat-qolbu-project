import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { generateMetadata as getMetadata } from "@/lib/seo";
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
        "Travel umroh Sunnah resmi yang melayani jamaah dari seluruh Indonesia dengan bimbingan ibadah, pelayanan amanah, dan pendampingan perjalanan.",
      url: "https://sahabatqolbu.com",
      logo: "https://sahabatqolbu.com/landing/images/icon.png",
      image: "https://sahabatqolbu.com/og-image.jpg",
      telephone: "+62-812-5587-1984",
      email: "Sahabatqolbucahayabaitullah@gmail.com",
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
      areaServed: {
        "@type": "Country",
        name: "Indonesia",
      },
      hasMap: "https://maps.app.goo.gl/iUtoNEKQhq8T1ftKA",
      memberOf: {
        "@type": "Organization",
        name: "Asosiasi Mutiara Haji Indonesia",
      },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

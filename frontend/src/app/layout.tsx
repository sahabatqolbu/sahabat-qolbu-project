import type { Metadata } from "next";
import { Inter, Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import { generateMetadata as getMetadata } from "@/lib/seo";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

// Poppins - Font Utama (Standard)
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  preload: true,
});

// Playfair Display - Font Display (Heading Khusus)
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: true,
});

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
  "@type": "TravelAgency",
  name: "Sahabat Qolbu Cahaya Baitullah",
  description: "Tour & Travel Umroh Terpercaya Sejak 2010",
  url: "https://sahabatqolbu.com",
  telephone: "+62-21-22866671",
  email: "admin@sahabatqolbu.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Ruko Taman Permata Buana Blok C No 7",
    addressLocality: "Jakarta Barat",
    addressRegion: "DKI Jakarta",
    postalCode: "11740",
    addressCountry: "ID",
  },
  sameAs: [
    "https://www.facebook.com/sahabatqolbu",
    "https://www.instagram.com/sahabatqolbu",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "500",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="icon" type="image/png" href="/landing/images/icon.png" />
        <link rel="shortcut icon" type="image/png" href="/landing/images/icon.png" />
        <link rel="apple-touch-icon" href="/landing/images/icon.png" />
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
        className={`${poppins.variable} ${playfair.variable} ${inter.variable} font-sans antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

import { Metadata } from "next";

const siteConfig = {
  name: "Sahabat Qolbu Cahaya Baitullah",
  description:
    "Sahabat Qolbu adalah travel umroh Sunnah resmi yang mendampingi jamaah dari seluruh Indonesia dengan pelayanan amanah, fasilitas transparan, dan bimbingan sesuai Al-Qur'an dan Sunnah.",
  url: "https://sahabatqolbu.com",
  ogImage: "https://sahabatqolbu.com/og-image.jpg",
  keywords: [
    "travel umroh sunnah",
    "travel umroh resmi",
    "travel umroh resmi kemenag",
    "travel umroh indonesia",
    "paket umroh sunnah",
    "paket umroh 2026",
    "sahabat qolbu",
    "travel umroh bogor",
    "travel umroh cileungsi",
    "umroh ramadhan",
    "biaya umroh",
    "daftar umroh",
  ],
  authors: [
    {
      name: "Sahabat Qolbu",
      url: "https://sahabatqolbu.com",
    },
  ],
};

export function generateMetadata(page?: {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}): Metadata {
  const title = page?.title
    ? `${page.title} | ${siteConfig.name}`
    : `Sahabat Qolbu | Travel Umroh Sunnah Resmi`;

  const description = page?.description || siteConfig.description;
  const keywords = page?.keywords || siteConfig.keywords;
  const ogImage = page?.ogImage || siteConfig.ogImage;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords,
    authors: siteConfig.authors,
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@sahabatqolbu",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    manifest: "/site.webmanifest",
    verification: {
      google: "adb578ae3708098e",
    },
  };
}

export { siteConfig };

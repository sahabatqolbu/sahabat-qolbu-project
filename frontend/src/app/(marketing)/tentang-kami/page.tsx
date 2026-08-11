import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";
import { getPublicCompanyProfile } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Tentang Sahabat Qolbu",
  description:
    "Kenali Sahabat Qolbu, travel umroh Sunnah berizin resmi yang melayani jamaah dari seluruh Indonesia, lengkap dengan visi, misi, legalitas, dan lokasi kantor.",
  alternates: { canonical: "/tentang-kami" },
};

export default async function AboutPage() {
  const profile = await getPublicCompanyProfile();
  return <AboutPageClient profile={profile} />;
}

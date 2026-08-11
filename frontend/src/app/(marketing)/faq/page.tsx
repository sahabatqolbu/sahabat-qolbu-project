import type { Metadata } from "next";
import FaqPageClient from "./FaqPageClient";
import { getPublicFaqs } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "FAQ Umroh Sahabat Qolbu",
  description:
    "Temukan jawaban tentang pendaftaran umroh, dokumen, paspor, vaksin, pembayaran, dan persiapan perjalanan bersama Sahabat Qolbu.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getPublicFaqs();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqPageClient initialFaqs={faqs} />
    </>
  );
}

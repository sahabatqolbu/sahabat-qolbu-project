import type { Metadata } from "next";
import FaqExplorer from "@/components/sq/FaqExplorer";
import { WaLink } from "@/components/sq/chrome";
import { IconWa } from "@/components/sq/icons";
import { PageHead } from "@/components/sq/ui";
import { getActiveBanks, getPublicCompanyProfile, getPublicFaqs } from "@/lib/public-api";
import { safeJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "FAQ Umroh Sahabat Qolbu",
  description:
    "Jawaban tentang pendaftaran umroh, dokumen, paspor, vaksin meningitis, pembayaran, dan kontak resmi Sahabat Qolbu.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [faqs, banks, company] = await Promise.all([getPublicFaqs(), getActiveBanks(), getPublicCompanyProfile()]);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const aside = (
    <aside className="sticky" style={{ display: "grid", gap: 20 }}>
      <div className="help" style={{ marginTop: 0 }}>
        <h3>Kontak resmi</h3>
        <p>Sahabat Qolbu tidak pernah meminta transfer lewat nomor selain kontak resmi.</p>
        <dl>
          {company?.whatsapp ? <div><dt>WhatsApp</dt><dd>{company.whatsapp}</dd></div> : null}
          {company?.email ? <div><dt>Email</dt><dd style={{ overflowWrap: "anywhere" }}>{company.email}</dd></div> : null}
        </dl>
        <WaLink className="btn btn-gold" message="Assalamualaikum, saya punya pertanyaan tentang umroh">
          <IconWa />Tanya admin di WhatsApp
        </WaLink>
      </div>
      {banks.length ? (
        <div className="panel">
          <h3>Rekening resmi</h3>
          <dl className="kv">
            {banks.map((bank) => (
              <div key={bank.id}><dt>{bank.bankName}</dt><dd>{bank.accountNumber}</dd></div>
            ))}
          </dl>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 10 }}>Atas nama {banks[0].accountName}.</p>
        </div>
      ) : null}
    </aside>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <PageHead
        crumbs={[{ href: "/", label: "Beranda" }, { label: "FAQ" }]}
        title="Ada yang ingin ditanyakan?"
        lead="Jawaban seputar pendaftaran, paspor, vaksin, dan pembayaran umroh di Sahabat Qolbu."
      />
      <FaqExplorer faqs={faqs} aside={aside} />
    </>
  );
}

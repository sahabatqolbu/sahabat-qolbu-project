"use client";

import { useMemo, useState } from "react";
import type { PublicFaq } from "@/lib/public-api";

const categoryLabels: Record<string, string> = {
  GENERAL: "Umum",
  UMRAH: "Pendaftaran & Persiapan",
  PAYMENT: "Pembayaran",
};

const renderAnswer = (answer: string) =>
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
          className="break-all font-semibold text-primary underline decoration-gold/60 underline-offset-4 hover:text-gold sm:break-words"
        >
          {href}
        </a>
        {suffix}
      </span>
    );
  });

export default function FaqPageClient({
  initialFaqs,
}: {
  initialFaqs: PublicFaq[];
}) {
  const faqs = initialFaqs;
  const firstCategory = faqs.find((item) => item.category)?.category || "";
  const [activeCategory, setActiveCategory] = useState(firstCategory);
  const [openId, setOpenId] = useState<number | null>(
    faqs.find((item) => item.category === firstCategory)?.id || null,
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          faqs
            .map((faq) => faq.category?.trim())
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    [faqs],
  );
  const visibleFaqs = activeCategory
    ? faqs.filter((faq) => faq.category === activeCategory)
    : faqs;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 text-gray-800">
      <section className="bg-primary py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-gold">
            FAQ Umroh
          </span>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Pertanyaan yang Sering Ditanyakan
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-200">
            Informasi pendaftaran, dokumen, paspor, vaksin, pembayaran, dan
            persiapan perjalanan dalam satu halaman.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {faqs.length === 0 ? (
            <div className="border border-dashed border-gray-200 bg-white p-10 text-center">
              FAQ belum tersedia.
            </div>
          ) : (
            <>
              {categories.length ? (
                <div className="mb-8 flex flex-wrap justify-center gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setOpenId(
                          faqs.find((faq) => faq.category === category)?.id ||
                            null,
                        );
                      }}
                      className={`border px-4 py-2 text-sm font-bold transition ${
                        activeCategory === category
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 bg-white text-primary hover:border-gold"
                      }`}
                    >
                      {categoryLabels[category] || category}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-3">
                {visibleFaqs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <article
                      key={faq.id}
                      className={`border bg-white shadow-sm transition ${
                        isOpen ? "border-gold/60" : "border-gray-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-primary"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.question}</span>
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/5 transition ${
                            isOpen ? "rotate-45 bg-primary text-white" : ""
                          }`}
                        >
                          +
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-gold/20 px-5 pb-5 pt-4">
                          <div className="whitespace-pre-line break-words leading-7 text-gray-600 [overflow-wrap:anywhere]">
                            {renderAnswer(faq.answer)}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

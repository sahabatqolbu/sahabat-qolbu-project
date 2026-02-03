"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Apa saja syarat untuk mendaftar umroh?",
    answer:
      "Syarat umroh meliputi: Paspor yang masih berlaku minimal 6 bulan, KTP, Kartu Keluarga, foto 4x6 berlatar putih, buku kuning (vaksin meningitis), dan untuk wanita di bawah 45 tahun harus didampingi mahram.",
  },
  {
    question: "Berapa lama proses pendaftaran hingga keberangkatan?",
    answer:
      "Proses pendaftaran hingga keberangkatan biasanya memakan waktu 1-3 bulan, tergantung ketersediaan visa dan jadwal keberangkatan. Kami rekomendasikan mendaftar minimal 2 bulan sebelum tanggal keberangkatan yang diinginkan.",
  },
  {
    question: "Apakah harga paket sudah termasuk visa?",
    answer:
      "Ya, harga paket yang tertera sudah termasuk biaya visa umroh, tiket pesawat PP, akomodasi hotel, makan 3x sehari, transportasi, perlengkapan umroh, dan bimbingan ibadah. Yang belum termasuk adalah biaya pengurusan paspor.",
  },
  {
    question: "Bagaimana sistem pembayaran paket umroh?",
    answer:
      "Kami menyediakan sistem pembayaran yang fleksibel. Anda bisa membayar secara cash/tunai, transfer bank, atau cicilan. Untuk cicilan, DP minimal 30% dan sisanya bisa diangsur hingga H-30 sebelum keberangkatan.",
  },
  {
    question: "Apa yang membedakan Sahabat Qolbu dengan travel umroh lainnya?",
    answer:
      "Sahabat Qolbu telah berpengalaman sejak 2010 dengan 5000+ jamaah terlayani, memiliki izin resmi Kemenag, hotel dekat Masjidil Haram, pembimbing berpengalaman dan bersertifikat, harga transparan, dan pelayanan 24/7. Rating kepuasan kami 4.9/5.",
  },
  {
    question: "Apakah ada pendampingan selama di tanah suci?",
    answer:
      "Tentu! Setiap grup akan didampingi oleh pembimbing ibadah yang berpengalaman dan berbahasa Arab. Tim kami akan membantu Anda mulai dari kedatangan di bandara hingga kepulangan, termasuk bimbingan manasik dan ziarah.",
  },
  {
    question: "Bagaimana jika ada pembatalan keberangkatan?",
    answer:
      "Kebijakan pembatalan mengikuti ketentuan yang berlaku. Pembatalan dari pihak jamaah akan dikenakan biaya administrasi sesuai dengan waktu pembatalan. Untuk detail lengkap, silakan hubungi customer service kami.",
  },
  {
    question: "Apakah tersedia paket untuk keluarga?",
    answer:
      "Ya, kami menyediakan paket khusus keluarga dengan harga yang lebih terjangkau. Anda bisa memilih tipe kamar quad (4 orang) atau triple (3 orang) untuk mendapatkan harga terbaik.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 md:py-28 section-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-secondary/10 px-6 py-3 rounded-full mb-6 border-2 border-secondary/20">
              <HelpCircle className="w-5 h-5 text-secondary" />
              <span className="text-primary font-bold text-sm">FAQ</span>
            </div>

            <h2 className="heading-section mb-6">
              Pertanyaan yang Sering Ditanyakan
            </h2>

            <p className="text-body-large text-neutral-600">
              Temukan jawaban untuk pertanyaan umum seputar paket umroh kami
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4 mb-12">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={cn(
                  "bg-white rounded-2xl border-3 overflow-hidden transition-all duration-300",
                  openIndex === index
                    ? "border-secondary shadow-xl"
                    : "border-neutral-200 hover:border-neutral-300 shadow-md"
                )}
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 md:px-8 py-6 flex items-center justify-between gap-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-bold text-base md:text-lg text-primary pr-4 flex-1">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                      openIndex === index && "bg-secondary rotate-180"
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 transition-colors",
                        openIndex === index ? "text-primary" : "text-secondary"
                      )}
                    />
                  </div>
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openIndex === index ? "max-h-96" : "max-h-0"
                  )}
                >
                  <div className="px-6 md:px-8 pb-6 text-neutral-700 leading-relaxed font-medium">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-8 md:p-12 text-center border-4 border-secondary/30 shadow-2xl">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>

            <h3 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Masih Ada Pertanyaan?
            </h3>

            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto font-medium">
              Tim customer service kami siap membantu Anda dengan senang hati
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/6282121453311?text=Assalamualaikum,%20saya%20punya%20pertanyaan%20tentang%20paket%20umroh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-secondary hover:bg-secondary-600 text-primary font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <MessageCircle className="w-6 h-6" />
                <span>Chat WhatsApp</span>
              </a>

              <a
                href="tel:+622122866671"
                className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white hover:text-primary backdrop-blur-sm text-white font-bold text-lg px-8 py-4 rounded-2xl border-3 border-white/40 hover:border-white transition-all duration-300"
              >
                <Phone className="w-6 h-6" />
                <span>021-22866671</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

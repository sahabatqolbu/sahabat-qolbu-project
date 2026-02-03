"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  Users,
  MessageSquare,
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  package: string;
  participants: string;
  departureMonth: string;
  additionalInfo: string;
}

const packages = [
  "Umroh Ramadhan 2024",
  "Umroh Plus Turki",
  "Umroh Reguler 9 Hari",
  "Umroh Desember 2024",
  "Belum Tahu (Konsultasi Dulu)",
];

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    package: "",
    participants: "1",
    departureMonth: "",
    additionalInfo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const message = `
*PENDAFTARAN PAKET UMROH*
━━━━━━━━━━━━━━━━━━━━

👤 *Nama:* ${formData.name}
📧 *Email:* ${formData.email}
📱 *No. HP:* ${formData.phone}
📦 *Paket:* ${formData.package}
👥 *Jumlah Peserta:* ${formData.participants} orang
📅 *Bulan Keberangkatan:* ${formData.departureMonth}

💬 *Info Tambahan:*
${formData.additionalInfo || "-"}

━━━━━━━━━━━━━━━━━━━━
_Mohon dibantu untuk proses pendaftarannya. Terima kasih._
    `.trim();

    const whatsappURL = `https://wa.me/6282121453311?text=${encodeURIComponent(
      message
    )}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      window.open(whatsappURL, "_blank");

      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          package: "",
          participants: "1",
          departureMonth: "",
          additionalInfo: "",
        });
      }, 2000);
    }, 1000);
  };

  return (
    <section className="py-20 md:py-28 section-secondary" id="registration">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full mb-6 border-3 border-secondary/30 shadow-lg">
              <Send className="w-5 h-5 text-secondary" />
              <span className="text-primary font-bold text-sm">
                Daftar Sekarang
              </span>
            </div>

            <h2 className="heading-section mb-6">
              Form Pendaftaran Paket Umroh
            </h2>

            <p className="text-body-large text-neutral-600 max-w-2xl mx-auto">
              Isi formulir di bawah untuk memulai pendaftaran. Tim kami akan
              menghubungi Anda via WhatsApp
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-white overflow-hidden">
            {isSuccess ? (
              // Success State
              <div className="text-center py-20 px-8">
                <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
                <h3 className="font-display font-bold text-3xl text-primary mb-4">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-neutral-600 text-lg font-medium">
                  Anda akan dialihkan ke WhatsApp untuk melanjutkan proses
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 md:p-12">
                <div className="space-y-6">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="flex items-center gap-2 text-primary font-bold mb-3">
                      <User className="w-5 h-5 text-secondary" />
                      Nama Lengkap <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-primary font-bold mb-3">
                        <Mail className="w-5 h-5 text-secondary" />
                        Email <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                        placeholder="nama@email.com"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-primary font-bold mb-3">
                        <Phone className="w-5 h-5 text-secondary" />
                        WhatsApp <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                        placeholder="08123456789"
                      />
                    </div>
                  </div>

                  {/* Paket & Peserta */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-primary font-bold mb-3">
                        <Package className="w-5 h-5 text-secondary" />
                        Paket Diminati <span className="text-error">*</span>
                      </label>
                      <select
                        name="package"
                        value={formData.package}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                      >
                        <option value="">Pilih Paket</option>
                        {packages.map((pkg) => (
                          <option key={pkg} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-primary font-bold mb-3">
                        <Users className="w-5 h-5 text-secondary" />
                        Jumlah Peserta
                      </label>
                      <select
                        name="participants"
                        value={formData.participants}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} Orang
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bulan Keberangkatan */}
                  <div>
                    <label className="flex items-center gap-2 text-primary font-bold mb-3">
                      <Calendar className="w-5 h-5 text-secondary" />
                      Bulan Keberangkatan <span className="text-error">*</span>
                    </label>
                    <select
                      name="departureMonth"
                      value={formData.departureMonth}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary"
                    >
                      <option value="">Pilih Bulan</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month} 2024
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Info Tambahan */}
                  <div>
                    <label className="flex items-center gap-2 text-primary font-bold mb-3">
                      <MessageSquare className="w-5 h-5 text-secondary" />
                      Informasi Tambahan
                    </label>
                    <textarea
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-5 py-4 bg-neutral-50 border-3 border-neutral-200 rounded-2xl focus:border-secondary focus:ring-4 focus:ring-secondary/20 transition-all outline-none font-semibold text-primary resize-none"
                      placeholder="Pertanyaan khusus, permintaan khusus, atau informasi lain..."
                    />
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-primary/5 px-6 py-4 rounded-2xl border-2 border-primary/10">
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                      <strong className="text-primary">Catatan:</strong> Data
                      Anda akan kami gunakan untuk keperluan pendaftaran dan
                      komunikasi terkait paket umroh. Kami menjaga kerahasiaan
                      data pribadi Anda.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-secondary hover:bg-secondary-600 disabled:bg-neutral-300 text-primary font-black text-lg px-8 py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-3 border-3 border-secondary-700 disabled:border-neutral-400"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        <span>Kirim Pendaftaran via WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

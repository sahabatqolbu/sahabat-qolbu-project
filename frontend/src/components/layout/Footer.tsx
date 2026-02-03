import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  Send,
  ArrowRight,
  CheckCircle2,
  Award,
  Shield,
} from "lucide-react";

const footerLinks = {
  company: [
    { name: "Tentang Kami", href: "/about" },
    { name: "Visi & Misi", href: "/about#vision" },
    { name: "Tim Kami", href: "/about#team" },
    { name: "Karir", href: "/career" },
  ],
  services: [
    { name: "Paket Umroh Reguler", href: "/packages?type=regular" },
    { name: "Umroh Ramadhan", href: "/packages?type=ramadhan" },
    { name: "Umroh Plus", href: "/packages?type=plus" },
    { name: "Program Itikaf", href: "/itikaf" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Syarat & Ketentuan", href: "/terms" },
    { name: "Kebijakan Privasi", href: "/privacy" },
    { name: "Hubungi Kami", href: "/contact" },
  ],
};

const socialMedia = [
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://facebook.com/sahabatqolbu",
    color: "hover:bg-blue-600",
  },
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://instagram.com/sahabatqolbu",
    color: "hover:bg-pink-600",
  },
  {
    name: "YouTube",
    icon: Youtube,
    href: "https://youtube.com/@sahabatqolbu",
    color: "hover:bg-red-600",
  },
];

const certifications = [
  { icon: Shield, text: "Izin Kemenag RI", number: "No. PPIU 123/2010" },
  { icon: Award, text: "IATA Certified", number: "ID-12345" },
  { icon: CheckCircle2, text: "ASITA Member", number: "#A-001" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white">
      {/* Main Footer */}
      <div className="container-custom py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          {/* Company Info - Span 4 cols */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 mb-6 group"
            >
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <span className="text-primary font-display font-black text-2xl">
                  SQ
                </span>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-white">
                  Sahabat Qolbu
                </div>
                <div className="text-sm text-white/70 font-semibold">
                  Cahaya Baitullah
                </div>
              </div>
            </Link>

            <p className="text-white/80 mb-6 leading-relaxed font-medium">
              Mitra terpercaya perjalanan ibadah umroh Anda sejak 2010. Melayani
              dengan sepenuh hati, profesional, dan amanah.
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              <a
                href="https://wa.me/6282121453311"
                className="flex items-start gap-3 text-white/90 hover:text-secondary transition-colors group"
              >
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-0.5">
                    WhatsApp
                  </div>
                  <div className="font-bold">0821-2145-3311</div>
                </div>
              </a>

              <a
                href="tel:+622122866671"
                className="flex items-start gap-3 text-white/90 hover:text-secondary transition-colors group"
              >
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-0.5">
                    Telepon
                  </div>
                  <div className="font-bold">021-22866671</div>
                </div>
              </a>

              <a
                href="mailto:admin@sahabatqolbu.com"
                className="flex items-start gap-3 text-white/90 hover:text-secondary transition-colors group"
              >
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-0.5">
                    Email
                  </div>
                  <div className="font-bold">admin@sahabatqolbu.com</div>
                </div>
              </a>

              <div className="flex items-start gap-3 text-white/90">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-0.5">
                    Alamat Kantor
                  </div>
                  <div className="font-bold leading-relaxed">
                    Ruko Taman Permata Buana
                    <br />
                    Blok C No. 7, Jakarta Barat
                    <br />
                    DKI Jakarta 11740
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-white/90">
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/60 font-semibold mb-0.5">
                    Jam Operasional
                  </div>
                  <div className="font-bold">
                    Senin - Sabtu: 09:00 - 17:00
                    <br />
                    Minggu: Tutup
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links - Span 8 cols */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-8">
            {/* Perusahaan */}
            <div>
              <h3 className="font-display font-bold text-xl text-secondary mb-6">
                Perusahaan
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-secondary transition-colors inline-flex items-center gap-2 group font-medium"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Layanan */}
            <div>
              <h3 className="font-display font-bold text-xl text-secondary mb-6">
                Layanan
              </h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-secondary transition-colors inline-flex items-center gap-2 group font-medium"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bantuan */}
            <div>
              <h3 className="font-display font-bold text-xl text-secondary mb-6">
                Bantuan
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-secondary transition-colors inline-flex items-center gap-2 group font-medium"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20 mb-12">
          <h4 className="font-display font-bold text-2xl text-secondary mb-6 text-center">
            Sertifikasi & Izin Resmi
          </h4>
          <div className="grid sm:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <cert.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-white mb-1">{cert.text}</div>
                  <div className="text-xs text-white/70 font-semibold">
                    {cert.number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div className="text-center">
          <h4 className="font-bold text-secondary mb-6">
            Ikuti Kami di Social Media
          </h4>
          <div className="flex justify-center gap-4 mb-8">
            {socialMedia.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white hover:text-white transition-all duration-300 hover:scale-110 ${social.color} border-2 border-white/20 hover:border-transparent`}
                aria-label={social.name}
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-primary-900">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <div className="text-center md:text-left font-medium">
              © {currentYear} Sahabat Qolbu Cahaya Baitullah. All rights
              reserved.
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-secondary transition-colors font-semibold"
              >
                Syarat & Ketentuan
              </Link>
              <span className="text-white/30">|</span>
              <Link
                href="/privacy"
                className="hover:text-secondary transition-colors font-semibold"
              >
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Float Button */}
      <a
        href="https://wa.me/6282121453311?text=Assalamualaikum,%20saya%20ingin%20konsultasi%20paket%20umroh"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-success hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 group"
        aria-label="Chat WhatsApp"
      >
        <Send className="w-7 h-7 group-hover:scale-110 transition-transform" />

        {/* Pulse Animation */}
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
      </a>
    </footer>
  );
}

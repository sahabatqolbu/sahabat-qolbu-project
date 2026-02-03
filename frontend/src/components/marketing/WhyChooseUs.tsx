import {
  Shield,
  Award,
  Users,
  Heart,
  Clock,
  ThumbsUp,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Berizin Resmi Kemenag RI",
    description:
      "Terdaftar dan memiliki izin operasional resmi dari Kementerian Agama Republik Indonesia",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    icon: Award,
    title: "Berpengalaman Sejak 2010",
    description:
      "Lebih dari 14 tahun melayani ribuan jamaah dengan profesional dan penuh amanah",
    gradient: "from-secondary to-secondary-600",
  },
  {
    icon: Users,
    title: "5000+ Jamaah Terlayani",
    description:
      "Kepercayaan ribuan jamaah dari seluruh Indonesia adalah kebanggaan kami",
    gradient: "from-success to-green-600",
  },
  {
    icon: Heart,
    title: "Pelayanan Sepenuh Hati",
    description:
      "Tim profesional siap melayani dengan sepenuh hati dari pendaftaran hingga kepulangan",
    gradient: "from-error to-red-600",
  },
  {
    icon: Clock,
    title: "Harga Transparan",
    description:
      "Tidak ada biaya tersembunyi, semua fasilitas dan biaya dijelaskan secara detail",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    icon: ThumbsUp,
    title: "Rating Kepuasan 4.9/5",
    description:
      "Kepuasan jamaah adalah prioritas utama, terbukti dari rating dan testimoni positif",
    gradient: "from-primary to-primary-600",
  },
];

const certifications = [
  { name: "Kementerian Agama RI", number: "PPIU 123/2010" },
  { name: "IATA Certified", number: "ID-12345" },
  { name: "ASITA Member", number: "Member #A-001" },
  { name: "ISO 9001:2015", number: "Quality Management" },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 md:py-28 section-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full mb-6 border-2 border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-primary font-bold text-sm">
              Keunggulan Kami
            </span>
          </div>

          <h2 className="heading-section mb-6">
            Mengapa Memilih Sahabat Qolbu?
          </h2>

          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Komitmen kami adalah memberikan pengalaman ibadah yang berkah,
            nyaman, dan tak terlupakan bagi setiap jamaah
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white rounded-3xl p-8 border-4 border-neutral-100 hover:border-secondary shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="font-display font-bold text-xl text-primary mb-3 group-hover:text-secondary transition-colors">
                {feature.title}
              </h3>

              <p className="text-neutral-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Certifications Section */}
        <div className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-8 md:p-12 border-4 border-secondary/30 shadow-2xl">
          <div className="text-center mb-10">
            <h3 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Sertifikasi & Izin Resmi
            </h3>
            <p className="text-white/80 text-lg font-medium max-w-2xl mx-auto">
              Terdaftar dan tersertifikasi oleh berbagai lembaga resmi nasional
              dan internasional
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20 hover:bg-white/20 hover:border-secondary transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">{cert.name}</div>
                    <div className="text-xs text-white/70 font-semibold">
                      {cert.number}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

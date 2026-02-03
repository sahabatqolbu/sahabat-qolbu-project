import {
  GraduationCap,
  Languages,
  Award,
  BookOpen,
  MapPin,
  CheckCircle2,
} from "lucide-react";

const muthowwifs = [
  {
    name: "Ustadz H. Ahmad Mujahid, Lc",
    title: "Ketua Pembimbing",
    experience: "15 Tahun",
    specialization: "Fiqih Ibadah & Manasik Haji",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    education: "Universitas Al-Azhar, Mesir",
    certificates: ["Kemenag RI", "Al-Azhar University"],
    languages: ["Indonesia", "Arab", "Inggris"],
  },
  {
    name: "Ustadz Muhammad Ridwan, S.Ag",
    title: "Pembimbing Senior",
    experience: "12 Tahun",
    specialization: "Sejarah Islam & Ziarah",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    education: "Universitas Islam Madinah",
    certificates: ["Kemenag RI", "Madinah University"],
    languages: ["Indonesia", "Arab"],
  },
  {
    name: "Ustadzah Fatimah Zahra, M.Pd.I",
    title: "Pembimbing Wanita",
    experience: "10 Tahun",
    specialization: "Bimbingan Jamaah Wanita",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    education: "UIN Syarif Hidayatullah Jakarta",
    certificates: ["Kemenag RI", "UIN Jakarta"],
    languages: ["Indonesia", "Arab"],
  },
  {
    name: "Ustadz Yusuf Mansur, S.Th.I",
    title: "Pembimbing",
    experience: "8 Tahun",
    specialization: "Kesehatan & Manajemen Perjalanan",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    education: "IAIN Sunan Ampel Surabaya",
    certificates: ["Kemenag RI", "IAIN Surabaya"],
    languages: ["Indonesia", "Arab", "Melayu"],
  },
];

const teamFeatures = [
  {
    icon: GraduationCap,
    title: "Bersertifikat Resmi",
    description:
      "Semua pembimbing memiliki sertifikat dari Kementerian Agama RI",
  },
  {
    icon: Languages,
    title: "Mahir Bahasa Arab",
    description: "Fasih berbahasa Arab untuk komunikasi di Tanah Suci",
  },
  {
    icon: Award,
    title: "Berpengalaman",
    description: "Minimal 8 tahun pengalaman membimbing ribuan jamaah",
  },
  {
    icon: BookOpen,
    title: "Berkompeten",
    description: "Lulusan universitas ternama di bidang studi Islam",
  },
];

export default function Muthowwif() {
  return (
    <section className="py-20 md:py-28 section-light">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full mb-6 border-2 border-primary/20">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-primary font-bold text-sm">
              Tim Pembimbing
            </span>
          </div>

          <h2 className="heading-section mb-6">
            Muthowwif Profesional & Bersertifikat
          </h2>

          <p className="text-body-large text-neutral-600 max-w-3xl mx-auto">
            Dipandu oleh tim pembimbing yang berpengalaman, bersertifikat resmi,
            dan siap melayani dengan sepenuh hati
          </p>
        </div>

        {/* Muthowwif Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {muthowwifs.map((muthowwif, index) => (
            <div
              key={index}
              className="group bg-white rounded-3xl overflow-hidden border-4 border-neutral-100 hover:border-secondary shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Photo */}
              <div className="relative h-72 overflow-hidden bg-neutral-200">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700"
                  style={{ backgroundImage: `url(${muthowwif.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-60" />

                {/* Experience Badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-secondary px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-primary font-black text-sm">
                      {muthowwif.experience} Pengalaman
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-primary mb-1 group-hover:text-secondary transition-colors">
                    {muthowwif.name}
                  </h3>
                  <p className="text-sm text-neutral-600 font-semibold">
                    {muthowwif.title}
                  </p>
                </div>

                {/* Specialization */}
                <div className="bg-primary/5 px-4 py-3 rounded-xl border-2 border-primary/10">
                  <p className="text-xs font-bold text-primary mb-1">
                    Spesialisasi
                  </p>
                  <p className="text-sm font-semibold text-neutral-700">
                    {muthowwif.specialization}
                  </p>
                </div>

                {/* Education */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-neutral-600">
                    {muthowwif.education}
                  </p>
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold text-primary">
                      Bahasa
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {muthowwif.languages.map((lang, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg font-semibold"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certificates */}
                <div className="pt-4 border-t-2 border-neutral-100">
                  <p className="text-xs font-bold text-neutral-500 mb-2">
                    Sertifikasi
                  </p>
                  <div className="space-y-2">
                    {muthowwif.certificates.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-xs font-semibold text-neutral-700">
                          {cert}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Team Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border-3 border-primary/10 hover:border-secondary hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-bold text-primary mb-2 text-lg">
                {feature.title}
              </h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

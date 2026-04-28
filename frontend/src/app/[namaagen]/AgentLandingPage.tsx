import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Star,
  Users,
  Video,
} from "lucide-react";
import type { PublicAgentLanding } from "@/lib/public-api";

interface Props {
  landing: PublicAgentLanding;
}

const buildSocialHref = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
};

const buildEmailHref = (value?: string | null) => {
  if (!value) return null;
  return value.startsWith("mailto:") ? value : `mailto:${value}`;
};

const socialLinks = (landing: PublicAgentLanding) => [
  {
    label: "Instagram",
    href: buildSocialHref(landing.socials.instagram),
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: buildSocialHref(landing.socials.facebook),
    icon: Facebook,
  },
  {
    label: "TikTok",
    href: buildSocialHref(landing.socials.tiktok),
    icon: Video,
  },
  {
    label: "YouTube",
    href: buildSocialHref(landing.socials.youtube),
    icon: Video,
  },
].filter((item): item is { label: string; href: string; icon: typeof Instagram } => Boolean(item.href));

export default function AgentLandingPage({ landing }: Props) {
  const agentName = landing.agent.nickname || landing.agent.fullName;
  const primaryColor = landing.agent.landingPrimaryColor || "#0F4C81";
  const accentColor = landing.agent.landingAccentColor || "#F4B400";
  const socialItems = socialLinks(landing);
  const emailHref = buildEmailHref(landing.cta.email);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute -left-24 top-12 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: accentColor }}
          />
          <div
            className="absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        <div className="container-custom relative z-10 px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                Landing Agen Resmi Sahabat Qolbu
              </p>
              <h1 className="mb-4 font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {agentName}
              </h1>
              <p className="mb-6 max-w-2xl text-lg text-white/80">
                Agen resmi Sahabat Qolbu yang siap membantu konsultasi paket
                umroh, pilihan keberangkatan, dan kebutuhan perjalanan ibadah Anda.
              </p>

              <div className="mb-8 flex flex-wrap gap-3">
                {landing.agent.currentLevel?.name && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                    <Award className="h-4 w-4" />
                    {landing.agent.currentLevel.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  <Star className="h-4 w-4" />
                  {landing.agent.currentStar} Bintang
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  <Users className="h-4 w-4" />
                  {landing.agent.totalJamaah} Jamaah
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/packages"
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-4 font-bold text-primary shadow-xl transition-transform hover:scale-105"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>Lihat Paket Umroh</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {emailHref && (
                  <a
                    href={emailHref}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-4 font-bold backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <Mail className="h-5 w-5" />
                    <span>Hubungi via Email</span>
                  </a>
                )}
              </div>
            </div>

            <div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                <div className="mb-6 flex items-center gap-4">
                  {landing.agent.profilePhoto ? (
                    <div
                      className="h-24 w-24 rounded-3xl bg-cover bg-center ring-4 ring-white/20"
                      style={{ backgroundImage: `url(${landing.agent.profilePhoto})` }}
                    />
                  ) : (
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-3xl text-3xl font-black text-primary"
                      style={{ backgroundColor: accentColor }}
                    >
                      {agentName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      <BadgeCheck className="h-4 w-4" />
                      Agen Terverifikasi
                    </div>
                    <h2 className="text-2xl font-bold">{landing.agent.fullName}</h2>
                    {(landing.agent.city || landing.agent.province) && (
                      <p className="mt-2 flex items-center gap-2 text-white/75">
                        <MapPin className="h-4 w-4" />
                        {[landing.agent.city, landing.agent.province]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {landing.agent.landingLogo && (
                  <div className="mb-6 rounded-2xl bg-white/90 p-4">
                    <div
                      aria-label={`Logo ${agentName}`}
                      role="img"
                      className="h-16 max-w-full bg-contain bg-left bg-no-repeat"
                      style={{ backgroundImage: `url(${landing.agent.landingLogo})` }}
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Total Closing</p>
                    <p className="mt-1 text-3xl font-black">{landing.agent.totalClosing}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Total Jamaah</p>
                    <p className="mt-1 text-3xl font-black">{landing.agent.totalJamaah}</p>
                  </div>
                </div>

                {socialItems.length > 0 && (
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <p className="mb-3 text-sm font-semibold text-white/70">
                      Temukan agen ini di sosial media
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {socialItems.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/20"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { BadgeCheck, Plane, ShieldCheck, Star, Users } from "lucide-react";

type Item = {
  icon: typeof Star;
  title: string;
  description: string;
};

const items: Item[] = [
  {
    icon: BadgeCheck,
    title: "Resmi Kemenag",
    description: "PPIU terdaftar",
  },
  {
    icon: Plane,
    title: "Direct Flight",
    description: "Tanpa transit",
  },
  {
    icon: Star,
    title: "Hotel Bintang",
    description: "Dekat masjid",
  },
  {
    icon: Users,
    title: "Muthawif",
    description: "Berpengalaman",
  },
];

export function LandingTrustBar() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur md:grid-cols-4">
      {items.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3"
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{title}</p>
            <p className="truncate text-xs text-white/70">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingTrustStrip() {
  return (
    <div className="border-y-2 border-neutral-100 bg-white py-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <ShieldCheck className="h-5 w-5 text-success" />
          <span>Izin PPIU 12112100038690008</span>
        </div>
        <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <BadgeCheck className="h-5 w-5 text-secondary" />
          <span>Resmi Kemenag RI</span>
        </div>
        <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <Users className="h-5 w-5 text-primary" />
          <span>Ratusan Jamaah Puas</span>
        </div>
      </div>
    </div>
  );
}
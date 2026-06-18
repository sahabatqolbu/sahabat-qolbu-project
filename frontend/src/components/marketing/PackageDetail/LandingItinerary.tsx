import { MapPin, Sparkles } from "lucide-react";
import type { MarketingPackage } from "@/lib/public-api";

type Props = {
  pkg: MarketingPackage;
};

export function LandingItinerary({ pkg }: Props) {
  const itinerary = pkg.itinerary ?? [];

  if (!itinerary.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border-2 border-neutral-100 bg-white shadow-2xl shadow-primary/10">
      <div className="flex flex-col gap-3 border-b-2 border-neutral-100 bg-gradient-to-r from-primary to-primary-700 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary shadow-lg shadow-secondary/40">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              Susunan Perjalanan
            </p>
            <h2 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
              Itinerary {pkg.duration || itinerary.length} Hari
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
          {itinerary.length} Hari Tersusun
        </span>
      </div>

      <div className="relative p-5 sm:p-8">
        <div className="absolute left-9 top-8 bottom-8 hidden w-0.5 bg-gradient-to-b from-secondary via-secondary/60 to-transparent sm:block" />
        <ol className="space-y-5">
          {itinerary.map((item, index) => (
            <li
              key={`${item.day}-${index}`}
              className="relative flex gap-4 sm:gap-6"
            >
              <div className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-base font-black text-secondary shadow-lg shadow-primary/30 ring-4 ring-white">
                {item.day}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border-2 border-neutral-100 bg-neutral-50/60 p-4 transition hover:border-secondary hover:bg-white sm:p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    Hari {item.day}
                  </span>
                  <h3 className="font-display text-lg font-black text-primary">
                    {item.title}
                  </h3>
                </div>
                {item.activities.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {item.activities.map((activity, actIndex) => (
                      <li
                        key={`${activity}-${actIndex}`}
                        className="flex items-start gap-2 text-sm font-medium leading-relaxed text-neutral-700"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 flex-none text-secondary" />
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
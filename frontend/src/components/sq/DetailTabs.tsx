"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type DetailTab = { id: string; label: string; content: ReactNode };

/** Tab isi detail paket. Bisa dibuka lewat link #id, misalnya tombol "Lihat itinerary". */
export default function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id || "");
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "");
      if (tabs.some((t) => t.id === id)) {
        setActive(id);
        top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const pick = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    const rect = top.current?.getBoundingClientRect();
    if (rect && rect.top < 80) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="dtabs" ref={top}>
      <div className="dtab-bar" role="tablist" aria-label="Isi detail paket">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => pick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${t.id}`}
          hidden={active !== t.id}
          className="panel dpanel"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

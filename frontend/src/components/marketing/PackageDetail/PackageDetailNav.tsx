"use client";

import { useEffect, useMemo, useState } from "react";

type PackageDetailNavProps = {
  items: {
    id: string;
    label: string;
  }[];
};

export default function PackageDetailNav({ items }: PackageDetailNavProps) {
  const validIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!items.length) return;

    const getHashId = () => {
      const hashId = window.location.hash.replace("#tab-", "");
      return validIds.has(hashId) ? hashId : "";
    };

    const syncFromScroll = () => {
      const offset = 170;
      const visibleItem = items.reduce((current, item) => {
        const element = document.getElementById(`tab-${item.id}`);
        if (!element) return current;

        const top = element.getBoundingClientRect().top;
        if (top <= offset) {
          return item.id;
        }

        return current;
      }, items[0].id);

      setActiveId(visibleItem);
    };

    const handleHashChange = () => {
      setActiveId(getHashId() || items[0].id);
    };

    handleHashChange();
    window.requestAnimationFrame(syncFromScroll);
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [items, validIds]);

  return (
    <nav className="sticky top-20 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div
        className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8"
        aria-label="Detail paket"
      >
        {items.map(({ id, label }) => {
          const isActive = activeId === id;

          return (
            <a
              href={`#tab-${id}`}
              key={id}
              id={`tab-button-${id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setActiveId(id)}
              className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-extrabold transition first:pl-0 ${
                isActive
                  ? "border-gold text-gold"
                  : "border-transparent text-primary hover:border-gold hover:text-gold"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";

/** Menu bagian yang menempel di atas, menyorot bagian yang sedang dibaca. */
export default function SectionNav({
  items,
  variant = "subnav",
}: {
  items: { id: string; label: string }[];
  variant?: "subnav" | "toc";
}) {
  const [active, setActive] = useState(items[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-35% 0px -55% 0px" },
    );
    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (variant === "toc") {
    return (
      <ul className="toc">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={active === item.id ? "on" : undefined}>{item.label}</a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <nav className="subnav" aria-label="Bagian halaman">
      <div className="wrap">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`} className={active === item.id ? "on" : undefined}>{item.label}</a>
        ))}
      </div>
    </nav>
  );
}

"use client";

import { useState } from "react";
import type { ItineraryDay } from "@/lib/sq-itinerary";
import { IconPrint } from "./icons";

const CITY_COLORS: Record<string, string> = { Madinah: "#0F6B3A", Makkah: "#0A2C45", Pulang: "#7A5800" };

/** Timeline itinerary harian yang bisa disorot per kota dan dicetak. */
export default function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  const [city, setCity] = useState("all");
  const cities = [...new Set(days.map((d) => d.city).filter(Boolean))];
  const ranges = cities.map((c) => {
    const nums = days.filter((d) => d.city === c).map((d) => d.day);
    return { city: c, from: Math.min(...nums), to: Math.max(...nums), count: nums.length };
  });

  return (
    <>
      <div className="panel noprint" style={{ marginBottom: 28 }}>
        <div className="bar">
          <h2 style={{ fontSize: 20 }}>Alur perjalanan</h2>
          <button className="btn btn-line" type="button" style={{ minHeight: 44 }} onClick={() => window.print()}>
            <IconPrint />Cetak itinerary
          </button>
        </div>
        {ranges.length ? (
          <div className="cityband" aria-hidden="true" style={{ gridTemplateColumns: ranges.map((r) => `${r.count}fr`).join(" ") }}>
            {ranges.map((r) => (
              <span key={r.city} style={{ background: CITY_COLORS[r.city] || "#0A2C45" }}>
                {r.city === "Pulang" ? "Pulang" : r.city}, hari {r.from}{r.to !== r.from ? ` sampai ${r.to}` : ""}
              </span>
            ))}
          </div>
        ) : null}
        {cities.length > 1 ? (
          <div className="legend" role="group" aria-label="Sorot kota">
            {["all", ...cities].map((c) => (
              <button key={c} type="button" aria-pressed={city === c} onClick={() => setCity(c)}>
                {c === "all" ? "Semua hari" : c}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        {days.map((d) => (
          <div className={`day${city !== "all" && d.city !== city ? " dim" : ""}`} key={d.day}>
            <div className="dnum"><small>Hari</small><b>{d.day}</b></div>
            <div className="dcard">
              <h3>{d.title}</h3>
              {d.city ? <span className="city">{d.city === "Pulang" ? "Perjalanan pulang" : d.city}</span> : null}
              <ul className="acts-list">
                {d.activities.map((a, i) => (
                  <li key={i}><time>{a.time}</time><span>{a.text}</span></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

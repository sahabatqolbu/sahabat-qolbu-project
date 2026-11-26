/*
 * Merapikan itinerary dari dashboard untuk ditampilkan:
 * - "04.00 — Kumpul di bandara" dipisah menjadi jam dan kegiatan
 * - jam yang tersimpan sebagai baris sendiri digabung dengan baris berikutnya
 * - judul yang tercampur kegiatan ("JUMAT ... 03.00 — ...") dipotong
 */
export type ItineraryActivity = { time: string; text: string };
export type ItineraryDay = {
  day: number;
  title: string;
  city: string;
  activities: ItineraryActivity[];
};

const TIME = /^(\d{1,2}[.:]\d{2})$/;
const TIME_LEAD = /^(\d{1,2}[.:]\d{2})\s*[—–-]+\s*(.+)$/;

const sentence = (value: string) => {
  const lower = value.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const keepProper = (value: string) =>
  value
    .replace(/\bmadinah\b/gi, "Madinah")
    .replace(/\bmakkah\b/gi, "Makkah")
    .replace(/\bjeddah\b/gi, "Jeddah")
    .replace(/\bjakarta\b/gi, "Jakarta")
    .replace(/\bjumat\b/gi, "Jumat");

const cityOf = (title: string) => {
  const upper = title.toUpperCase();
  if (/JAKARTA|INDONESIA|TANAH AIR/.test(upper)) return "Pulang";
  if (/JEDDAH/.test(upper)) return "Pulang";
  if (/MAKKAH|MEKKAH/.test(upper)) return "Makkah";
  if (/MADINAH/.test(upper)) return "Madinah";
  return "";
};

export const normalizeItinerary = (
  items: { day: number; title: string; activities: string[] }[] = [],
): ItineraryDay[] => {
  let lastCity = "";
  return items.map((item, index) => {
    const rawTitle = String(item.title || "").replace(/\s+/g, " ").trim();
    const cut = rawTitle.search(/\s\d{1,2}[.:]\d{2}\s*[—–-]/);
    const title = keepProper(sentence(cut > 0 ? rawTitle.slice(0, cut) : rawTitle)) || `Hari ${index + 1}`;
    const extra = cut > 0 ? [rawTitle.slice(cut).trim()] : [];

    const lines = [...extra, ...(item.activities || [])].map((line) => String(line || "").trim()).filter(Boolean);
    const activities: ItineraryActivity[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const lead = line.match(TIME_LEAD);
      if (lead) {
        activities.push({ time: lead[1].replace(":", "."), text: lead[2].trim() });
      } else if (TIME.test(line) && lines[i + 1] && !TIME.test(lines[i + 1]) && !TIME_LEAD.test(lines[i + 1])) {
        activities.push({ time: line.replace(":", "."), text: lines[i + 1] });
        i += 1;
      } else if (activities.length && !TIME.test(line)) {
        activities.push({ time: "", text: line });
      } else if (!TIME.test(line)) {
        activities.push({ time: "", text: line });
      }
    }

    const city = cityOf(rawTitle) || lastCity;
    if (city) lastCity = city === "Pulang" ? lastCity : city;
    return { day: item.day || index + 1, title, city: city || "", activities };
  });
};

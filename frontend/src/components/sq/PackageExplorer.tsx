"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { MarketingPackage } from "@/lib/public-api";
import { IconSearch } from "./icons";
import { AskCard, PackageCard, TYPE_LABELS, viewPackage } from "./ui";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const monthName = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return `${MONTHS[(month || 1) - 1]} ${year}`;
};

type Filters = { month: string; days: string; airline: string; type: string; q: string; sort: string; sold: boolean };
const EMPTY: Filters = { month: "all", days: "all", airline: "all", type: "all", q: "", sort: "date", sold: false };

export default function PackageExplorer({
  packages,
  mode,
  askTitle = "Belum ada tanggal yang pas?",
  askText = "Ceritakan rencana keluarga Anda. Admin bantu carikan jadwal, maskapai, dan tipe kamar yang sesuai.",
  heading = "",
  lead = "",
  between = null,
}: {
  packages: MarketingPackage[];
  mode: "home" | "full";
  askTitle?: string;
  askText?: string;
  heading?: string;
  lead?: string;
  between?: ReactNode;
}) {
  const params = useSearchParams();
  const initialType = params?.get("tipe") === "ramadhan" ? "RAMADHAN" : "all";
  const views = useMemo(() => packages.map(viewPackage), [packages]);
  const open = useMemo(() => views.filter((v) => v.open), [views]);
  const [draft, setDraft] = useState<Filters>({ ...EMPTY, type: initialType });
  const [applied, setApplied] = useState<Filters>({ ...EMPTY, type: initialType });
  const filters = mode === "full" ? draft : applied;

  const months = useMemo(() => [...new Set(open.map((v) => v.month).filter(Boolean))].sort(), [open]);
  const durations = useMemo(() => [...new Set(open.map((v) => v.days).filter(Boolean))].sort((a, b) => a - b), [open]);
  const airlines = useMemo(() => [...new Set(open.map((v) => v.pkg.airline.name).filter(Boolean))].sort(), [open]);
  const types = useMemo(() => [...new Set(views.map((v) => v.backendType).filter((t) => TYPE_LABELS[t]))], [views]);
  const monthLabel = (key: string) => {
    const inMonth = open.filter((v) => v.month === key);
    return inMonth.length && inMonth.every((v) => v.ramadhan)
      ? `Ramadhan, ${monthName(key).replace(/^(\w{3})\w*/, "$1")}`
      : monthName(key);
  };

  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const price = (v: (typeof views)[number]) => v.price || Number.MAX_SAFE_INTEGER;
    return views
      .filter((v) => (mode === "full" && filters.sold) || v.open)
      .filter((v) => filters.month === "all" || v.month === filters.month)
      .filter((v) => filters.days === "all" || String(v.days) === filters.days)
      .filter((v) => filters.airline === "all" || v.pkg.airline.name === filters.airline)
      .filter((v) => filters.type === "all" || (filters.type === "RAMADHAN" ? v.ramadhan : v.backendType === filters.type))
      .filter((v) => !q || `${v.pkg.name} ${v.pkg.airline.name} ${v.pkg.hotelMakkah.name} ${v.pkg.hotelMadinah?.name || ""}`.toLowerCase().includes(q))
      .sort((a, b) =>
        filters.sort === "cheap" ? price(a) - price(b) : filters.sort === "exp" ? price(b) - price(a) : (a.pkg.departureDate || "").localeCompare(b.pkg.departureDate || ""),
      );
  }, [views, filters, mode]);

  const unfiltered = mode === "home" && filters.month === "all" && filters.days === "all" && filters.airline === "all";
  const shown = unfiltered ? list.slice(0, 5) : list;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setApplied(draft);
    document.getElementById("paket")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const set = (patch: Partial<Filters>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (mode === "home" && "month" in patch) setApplied((a) => ({ ...a, ...patch }));
  };

  const finder =
    mode === "home" ? (
      <div className="finder">
        <div className="wrap">
          <form onSubmit={submit} aria-label="Cari jadwal umroh">
            <label htmlFor="f-bulan">
              Bulan keberangkatan
              <select id="f-bulan" value={draft.month} onChange={(e) => setDraft({ ...draft, month: e.target.value })}>
                <option value="all">Semua bulan</option>
                {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
              </select>
            </label>
            <label htmlFor="f-durasi">
              Durasi
              <select id="f-durasi" value={draft.days} onChange={(e) => setDraft({ ...draft, days: e.target.value })}>
                <option value="all">Semua durasi</option>
                {durations.map((d) => <option key={d} value={String(d)}>{d} hari</option>)}
              </select>
            </label>
            <label htmlFor="f-maskapai">
              Maskapai
              <select id="f-maskapai" value={draft.airline} onChange={(e) => setDraft({ ...draft, airline: e.target.value })}>
                <option value="all">Semua maskapai</option>
                {airlines.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <button className="btn btn-navy" type="submit"><IconSearch />Cari paket</button>
          </form>
        </div>
      </div>
    ) : (
      <div className="finder">
        <div className="wrap">
          <form className="five" onSubmit={(e) => e.preventDefault()} aria-label="Saring paket">
            <label htmlFor="qtext">
              Cari paket
              <input id="qtext" type="search" placeholder="Contoh: Ramadhan, Garuda" value={draft.q} onChange={(e) => set({ q: e.target.value })} />
            </label>
            <label htmlFor="f-tipe">
              Jenis paket
              <select id="f-tipe" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
                <option value="all">Semua jenis</option>
                {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                <option value="RAMADHAN">Umroh Ramadhan</option>
              </select>
            </label>
            <label htmlFor="f-bulan2">
              Bulan
              <select id="f-bulan2" value={draft.month} onChange={(e) => set({ month: e.target.value })}>
                <option value="all">Semua bulan</option>
                {months.map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
              </select>
            </label>
            <label htmlFor="f-urut">
              Urutkan
              <select id="f-urut" value={draft.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="date">Berangkat terdekat</option>
                <option value="cheap">Harga termurah</option>
                <option value="exp">Harga tertinggi</option>
              </select>
            </label>
            <button className="btn btn-navy" type="button" onClick={() => setDraft(EMPTY)}>Reset</button>
          </form>
        </div>
      </div>
    );

  const grid = (
    <>
      <div className="cards">
        {shown.map((v) => <PackageCard key={v.pkg.id} view={v} />)}
        {shown.length ? <AskCard title={askTitle} text={askText} /> : null}
      </div>
      {!shown.length ? (
        <div className="empty" style={{ marginTop: 32 }}>
          <b>Belum ada paket untuk pilihan ini</b>
          Coba ubah pilihan bulan, durasi, atau maskapai, atau minta admin carikan jadwal yang pas.
        </div>
      ) : null}
    </>
  );

  if (mode === "home") {
    const tabs = [{ id: "all", label: "Semua", count: open.length }, ...months.map((m) => ({ id: m, label: monthLabel(m), count: open.filter((v) => v.month === m).length }))];
    return (
      <>
        {finder}
        {between}
        <section className="sec" id="paket">
          <div className="wrap">
            <div className="head">
              <div>
                <h2 className="h2">{heading}</h2>
                {lead ? <p className="lead">{lead}</p> : null}
              </div>
              <div className="tabs" role="tablist" aria-label="Filter bulan">
                {tabs.map((t) => (
                  <button key={t.id} className="tab" type="button" role="tab" aria-selected={applied.month === t.id} onClick={() => set({ month: t.id })}>
                    {t.label} <span style={{ opacity: 0.65 }}>{t.count}</span>
                  </button>
                ))}
              </div>
            </div>
            {grid}
            <div className="more">
              <Link className="btn btn-navy" href="/paket">Lihat semua paket</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {finder}
      <section className="sec" style={{ paddingTop: 48 }} id="paket">
        <div className="wrap">
          <div className="bar">
            <p style={{ color: "var(--muted)", fontSize: 15 }} aria-live="polite">
              {list.length ? `Menampilkan ${list.length} paket` : ""}
            </p>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 15, color: "var(--navy)", cursor: "pointer" }}>
              <input type="checkbox" checked={draft.sold} onChange={(e) => set({ sold: e.target.checked })} style={{ width: 18, height: 18, accentColor: "var(--navy)" }} />
              Tampilkan paket yang seatnya penuh
            </label>
          </div>
          {grid}
        </div>
      </section>
    </>
  );
}

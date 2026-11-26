"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MarketingPackage } from "@/lib/public-api";
import { WaLink } from "./chrome";
import { IconCalendar, IconClock, IconHotel, IconPlane, IconSearch, IconWa, IconX } from "./icons";
import { TYPE_LABELS, rupiah, titleCase, typeLabel, viewPackage, type PackageView } from "./ui";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const monthName = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m ? `${MONTHS[m - 1].slice(0, 3)} ${y}` : key;
};

const STATUS = [
  { id: "all", label: "Semua" },
  { id: "open", label: "Tersedia" },
  { id: "full", label: "Penuh / tutup" },
  { id: "departed", label: "Sudah berangkat" },
];

type Filters = { status: string; month: string; type: string; airline: string; days: string; q: string; sort: string };
const EMPTY: Filters = { status: "all", month: "all", type: "all", airline: "all", days: "all", q: "", sort: "best" };

const stateRank: Record<string, number> = { open: 0, soon: 1, full: 2, closed: 2, departed: 3 };

function Row({ v }: { v: PackageView }) {
  const name = titleCase(v.pkg.name);
  return (
    <article className={`prow s-${v.state}`}>
      <Link className="pthumb" href={v.href} aria-label={`Detail ${name}`}>
        {v.pkg.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.pkg.image} alt="" loading="lazy" />
        ) : null}
        <span className={`pstate ${v.state}`}>{v.open && v.seats <= 10 ? `Sisa ${v.seats} seat` : v.statusLabel}</span>
      </Link>
      <div className="pinfo">
        <div className="ptags">
          <span><IconCalendar />{v.date}</span>
          {v.days ? <span><IconClock />{v.days} hari</span> : null}
          <span className="ptype">{typeLabel(v.pkg)}</span>
        </div>
        <h3><Link href={v.href}>{name}</Link></h3>
        <ul className="pmeta">
          <li><IconPlane />{v.pkg.airline.name}</li>
          <li><IconHotel />Makkah: {titleCase(v.pkg.hotelMakkah.name)}</li>
          {v.pkg.hotelMadinah ? <li><IconHotel />Madinah: {titleCase(v.pkg.hotelMadinah.name)}</li> : null}
        </ul>
      </div>
      <div className="pprice">
        <dl className="rooms">
          <div><dt>Quad</dt><dd>{v.quad ? rupiah(v.quad) : "-"}</dd></div>
          <div><dt>Triple</dt><dd>{v.triple ? rupiah(v.triple) : "-"}</dd></div>
          <div><dt>Double</dt><dd>{v.double ? rupiah(v.double) : "-"}</dd></div>
        </dl>
        {v.oldPrice ? <p className="was">Harga normal <s>{rupiah(v.oldPrice)}</s></p> : null}
        <div className="pacts">
          <Link className="btn btn-line" href={v.href}>Detail</Link>
          {v.open ? (
            <WaLink className="btn btn-wa" message={`Assalamualaikum, saya ingin booking ${name} (${v.date})`}>
              <IconWa />Booking
            </WaLink>
          ) : v.state === "departed" ? (
            <WaLink className="btn btn-line" message={`Assalamualaikum, apakah ada jadwal serupa dengan ${name}?`}>Jadwal serupa</WaLink>
          ) : (
            <WaLink className="btn btn-line" message={`Assalamualaikum, saya ingin masuk daftar tunggu ${name}`}>Daftar tunggu</WaLink>
          )}
        </div>
      </div>
    </article>
  );
}

function Chips({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { id: string; label: string; count?: number }[];
  value: string;
  onPick: (id: string) => void;
}) {
  if (options.length < 3) return null;
  return (
    <fieldset className="fgroup">
      <legend>{title}</legend>
      <div className="fchips">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onPick(o.id)}>
            {o.label}
            {typeof o.count === "number" ? <span>{o.count}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function PackageBrowser({ packages }: { packages: MarketingPackage[] }) {
  const params = useSearchParams();
  const initial: Filters = { ...EMPTY, type: params?.get("tipe") === "ramadhan" ? "RAMADHAN" : "all" };
  const [f, setF] = useState<Filters>(initial);
  const [panel, setPanel] = useState(false);
  const views = useMemo(() => packages.map(viewPackage), [packages]);
  const set = (patch: Partial<Filters>) => setF((cur) => ({ ...cur, ...patch }));

  const months = useMemo(() => [...new Set(views.map((v) => v.month).filter(Boolean))].sort(), [views]);
  const airlines = useMemo(() => [...new Set(views.map((v) => v.pkg.airline.name).filter(Boolean))].sort(), [views]);
  const durations = useMemo(() => [...new Set(views.map((v) => v.days).filter(Boolean))].sort((a, b) => a - b), [views]);
  const types = useMemo(() => [...new Set(views.map((v) => v.backendType).filter((t) => TYPE_LABELS[t]))], [views]);

  const matchStatus = (v: PackageView, status: string) =>
    status === "all" || (status === "open" ? v.open : status === "departed" ? v.state === "departed" : !v.open && v.state !== "departed");

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const price = (v: PackageView) => v.price || Number.MAX_SAFE_INTEGER;
    const time = (v: PackageView) => new Date(v.pkg.departureDate || 0).getTime() || 0;
    return views
      .filter((v) => matchStatus(v, f.status))
      .filter((v) => f.month === "all" || v.month === f.month)
      .filter((v) => f.type === "all" || (f.type === "RAMADHAN" ? v.ramadhan : v.backendType === f.type))
      .filter((v) => f.airline === "all" || v.pkg.airline.name === f.airline)
      .filter((v) => f.days === "all" || String(v.days) === f.days)
      .filter((v) => !q || `${v.pkg.name} ${v.pkg.airline.name} ${v.pkg.hotelMakkah.name} ${v.pkg.hotelMadinah?.name || ""}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (f.sort === "cheap") return price(a) - price(b);
        if (f.sort === "exp") return price(b) - price(a);
        const rank = (stateRank[a.state] ?? 4) - (stateRank[b.state] ?? 4);
        if (rank) return rank;
        return a.state === "departed" ? time(b) - time(a) : time(a) - time(b);
      });
  }, [views, f]);

  const active = Object.entries(f).filter(([k, v]) => k !== "sort" && k !== "q" && v !== "all").length + (f.q ? 1 : 0);
  const count = (pred: (v: PackageView) => boolean) => views.filter(pred).length;

  return (
    <section className="sec browse" id="paket">
      <div className="wrap browse-grid">
        <aside className={`filters${panel ? " open" : ""}`} aria-label="Filter paket">
          <div className="fhead">
            <b>Filter paket</b>
            {active ? <button type="button" className="freset" onClick={() => setF(EMPTY)}>Reset</button> : null}
            <button type="button" className="fclose" aria-label="Tutup filter" onClick={() => setPanel(false)}><IconX /></button>
          </div>
          <label className="fsearch">
            <IconSearch />
            <span className="sr-only">Cari paket</span>
            <input type="search" placeholder="Cari paket atau hotel" value={f.q} onChange={(e) => set({ q: e.target.value })} />
          </label>
          <Chips title="Status" value={f.status} onPick={(id) => set({ status: id })} options={STATUS.map((s) => ({ ...s, count: count((v) => matchStatus(v, s.id)) }))} />
          <Chips
            title="Bulan berangkat"
            value={f.month}
            onPick={(id) => set({ month: id })}
            options={[{ id: "all", label: "Semua" }, ...months.map((m) => ({ id: m, label: monthName(m), count: count((v) => v.month === m) }))]}
          />
          <Chips
            title="Jenis paket"
            value={f.type}
            onPick={(id) => set({ type: id })}
            options={[
              { id: "all", label: "Semua" },
              ...types.map((t) => ({ id: t, label: TYPE_LABELS[t], count: count((v) => v.backendType === t) })),
              { id: "RAMADHAN", label: "Ramadhan", count: count((v) => v.ramadhan) },
            ]}
          />
          <Chips
            title="Maskapai"
            value={f.airline}
            onPick={(id) => set({ airline: id })}
            options={[{ id: "all", label: "Semua" }, ...airlines.map((a) => ({ id: a, label: a, count: count((v) => v.pkg.airline.name === a) }))]}
          />
          <Chips
            title="Durasi"
            value={f.days}
            onPick={(id) => set({ days: id })}
            options={[{ id: "all", label: "Semua" }, ...durations.map((d) => ({ id: String(d), label: `${d} hari` }))]}
          />
          <button type="button" className="btn btn-navy fdone" onClick={() => setPanel(false)}>Lihat {list.length} paket</button>
        </aside>

        <div className="results">
          <div className="rbar">
            <p aria-live="polite"><b>{list.length}</b> paket{f.status === "all" ? `, ${count((v) => v.open)} masih tersedia` : ""}</p>
            <div className="rtools">
              <button type="button" className="btn btn-line ftoggle" onClick={() => setPanel(true)}>
                Filter{active ? ` (${active})` : ""}
              </button>
              <label className="rsort">
                <span className="sr-only">Urutkan</span>
                <select value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                  <option value="best">Tersedia dulu</option>
                  <option value="cheap">Harga termurah</option>
                  <option value="exp">Harga tertinggi</option>
                </select>
              </label>
            </div>
          </div>
          {list.length ? (
            <div className="plist">{list.map((v) => <Row key={v.pkg.id} v={v} />)}</div>
          ) : (
            <div className="empty">
              <b>Belum ada paket untuk pilihan ini</b>
              Ubah filter, atau minta admin carikan jadwal yang pas.
              <div style={{ marginTop: 18 }}>
                <WaLink className="btn btn-gold" message="Assalamualaikum, saya ingin dicarikan jadwal umroh">Tanya admin</WaLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

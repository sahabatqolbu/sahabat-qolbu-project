"use client";

import { useState } from "react";
import { useWaHref } from "./chrome";
import { IconWa } from "./icons";

export type RoomPrice = { id: string; name: string; note: string; price: number };

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export default function RoomCalculator({
  packageName,
  rooms,
  seats,
  totalSeats,
  open,
  statusLabel,
  registerUrl,
  optionName,
}: {
  packageName: string;
  rooms: RoomPrice[];
  seats: number;
  totalSeats: number;
  open: boolean;
  statusLabel: string;
  registerUrl: string;
  optionName?: string;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id || "");
  const [people, setPeople] = useState(2);
  const room = rooms.find((r) => r.id === roomId) || rooms[0];
  const total = room ? room.price * people : 0;
  const option = optionName ? `, pilihan ${optionName}` : "";
  const waHref = useWaHref(
    open
      ? `Assalamualaikum, saya ingin booking ${packageName}${option}, kamar ${room?.name || ""} untuk ${people} orang (estimasi ${rupiah(total)}).`
      : `Assalamualaikum, saya ingin masuk daftar tunggu ${packageName}${option}.`,
  );
  const percent = totalSeats > 0 ? Math.min(100, Math.round((seats / totalSeats) * 100)) : 0;

  return (
    <>
      <form className="panel book" id="book" aria-label="Hitung biaya dan daftar" onSubmit={(e) => e.preventDefault()}>
        <h2>Pilih kamar</h2>
        <p className="from">Harga per orang, sudah termasuk fasilitas paket</p>
        {rooms.length ? (
          <div className="room">
            {rooms.map((r) => (
              <label key={r.id}>
                <span>
                  <input type="radio" name="room" value={r.id} checked={room?.id === r.id} onChange={() => setRoomId(r.id)} />
                  <span>{r.name}<small>{r.note}</small></span>
                </span>
                <b>{rupiah(r.price)}</b>
              </label>
            ))}
          </div>
        ) : (
          <p className="from" style={{ marginTop: 12 }}>Harga akan diinformasikan admin.</p>
        )}
        {rooms.length ? (
          <>
            <div className="stepper">
              <span style={{ fontWeight: 500 }}>Jumlah jamaah</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button type="button" aria-label="Kurangi jamaah" disabled={people <= 1} onClick={() => setPeople((p) => Math.max(1, p - 1))}>-</button>
                <output aria-live="polite">{people}</output>
                <button type="button" aria-label="Tambah jamaah" disabled={people >= 10} onClick={() => setPeople((p) => Math.min(10, p + 1))}>+</button>
              </span>
            </div>
            <div className="total">
              <span style={{ color: "var(--muted)" }}>Estimasi total</span>
              <b>{rupiah(total)}</b>
            </div>
          </>
        ) : null}
        <div style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
          <div className="bar">
            <span>Sisa seat</span>
            <b style={{ color: "var(--navy)" }}>{open ? `${seats} dari ${totalSeats}` : statusLabel}</b>
          </div>
          <div className="meter"><i style={{ width: `${open ? percent : 0}%` }} /></div>
        </div>
        {open ? (
          <a className="btn btn-gold" href={registerUrl} style={{ marginTop: 20 }}>Daftar sekarang</a>
        ) : null}
        <a className="btn btn-wa" href={waHref} target="_blank" rel="noopener noreferrer">
          <IconWa />
          {open ? "Tanya admin di WhatsApp" : "Masuk daftar tunggu"}
        </a>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14 }}>
          Seat dan kamar dikunci setelah DP dikonfirmasi admin. Pembayaran hanya ke rekening a/n PT. Sahabat Qolbu Cahaya Baitullah.
        </p>
      </form>
      {rooms.length ? (
        <div className="mbar">
          <div>
            <small>{room?.name}, {people} jamaah</small>
            <b>{rupiah(total)}</b>
          </div>
          <a className="btn btn-gold" href="#book">Pilih dan daftar</a>
        </div>
      ) : null}
    </>
  );
}

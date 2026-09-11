"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { masterService } from "@/services/masterService";
import type { PackageScheduleItem, PackageScheduleList, ScheduleStatus } from "@/services/packageScheduleService";

const blankItem = (): PackageScheduleItem => ({
  departureDate: "", duration: null, airlineId: null, arrivalAirportId: null,
  returnAirportId: null, hotelMakkahLabel: "", hotelMadinahLabel: "",
  hotelMakkahId: null, hotelMadinahId: null, priceQuad: "", priceTriple: "",
  priceDouble: "", note: "", status: "CHECK_SEAT",
});

const initialList: PackageScheduleList = {
  name: "", month: "", subtitle: "Pilih Jadwal, Maskapai & Tipe Kamar Sesuai Kebutuhan Keluarga",
  note: "Harga dan ketersediaan seat dapat berubah. Konfirmasi program final sebelum booking atau pembayaran.",
  isActive: true, isPublished: false, items: [blankItem()],
};

const unwrap = (value: any) => value?.data || [];

export default function PackageScheduleForm({ value, saving, onSubmit }: {
  value?: PackageScheduleList;
  saving?: boolean;
  onSubmit: (value: PackageScheduleList) => void;
}) {
  const [form, setForm] = useState<PackageScheduleList>(value || initialList);
  useEffect(() => { if (value) setForm({ ...value, items: value.items.length ? value.items : [blankItem()] }); }, [value]);

  const airlinesQuery = useQuery({ queryKey: ["master-airlines", "schedule"], queryFn: () => masterService.airlines.getAll({ isActive: true }) });
  const hotelsQuery = useQuery({ queryKey: ["master-hotels", "schedule"], queryFn: () => masterService.hotels.getAll({ isActive: true }) });
  const airportsQuery = useQuery({ queryKey: ["master-airports", "schedule"], queryFn: () => masterService.airports.getAll({ isActive: true }) });
  const airlines = unwrap(airlinesQuery.data);
  const hotels = unwrap(hotelsQuery.data);
  const airports = unwrap(airportsQuery.data);
  const makkahHotels = hotels.filter((hotel: any) => hotel.city === "MAKKAH");
  const madinahHotels = hotels.filter((hotel: any) => hotel.city === "MADINAH");
  const jedId = useMemo(() => airports.find((airport: any) => airport.code === "JED")?.id || null, [airports]);

  useEffect(() => {
    if (!jedId) return;
    setForm((current) => ({ ...current, items: current.items.map((item) => ({ ...item, arrivalAirportId: item.arrivalAirportId || jedId, returnAirportId: item.returnAirportId || jedId })) }));
  }, [jedId]);

  const updateItem = (index: number, field: keyof PackageScheduleItem, value: unknown) => {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  };
  const addItem = (copyIndex?: number) => setForm((current) => ({
    ...current,
    items: [...current.items, copyIndex === undefined ? { ...blankItem(), arrivalAirportId: jedId, returnAirportId: jedId } : { ...current.items[copyIndex], id: undefined, departureDate: "" }],
  }));
  const removeItem = (index: number) => setForm((current) => ({ ...current, items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index) }));
  const chooseHotel = (index: number, city: "MAKKAH" | "MADINAH", raw: string) => {
    const id = raw === "none" ? null : Number(raw);
    const hotel = hotels.find((entry: any) => entry.id === id);
    updateItem(index, city === "MAKKAH" ? "hotelMakkahId" : "hotelMadinahId", id);
    if (hotel) updateItem(index, city === "MAKKAH" ? "hotelMakkahLabel" : "hotelMadinahLabel", hotel.name);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    onSubmit({ ...form, items: form.items.map((item, index) => ({ ...item, sortOrder: index })) });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informasi Daftar Jadwal</CardTitle><CardDescription>Satu daftar untuk satu program dan bulan keberangkatan.</CardDescription></CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2"><Label>Nama Program *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Paket Family Smart" /></div>
          <div className="space-y-2"><Label>Bulan Keberangkatan *</Label><Input required type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Subjudul</Label><Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Catatan Publik</Label><Textarea value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} /><Label>Aktif</Label></div>
          <div className="flex items-center gap-3"><Switch checked={form.isPublished} onCheckedChange={(checked) => setForm({ ...form, isPublished: checked })} /><Label>Tampilkan di website</Label></div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Jadwal Keberangkatan</h2><p className="text-sm text-gray-500">Rute kosong otomatis menjadi JED-JED.</p></div><Button type="button" variant="outline" onClick={() => addItem()}><Plus className="mr-2 h-4 w-4" />Tambah Baris</Button></div>
      {form.items.map((item, index) => (
        <Card key={`${item.id || "new"}-${index}`}>
          <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle className="text-base">Jadwal {index + 1}</CardTitle><CardDescription>{item.departureDate || "Tanggal belum dipilih"}</CardDescription></div><div className="flex gap-2"><Button type="button" size="icon" variant="outline" title="Duplikat baris" onClick={() => addItem(index)}><Copy className="h-4 w-4" /></Button><Button type="button" size="icon" variant="outline" className="text-red-600" title="Hapus baris" disabled={form.items.length === 1} onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2"><Label>Tanggal *</Label><Input required type="date" value={item.departureDate} onChange={(e) => updateItem(index, "departureDate", e.target.value)} /></div>
            <div className="space-y-2"><Label>Durasi (hari)</Label><Input type="number" min={1} max={60} value={item.duration ?? ""} onChange={(e) => updateItem(index, "duration", e.target.value ? Number(e.target.value) : null)} placeholder="Boleh menyusul" /></div>
            <div className="space-y-2"><Label>Maskapai *</Label><Select value={item.airlineId ? String(item.airlineId) : ""} onValueChange={(value) => updateItem(index, "airlineId", Number(value))}><SelectTrigger><SelectValue placeholder="Pilih maskapai" /></SelectTrigger><SelectContent>{airlines.map((entry: any) => <SelectItem key={entry.id} value={String(entry.id)}>{entry.name} ({entry.code})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status *</Label><Select value={item.status} onValueChange={(value) => updateItem(index, "status", value as ScheduleStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CHECK_SEAT">Cek Seat</SelectItem><SelectItem value="SOLD_OUT">Sold Out</SelectItem><SelectItem value="CLOSED">Paket Close</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Rute Datang</Label><Select value={String(item.arrivalAirportId || jedId || "")} onValueChange={(value) => updateItem(index, "arrivalAirportId", Number(value))}><SelectTrigger><SelectValue placeholder="JED" /></SelectTrigger><SelectContent>{airports.map((entry: any) => <SelectItem key={entry.id} value={String(entry.id)}>{entry.code} - {entry.city}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Rute Pulang</Label><Select value={String(item.returnAirportId || jedId || "")} onValueChange={(value) => updateItem(index, "returnAirportId", Number(value))}><SelectTrigger><SelectValue placeholder="JED" /></SelectTrigger><SelectContent>{airports.map((entry: any) => <SelectItem key={entry.id} value={String(entry.id)}>{entry.code} - {entry.city}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Hubungkan Hotel Makkah</Label><Select value={item.hotelMakkahId ? String(item.hotelMakkahId) : "none"} onValueChange={(value) => chooseHotel(index, "MAKKAH", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa data master</SelectItem>{makkahHotels.map((entry: any) => <SelectItem key={entry.id} value={String(entry.id)}>{entry.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Hubungkan Hotel Madinah</Label><Select value={item.hotelMadinahId ? String(item.hotelMadinahId) : "none"} onValueChange={(value) => chooseHotel(index, "MADINAH", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tanpa data master</SelectItem>{madinahHotels.map((entry: any) => <SelectItem key={entry.id} value={String(entry.id)}>{entry.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 xl:col-span-2"><Label>Teks Hotel Makkah *</Label><Input required value={item.hotelMakkahLabel} onChange={(e) => updateItem(index, "hotelMakkahLabel", e.target.value)} placeholder="Winner Inn / Nada Ajyad / setaraf" /></div>
            <div className="space-y-2 xl:col-span-2"><Label>Teks Hotel Madinah *</Label><Input required value={item.hotelMadinahLabel} onChange={(e) => updateItem(index, "hotelMadinahLabel", e.target.value)} placeholder="ODST / Triple One / setaraf" /></div>
            <div className="space-y-2"><Label>Harga Quad *</Label><Input required type="number" min={0} value={item.priceQuad} onChange={(e) => updateItem(index, "priceQuad", e.target.value)} /></div>
            <div className="space-y-2"><Label>Harga Triple *</Label><Input required type="number" min={0} value={item.priceTriple} onChange={(e) => updateItem(index, "priceTriple", e.target.value)} /></div>
            <div className="space-y-2"><Label>Harga Double *</Label><Input required type="number" min={0} value={item.priceDouble} onChange={(e) => updateItem(index, "priceDouble", e.target.value)} /></div>
            <div className="space-y-2"><Label>Highlight / Catatan</Label><Input value={item.note || ""} onChange={(e) => updateItem(index, "note", e.target.value)} placeholder="Contoh: 2X Jumaat" /></div>
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" size="lg" disabled={saving} className="bg-secondary text-primary hover:bg-secondary/90">{saving ? <CalendarPlus className="mr-2 h-5 w-5 animate-pulse" /> : <Save className="mr-2 h-5 w-5" />}{saving ? "Menyimpan..." : "Simpan Daftar Jadwal"}</Button></div>
    </form>
  );
}

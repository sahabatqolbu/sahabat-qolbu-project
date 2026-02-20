# PAYMENT_FLOW - Sahabat Qolbu

Status dokumen: **Draft Operasional v1.0**  
Tanggal: **2026-02-14**  
Cakupan saat ini: **Manual transfer + upload bukti + verifikasi internal**

## 1) Tujuan
Dokumen ini menjadi panduan baku alur pembayaran jamaah agar:
- status pembayaran konsisten,
- verifikasi terdokumentasi,
- risiko salah verifikasi/fraud berkurang,
- audit trail bisa ditelusuri.

## 2) Scope
- Pembayaran paket oleh jamaah (lunas/cicilan).
- Upload bukti transfer oleh jamaah atau agen.
- Verifikasi oleh internal (`ADMIN`/`FINANCE`).
- Perubahan status transaksi sampai pelunasan.

Out of scope (fase berikutnya):
- payment gateway,
- auto reconciliation bank statement,
- auto refund workflow terintegrasi.

## 3) Aktor & Tanggung Jawab
- `JAMAAH`: melakukan transfer, upload bukti yang valid.
- `AGEN`: membantu jamaah upload bukti (jika dibutuhkan).
- `FINANCE`: verifikasi nominal/bukti/referensi pembayaran.
- `ADMIN`: otorisasi dan supervisi kasus khusus.

## 4) State Machine Pembayaran

### 4.1 Status utama transaksi
- `PENDING`: belum ada pembayaran terverifikasi.
- `PARTIAL`: sudah ada pembayaran, belum lunas.
- `PAID`: nominal total terpenuhi.
- `VERIFIED`: pembayaran tervalidasi final sesuai kebijakan internal.
- `CANCELLED`: transaksi dibatalkan.
- `REFUNDED`: dana sudah direfund (jika berlaku).

### 4.2 Event transisi
- `UPLOAD_PROOF` -> bukti pembayaran masuk.
- `VERIFY_PAYMENT` -> bukti valid dan nominal diterima.
- `REJECT_PAYMENT` -> bukti tidak valid/nominal tidak cocok.
- `APPLY_ADJUSTMENT` -> koreksi admin untuk kasus khusus.
- `MARK_PAID` -> total terpenuhi.
- `MARK_REFUNDED` -> refund diproses.

### 4.3 Aturan transisi minimum
- `PENDING -> PARTIAL` saat pembayaran pertama terverifikasi tapi belum lunas.
- `PENDING/PARTIAL -> PAID` saat `paidAmount >= totalAmount`.
- `PAID -> VERIFIED` saat finance/admin finalisasi verifikasi.
- `ANY -> CANCELLED` hanya oleh role berwenang dengan alasan.
- `PAID/VERIFIED -> REFUNDED` hanya via proses refund terotorisasi.

## 5) SOP Operasional (Current)

## 5.1 Upload bukti pembayaran
1. Jamaah/agen melakukan transfer ke rekening resmi.
2. User upload bukti pembayaran pada transaksi terkait.
3. Sistem menyimpan bukti + metadata dasar (uploader, waktu, referensi).

## 5.2 Verifikasi oleh finance/admin
Checklist verifikasi minimum:
- rekening tujuan sesuai rekening resmi,
- nominal transfer sesuai klaim,
- tanggal/waktu transfer masuk akal,
- referensi jamaah/booking cocok,
- bukti tidak blur/manipulatif.

Jika valid:
- update nominal terbayar,
- update status transaksi (`PARTIAL`/`PAID`),
- catat verifier + waktu verifikasi.

Jika tidak valid:
- tandai ditolak,
- tulis alasan penolakan,
- minta upload ulang bukti.

## 5.3 Cicilan / partial payment
- Sistem menambah `paidAmount` secara kumulatif.
- `remainingAmount` dihitung ulang setiap verifikasi.
- Status tetap `PARTIAL` sampai total terpenuhi.

## 5.4 Koreksi data (exception)
Koreksi hanya boleh dilakukan role berwenang dan wajib menyimpan:
- alasan koreksi,
- operator,
- timestamp,
- nilai sebelum/sesudah.

## 6) Kontrol Risiko & Anti-Fraud
- Double-check untuk nominal besar (maker-checker bila memungkinkan).
- Larangan approval pembayaran sendiri untuk transaksi yang diinput operator yang sama.
- Setiap reject wajib alasan tertulis.
- Simpan audit trail perubahan status & nominal.
- Alert untuk pola anomali (repeated reject, edit berulang, lonjakan verifikasi).

## 7) Data yang Wajib Tersimpan
- ID transaksi, ID jamaah, booking reference.
- nominal total, nominal terbayar, sisa nominal.
- bukti pembayaran (path/url aman), timestamp upload.
- verifier (`userId`), waktu verifikasi, catatan verifikasi.
- status transaksi + histori perubahan penting.

## 8) SLA Operasional (Draft)
- Verifikasi pembayaran normal: target < 1x24 jam kerja.
- Kasus mismatch nominal/referensi: target follow-up < 2x24 jam kerja.
- Incident terkait bukti hilang/invalid: eskalasi ke admin pada hari yang sama.

## 9) Edge Cases yang Harus Ditangani
- Bukti upload dobel untuk transaksi sama.
- Nominal transfer lebih kecil/lebih besar dari tagihan.
- Bukti salah transaksi (booking tidak cocok).
- Transfer terpisah oleh pihak berbeda untuk jamaah sama.
- Bukti valid tapi status belum terupdate (retry/update idempotent).

## 10) Integrasi Masa Depan
Saat masuk fase payment gateway, dokumen ini diperbarui untuk:
- webhook verification,
- payment intent lifecycle,
- auto reconciliation,
- dispute/refund terotomasi.

## 11) Checklist Go-Live Payment Flow
- [ ] Semua endpoint payment pakai kontrak response standar.
- [ ] Audit trail verifikasi tersedia.
- [ ] Role permission payment telah diuji.
- [ ] Backup dokumen payment proof berjalan.
- [ ] SOP reject/reupload dipahami tim operasional.

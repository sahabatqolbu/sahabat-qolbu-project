# PII_ACCESS_MATRIX - Sahabat Qolbu

Status dokumen: **Active Governance Matrix**  
Tanggal mulai berlaku: **2026-02-20**

## 1) Tujuan
Dokumen ini menetapkan batas akses data pribadi sensitif (PII) lintas role agar implementasi sesuai prinsip least-privilege dan siap diaudit.

## 2) Klasifikasi Data PII
- **Level A (Sangat Sensitif):** NIK, paspor, KTP/KK scan, dokumen mahram, bukti pembayaran.
- **Level B (Sensitif):** alamat lengkap, nomor telepon, tanggal lahir, emergency contact.
- **Level C (Identitas Dasar):** nama, email, booking number, status registrasi.

## 3) Access Matrix per Role
| Domain Data | ADMIN | FINANCE | STAFF | AGEN | JAMAAH |
|---|---|---|---|---|---|
| Jamaah biodata (Level B/C) | Full RW | Read | Read terbatas operasional | Read milik sendiri/downline | Read/update milik sendiri |
| Dokumen identitas (KTP/KK/Paspor) | Full RW | Read untuk verifikasi payment context | No direct file access | Upload milik jamaah binaan (terbatas) | Upload/read milik sendiri |
| Bukti pembayaran | Full RW verify/reject | RW verify/reject | Read status only | Upload milik jamaah binaan (sesuai flow) | Upload/read milik sendiri |
| Data agen profile + rekening | Full RW | Read (kebutuhan payout/rekonsiliasi) | Read terbatas | Full RW milik sendiri | No access |
| Public marketing content | Full RW | Read | RW sesuai modul content | Read | Read |

Keterangan:
- `RW` = read/write sesuai endpoint yang diizinkan role middleware.
- Semua akses file sensitif wajib melalui endpoint terproteksi (`/api/protected-uploads/*`), bukan static public path.

## 4) Kontrol Wajib
- Seluruh endpoint sensitif harus melewati `authenticate + authorize`.
- Dilarang membuka folder sensitif uploads secara publik (`profiles`, `jamaah`, `agents`, `documents`, `payments`).
- Audit trail wajib untuk aksi kritikal payment verification/rejection.
- Data minimization: response API hanya mengembalikan field yang diperlukan UI.

## 5) Jadwal Review Quarterly
- Review akses dilakukan **setiap kuartal** oleh: Backend Owner + Security/Infra Owner + Product/Ops representative.
- Trigger review tambahan (di luar jadwal):
  - ada role/fitur baru,
  - ada incident kebocoran/akses tidak sah,
  - ada perubahan regulasi internal/eksternal.

## 6) Checklist Review Akses
- [ ] Role-permission route masih sesuai matrix.
- [ ] Endpoint PII tidak bocor ke role non-authorized.
- [ ] Protected upload policy masih aktif.
- [ ] Audit log aksi kritikal tersedia dan terbaca.
- [ ] Sampling data API tidak mengandung field berlebih.

## 7) Evidence Review Template
```text
Quarter: YYYY-QN
Review Date: YYYY-MM-DD
Reviewers: <nama>

Scope Checked:
- Endpoint domain: <list>
- Upload access policy: PASS|FAIL
- Role-route mapping: PASS|FAIL

Findings:
- High:
- Medium:
- Low:

Actions:
- <owner> - <due date> - <status>
```

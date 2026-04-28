# APP_CONCEPT - Sahabat Qolbu Digital Ecosystem

Status dokumen: **LOCKED - v1.0**  
Tanggal lock: **2026-02-14**  
Review cadence: **Quarterly**

## 1) Ringkasan Produk
Sahabat Qolbu adalah ekosistem web app terpadu untuk operasional travel Umrah/Haji yang memisahkan kebutuhan publik (marketing & katalog paket), kebutuhan internal operasional (dashboard multi-role), dan layanan backend API dalam arsitektur modular.

Tujuan utamanya adalah menyatukan proses end-to-end:
- akuisisi calon jamaah,
- manajemen data jamaah,
- operasional paket keberangkatan,
- manajemen agen,
- pembayaran dan verifikasi,
- sampai pelaporan dan pengelolaan master data.

Project dibangun sebagai monorepo dengan 3 aplikasi utama:
- `backend` (API + business logic + akses database),
- `dashboard` (panel internal/multi-role),
- `frontend` (website publik/marketing).

---

## 2) Filosofi dan Pendekatan Utama

### 2.1 Business-first architecture
Desain sistem mengikuti alur bisnis travel, bukan sekadar CRUD generik. Entitas utama seperti `users`, `jamaah_data`, `packages`, `agent_data`, `transactions`, `jamaah_payments`, dan `notifications` dipetakan sesuai proses nyata operasional.

### 2.2 Role-centric workflow
Hak akses dirancang berdasarkan peran (`ADMIN`, `FINANCE`, `STAFF`, `AGEN`, `JAMAAH`) sehingga alur kerja dan batas akses tiap aktor jelas, terukur, dan bisa di-audit.

### 2.3 Security as baseline
Security tidak dianggap fitur tambahan, tetapi baseline sistem:
- HTTP security headers,
- CORS policy,
- rate limiting,
- JWT auth,
- origin validation untuk request sensitif,
- proteksi akses file sensitif berbasis kepemilikan.

### 2.4 Evolvable modularity
Struktur kode mengarah ke modular monolith: domain controller dipisahkan per area (auth, paket, jamaah, agen, master, report, notif, dll) agar mudah dipecah ke service terpisah jika skala meningkat.

### 2.5 Progressive hardening
Pendekatan pengembangan yang dipakai: bergerak cepat untuk validasi kebutuhan bisnis, lalu bertahap memperkuat correctness, konsistensi kontrak API, observability, dan keamanan operasional.

---

## 3) Visi Produk
Menjadi platform digital operasional travel Umrah/Haji yang:
- efisien untuk tim internal,
- jelas untuk agen,
- nyaman untuk jamaah,
- dan siap scale secara bertahap tanpa rewrite total.

---

## 4) Arsitektur Teknis

## 4.0 Tech Stack (Ringkas & Praktis)

### 4.0.1 Backend
- Runtime: `Node.js`
- Framework API: `Express.js`
- ORM: `Drizzle ORM`
- Database: `MySQL`
- Auth: `JWT` + `httpOnly cookie`
- Validation: `Zod`
- Upload/file handling: `Multer` + `Jimp`
- Security middleware: `Helmet`, `CORS`, `express-rate-limit`
- Email: `Nodemailer`
- Utility data export/import: `xlsx`

### 4.0.2 Dashboard
- Framework: `Next.js` (App Router)
- UI: `React`, `Tailwind CSS`, `Radix UI`
- State: `Zustand`
- Data fetching/cache: `Axios`, `TanStack React Query`
- Form & validation: `React Hook Form`, `Zod`
- Language/tooling: `TypeScript`, `ESLint`

### 4.0.3 Frontend
- Framework: `Next.js` (App Router)
- UI: `React`, `Tailwind CSS`
- Data layer: `Axios`, `TanStack React Query`
- Form & validation: `React Hook Form`, `Zod`
- Animation/UI helper: `Framer Motion`, `Radix UI`
- Language/tooling: `TypeScript`, `ESLint`

## 4.1 High-level architecture
- **Frontend (Next.js)**: portal publik/marketing + rendering halaman informasi.
- **Dashboard (Next.js)**: panel kerja internal dan mobile workflow.
- **Backend (Node.js + Express)**: API, autentikasi, authorization, business rules, file handling, integrasi DB.
- **Database (MySQL + Drizzle ORM)**: sumber data utama.

## 4.2 Backend architecture
- Entry point: `backend/server.js`
- App composition: `backend/src/app.js`
- Router aggregation: `backend/src/routes/api.js`
- Domain controllers: `backend/src/controllers/*`
- Persistence layer: `backend/src/db/schema.js`, `backend/src/db/relations.js`, `backend/src/db/index.js`
- Cross-cutting concerns:
  - `middlewares/authMiddleware.js`
  - `middlewares/roleMiddleware.js`
  - `middlewares/rateLimiter.js`
  - `middlewares/errorHandler.js`
  - `config/security.js`

## 4.3 Frontend architecture
Menggunakan Next.js App Router dengan pembagian route group:
- `dashboard/src/app/(dashboard)` untuk panel internal,
- `dashboard/src/app/(mobile)` untuk flow mobile agent/jamaah,
- `frontend/src/app/(marketing)` untuk website publik.

Struktur channel produk di sisi web:
- **Official website (publik):** halaman marketing, paket, konten brand, SEO.
- **Agen website path (`/agen`):** pengalaman agen (dashboard app) + pengelolaan website agen (`/agen/website`) dan landing berbasis agen di frontend.

Catatan operasional path:
- `frontend` = kanal publik/official.
- `dashboard` = aplikasi operasional internal + role workspace.

Pendekatan data access:
- API client berbasis Axios,
- service layer (`src/services/*`) untuk isolasi request,
- state client (Zustand) untuk autentikasi dan OTP flow di dashboard.

## 4.4 Data architecture
Database schema dipusatkan di Drizzle schema dan memuat:
- master data,
- data transaksi,
- data profil entitas,
- log/notification/event.

Struktur ini mendukung query operasional sekaligus reporting dasar.

---

## 5) Fitur Inti

## 5.0 Breakdown Aplikasi Dashboard (5 Role Workspace)
Dashboard dibagi menjadi 5 workspace utama berdasarkan role:

### 5.0.1 Admin Workspace
Fokus: kontrol penuh sistem.
- dashboard statistik utama,
- kelola user (CRUD, aktivasi, bulk action),
- kelola paket (CRUD, itinerary, media, import/export),
- kelola jamaah (monitoring, approval pipeline),
- kelola agen (approval, review dokumen, monitoring status),
- transaksi & verifikasi,
- master data (hotel, maskapai, bandara, bank, level agen, syarat agen, tujuan agen, periode),
- konten (FAQ, testimonial, gallery),
- laporan (sales/growth),
- pengaturan profil perusahaan.

### 5.0.2 Finance Workspace
Fokus: operasi keuangan.
- dashboard finansial,
- akses daftar user/jamaah/agen untuk kebutuhan verifikasi,
- POS jamaah,
- transaksi dan status pembayaran,
- laporan finansial.

### 5.0.3 Staff Workspace
Fokus: operasional harian non-finansial inti.
- dashboard operasional,
- bantu kelola user, paket, jamaah, agen,
- update master data,
- kelola konten pendukung,
- update profil staff.

### 5.0.4 Agen Workspace
Fokus: akuisisi & manajemen jamaah oleh agen.
- dashboard agen,
- profil agen (kelengkapan data & dokumen),
- daftar jamaah agen,
- pembuatan akun jamaah,
- komisi agen,
- paket tersedia,
- kelola website agen/landing personal.

### 5.0.5 Jamaah Workspace
Fokus: self-service jamaah.
- dashboard jamaah,
- lengkapi biodata,
- upload dokumen,
- pembayaran,
- paket saya,
- status approval/onboarding.

## 5.0.6 Frontend Channel (Publik)
Frontend memiliki 2 kanal utama:
- **Official:** website publik brand dan produk (home, package listing/detail, marketing content, SEO pages).
- **Agen Landing (`/[namaagen]`):** landing page dinamis untuk agen tertentu sebagai kanal akuisisi.

## 5.1 Auth & session
- login email/password,
- OTP verification,
- cookie token untuk session,
- endpoint user profile (`/auth/me`),
- logout.

## 5.2 Manajemen user & role
- create/update/delete user,
- status activation toggle,
- bulk operation,
- pembatasan akses sesuai role.

## 5.3 Manajemen jamaah
- sinkronisasi user role JAMAAH ke biodata jamaah,
- create/update/delete jamaah,
- upload dokumen,
- approval/reject flow,
- relasi mahram,
- tracking status registrasi dan pembayaran.

## 5.4 Manajemen paket
- CRUD paket,
- itinerary PDF,
- media paket (single/bulk upload),
- export/import data paket,
- sinkronisasi event kalender.

## 5.5 Manajemen agen
- profil agen,
- upload dokumen agen,
- approval/rejection,
- level, star, closing tracking,
- public landing data (approved agents).

## 5.6 Pembayaran & verifikasi
- pencatatan pembayaran jamaah,
- proof upload,
- verifikasi oleh role terkait,
- status payment progression.

### 5.6.1 Detail Payment Flow (Current State)
- Model pembayaran saat ini: **manual transfer** (belum payment gateway).
- Jamaah/agen melakukan transfer ke rekening perusahaan, lalu upload bukti pembayaran.
- Tim internal (admin/finance) memverifikasi bukti dan mengubah status pembayaran.
- Sistem mendukung progres status pembayaran (termasuk cicilan/partial sesuai entitas transaksi yang ada).
- Rekonsiliasi masih operasional-manual (cross-check bukti transfer, nominal, tanggal, dan referensi jamaah).

### 5.6.2 Batasan Payment Saat Ini
- Belum ada auto-confirmation dari payment gateway.
- Belum ada auto-reconciliation bank statement.
- Refund/dispute flow belum terdokumentasi mendalam dalam SOP teknis terpisah.

### 5.6.3 Arah Penguatan Payment
- Dokumen khusus `PAYMENT_FLOW.md` (disarankan) untuk:
  - state machine pembayaran,
  - aturan cicilan dan pelunasan,
  - prosedur refund/correction,
  - kontrol anti-fraud operasional,
  - audit trail minimum untuk semua perubahan status.

## 5.7 Master data & operasional
- hotels, airlines, airports, banks, company profile,
- FAQ dan testimonials,
- calendar events,
- reminder/notification.

## 5.8 Pelaporan
- sales/growth reporting,
- dashboard operational stats.

---

## 6) Struktur Database (Konseptual)

## 6.1 Entitas pusat
- `users`: akun lintas role.
- `jamaah_data`: biodata, status registrasi, status payment, dokumen jamaah.
- `packages`: detail paket, jadwal, pricing, kapasitas, status publish.
- `agent_data`: data agen lengkap, status approval, dokumen, level/star.

## 6.2 Entitas transaksi
- `transactions`: pembayaran utama jamaah.
- `payment_installments`: cicilan transaksi.
- `jamaah_payments`: log pembayaran jamaah.
- `agent_payment_transactions`: pembayaran terkait agen.

## 6.3 Entitas pendukung
- `package_images`, `package_itinerary_items`.
- `calendar_events`.
- `notifications`.
- `faqs`, `testimonials`, `gallery`.
- master tables (`master_hotels`, `master_airlines`, `master_airports`, `master_banks`, dll).

## 6.4 Pola relasi utama
- `users` 1:n `jamaah_data` (konseptual per role).
- `users` 1:1 `agent_data`.
- `packages` 1:n `jamaah_data`.
- `jamaah_data` 1:n `jamaah_payments`.
- `transactions` 1:n `payment_installments`.

---

## 7) Struktur Folder Proyek

## 7.1 Root
- `backend/` API dan business layer.
- `dashboard/` panel internal.
- `frontend/` website publik.
- dokumen pendukung: `README.md`, `CODE_REVIEW_REQUIREMENTS.md`, dll.

## 7.2 Backend
- `src/controllers/` domain logic.
- `src/routes/` endpoint routing.
- `src/middlewares/` auth, role, limiter, error.
- `src/db/` schema, relations, seed.
- `src/utils/` helper lintas domain (upload, jwt, password, logger, response).
- `src/validators/` skema validasi.

## 7.3 Dashboard
- `src/app/` routes App Router.
- `src/components/` komponen UI dan domain.
- `src/services/` integrasi API.
- `src/stores/` state client.
- `src/lib/` utilitas umum.

## 7.4 Frontend
- `src/app/` route publik.
- `src/components/` marketing UI.
- `src/lib/` utilitas, SEO, mock/fetch helper.

---

## 8) Kontrak Integrasi Antar Aplikasi

## 8.1 Backend sebagai source of truth
Semua mutation data bisnis dilakukan via API backend. Dashboard dan frontend berperan sebagai client.

## 8.2 Akses aset publik vs sensitif
- Aset publik: disajikan via static upload path publik.
- Aset sensitif: disajikan via endpoint terproteksi dengan autentikasi + ownership check.

## 8.3 Kontrak respons
Secara konsep memakai struktur respons standar (`success`, `message`, `data`), namun masih ada endpoint lama yang perlu diseragamkan penuh.

---

## 9) Keamanan (Current Posture)

Baseline yang sudah ada:
- Helmet,
- CORS policy,
- rate limiting,
- JWT verification,
- role-based authorization,
- cookie auth support,
- CSRF-like origin validation untuk request yang membawa auth cookie,
- folder restriction untuk static uploads.

Hardening yang telah diperkuat:
- endpoint file sensitif kini memeriksa kepemilikan file/user untuk role non-admin,
- public agent exposure dibatasi ke status approved,
- informasi kontak sensitif tidak lagi dibuka di endpoint publik default.

## 9.1 Data Protection & Privacy (PII)
Data sensitif yang ditangani sistem meliputi:
- KTP, paspor, dokumen keluarga, data kesehatan tertentu, data kontak dan relasi keluarga.

Prinsip perlindungan data yang harus dijalankan:
- **Least privilege access**: hanya role relevan yang dapat mengakses dokumen sensitif.
- **Need-to-know policy**: akses PII dibatasi per konteks proses bisnis.
- **Auditability**: perubahan status penting dan aktivitas verifikasi terdokumentasi.
- **Secure transport**: seluruh akses production wajib HTTPS.
- **Regulatory alignment**: implementasi diarahkan agar selaras dengan prinsip **UU PDP Indonesia**.

Catatan penguatan yang perlu diprioritaskan:
- kebijakan retensi dan penghapusan data per jenis dokumen,
- enkripsi at-rest untuk objek dokumen sensitif,
- SOP permintaan akses/ekspor/hapus data subjek (data subject request),
- review **quarterly** daftar role + endpoint yang mengekspos PII, didokumentasikan dalam access matrix internal.

---

## 10) Observability dan Operasional

## 10.1 Logging
Sistem menggunakan logger util untuk info/warn/error/security events.

## 10.2 Health checks
Endpoint health tersedia untuk monitoring sederhana.

## 10.3 Runtime concerns
Aplikasi masih monolith API, cocok untuk skala kecil-menengah. Untuk scale besar perlu antrian jobs, caching, dan strategi observability lebih formal.

## 10.4 Observability Minimum Target (Production)
Minimum observability yang harus ada:
- **Structured logging** (hindari log ad-hoc untuk event kritikal),
- **Error tracking** terpusat (mis. Sentry/sejenis),
- **Uptime monitoring** endpoint publik + API,
- **Alerting** untuk anomali penting:
  - lonjakan gagal login,
  - lonjakan request 401/403/429,
  - kegagalan verifikasi pembayaran,
  - error rate endpoint kritikal.

## 10.5 Backup & Disaster Recovery
Karena sistem menyimpan data transaksi dan dokumen sensitif, strategi backup/DR wajib ditetapkan.

Komponen yang harus dibackup:
- database MySQL,
- file uploads/dokumen,
- konfigurasi environment dan artefak deployment penting.

Target operasional awal (draft, dapat direvisi sesuai kebijakan kantor):
- backup DB harian + backup incremental,
- retensi backup multi-periode (harian/mingguan/bulanan),
- uji restore berkala,
- definisi **RPO** dan **RTO** yang disepakati manajemen.

Status saat ini:
- parameter final backup/DR belum dikunci, perlu diputuskan saat finalisasi infrastruktur production.

## 10.6 Storage Strategy (Dokumen & Upload)
Strategi penyimpanan file perlu dibuat eksplisit karena sistem menangani dokumen bernilai tinggi operasional (KTP/paspor/dokumen pendukung).

Kondisi saat ini:
- file upload disimpan di local filesystem server aplikasi.

Risiko saat ini:
- kehilangan file saat migrasi server,
- risiko data gap jika terjadi failure disk/server,
- operasional terganggu karena jamaah harus upload ulang dokumen.

Arah target:
- evaluasi object storage (S3-compatible/MinIO) saat volume dokumen meningkat,
- pisahkan lifecycle file dengan lifecycle server aplikasi.

Mitigasi interim:
- backup direktori upload ke secondary location,
- verifikasi restore file secara berkala,
- dokumentasikan prosedur recovery file bersama prosedur recovery database.

---

## 11) Batasan yang Diakui Secara Transparan

## 11.1 Konsistensi kontrak API belum 100%
Masih ada endpoint lama yang memakai pola respons berbeda (legacy style) sehingga client perlu handling tambahan.

## 11.2 Validasi payload belum merata
Sebagian endpoint sudah memakai skema validasi kuat, sebagian lainnya masih memerlukan penyamaan standar.

## 11.3 Runtime schema compatibility
Mekanisme patch schema saat startup telah dibatasi via flag env, tetapi ideal jangka panjang tetap migrasi formal sepenuhnya.

## 11.4 Technical debt UI/service typing
Masih ada area dengan typing yang bisa diperketat untuk menekan runtime bug.

## 11.5 Potensi bottleneck IO/loop di jalur tertentu
Sebagian operasi heavy (notifikasi massal, import besar) akan lebih aman bila dipindah ke background queue.

## 11.6 Strategi deployment masih finalisasi
Kapasitas server production masih dalam tahap negosiasi internal. Target sementara yang sedang diupayakan:
- `2 vCPU`,
- `8 GB RAM`,
- `100 GB NVMe`,
- `8 TB bandwidth`.

Implikasi:
- arsitektur tetap diarahkan efisien resource,
- tuning DB/query dan caching menjadi prioritas,
- perlu strategi scale-up/scale-out bertahap jika traffic meningkat.

---

## 12) Prinsip Pengembangan Lanjutan

## 12.1 Security-first backlog
Setiap fitur baru wajib melewati checklist: auth, authz, validation, logging, dan error contract.

## 12.2 API contract governance
Tetapkan satu format respons untuk semua endpoint dan enforce via helper/middleware.

## 12.3 Migration discipline
Semua perubahan schema lewat migration versioned, bukan patch startup.

## 12.4 Testability
Tambahkan coverage bertahap:
- unit test utility & validator,
- integration test endpoint kritikal,
- smoke test role-based routes.

## 12.5 Testing Strategy Berbasis Risiko
Strategi testing ditetapkan berdasarkan dampak bisnis/security, bukan sekadar coverage.

Prioritas implementasi:
- **Sekarang (high risk):**
  - unit test untuk validator, parsing nominal, auth helper, ownership checks file sensitif.
- **Segera (critical flows):**
  - integration test untuk login + OTP,
  - integration test payment manual flow (upload proof -> verify -> status update),
  - integration test approval jamaah/agen.
- **Medium term:**
  - E2E smoke test per role utama (`ADMIN`, `FINANCE`, `STAFF`, `AGEN`, `JAMAAH`) pada critical path.

KPI testing yang lebih tepat:
- bug escape rate di flow kritikal,
- waktu deteksi regresi,
- stabilitas release per sprint.

## 12.6 API Versioning & Deprecation Policy
Karena backend dikonsumsi multi-client (dashboard + frontend + kemungkinan integrasi lain), versi API harus dikelola eksplisit.

Kebijakan yang direkomendasikan:
- gunakan URL versioning: `/api/v1/...` untuk endpoint publik/stabil,
- perubahan breaking wajib masuk versi mayor berikutnya (`v2`),
- endpoint lama diberi masa deprecate terjadwal,
- changelog API wajib dipublikasikan internal sebelum release.

Aturan koordinasi breaking changes:
- PR yang mengubah kontrak API wajib mencantumkan impact client,
- update service layer client dilakukan sebelum endpoint lama dimatikan,
- release dilakukan dengan window migrasi yang disepakati tim.

## 12.7 Performance plan
- query optimization,
- selective indexing,
- caching untuk endpoint publik,
- async job queue untuk tugas non-blocking.

---

## 13) Rencana Pengembangan Masa Depan

## 13.1 Jangka pendek
- meratakan validasi schema di semua endpoint mutation,
- standarisasi error/response,
- audit typing di service layer dashboard/frontend,
- menuntaskan cleanup log debug yang tidak esensial,
- **prioritas tinggi**: memindahkan pengiriman email (terutama OTP) ke async queue untuk mencegah blocking/timeout pada lonjakan traffic.

## 13.2 Jangka menengah
- implement background queue (email, reminder, heavy imports),
- dashboard audit trail lebih komprehensif,
- notifikasi real-time,
- pencarian dan reporting dengan performa lebih tinggi,
- penyiapan payment flow document terpisah + SOP reconciliation.

## 13.3 Jangka panjang
- kemungkinan split ke service-domain (auth, booking, payment, content),
- event-driven integration,
- observability stack penuh (trace, metrics, alert),
- readiness untuk multi-branch/multi-tenant operation.

---

## 14) Panduan Operasional Tim
- Gunakan branching dan code review untuk semua perubahan.
- Wajib ada checklist security pada PR yang menyentuh auth/upload/payment.
- Semua perubahan schema disertai migration + rollback plan.
- Endpoint publik harus eksplisit dalam dokumen API.
- Perubahan kontrak API harus diinformasikan ke tim dashboard/frontend sebelum merge.

## 14.1 Deployment & Environment Strategy
Status deployment saat ini:
- infrastruktur production final masih proses negosiasi internal.

Strategi environment yang disarankan:
- minimal ada `development`, `staging`, `production`,
- validasi fitur/payment-critical di staging sebelum production,
- SSL/TLS wajib aktif di domain publik dan dashboard,
- secrets management tidak disimpan di repo.

CI/CD minimum yang disarankan:
- lint + type-check + build sebagai gate,
- release notes internal untuk perubahan backend yang berdampak ke client,
- rollback procedure terdokumentasi.

SLO operasional (draft):
- tetapkan target uptime layanan,
- definisikan on-call/alur eskalasi saat incident,
- lakukan postmortem untuk incident prioritas tinggi.

---

## 15) Glossary Konteks Bisnis
- **Jamaah**: pengguna akhir peserta program Umrah/Haji.
- **Agen**: mitra pemasaran/akuisisi jamaah.
- **Paket**: produk perjalanan (jadwal, harga, fasilitas).
- **Closing**: pencapaian agen dari konversi jamaah.
- **Approval**: proses verifikasi data/dokumen oleh internal.
- **PII**: Personally Identifiable Information, data yang dapat mengidentifikasi individu (KTP, paspor, kontak).
- **RPO**: Recovery Point Objective, seberapa banyak data yang boleh hilang saat disaster.
- **RTO**: Recovery Time Objective, seberapa cepat sistem harus pulih setelah disaster.
- **SLO**: Service Level Objective, target performa/uptime yang disepakati internal.

---

## 16) Kesimpulan
Sahabat Qolbu sudah berada pada fondasi yang baik untuk sistem operasional travel digital dengan pemisahan aplikasi yang jelas, model data bisnis yang kuat, dan baseline security yang memadai. Fokus pengembangan berikutnya adalah meningkatkan konsistensi kontrak API, pemerataan validasi, disiplin migrasi, dan penguatan performa/observability agar sistem semakin stabil dan scalable.

Dokumen ini dimaksudkan sebagai referensi konsep jangka panjang yang dapat dibaca berulang, diperbarui berkala, dan dipakai sebagai acuan alignment lintas tim product, engineering, dan operasional.

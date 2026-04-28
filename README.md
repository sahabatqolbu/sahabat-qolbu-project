# Sahabat Qolbu Project

![Backend Deploy](https://img.shields.io/github/actions/workflow/status/sahabatqolbu/sahabat-qolbu-project/deploy-backend.yml?branch=main&label=backend%20deploy)
![Dashboard Deploy](https://img.shields.io/github/actions/workflow/status/sahabatqolbu/sahabat-qolbu-project/deploy-dashboard.yml?branch=main&label=dashboard%20deploy)
![Frontend Deploy](https://img.shields.io/github/actions/workflow/status/sahabatqolbu/sahabat-qolbu-project/deploy-frontend.yml?branch=main&label=frontend%20deploy)
![API Parity Check](https://img.shields.io/github/actions/workflow/status/sahabatqolbu/sahabat-qolbu-project/api-parity-check.yml?branch=main&label=api%20parity)
![Last Commit](https://img.shields.io/github/last-commit/sahabatqolbu/sahabat-qolbu-project?label=last%20commit)
![License](https://img.shields.io/badge/license-ISC-blue)

## Overview

Sahabat Qolbu Project adalah monorepo untuk ekosistem digital operasional travel umroh dan haji yang memisahkan kanal publik, dashboard operasional internal, dan backend API. Repository ini dipakai internal tim untuk menjalankan alur end-to-end mulai dari akuisisi jamaah, pengelolaan paket, manajemen agen dan jamaah, pembayaran manual dengan verifikasi internal, sampai otomasi operasional seperti smoke check, monitoring, backup, dan incident drill. README ini menjadi pintu masuk terpadu untuk onboarding, setup lokal, operasi, dan kontribusi tim.

## Laporan Status Production Readiness

Update laporan: **28 April 2026**

Fokus kerja saat ini adalah menyiapkan project agar aman untuk production deploy. Pengembangan fitur payment baru sementara **dibekukan**; payment yang sudah ada tetap dijaga lewat regression test, tetapi scope utama dipindahkan ke production readiness, deployment discipline, dan persiapan document automation setelah production stabil.

### Ringkasan status

| Area | Status | Catatan |
| --- | --- | --- |
| Milestone 1 - CI all green | Completed | Backend governance, dashboard route checker, lint/build dashboard, build frontend, dan backend tests sudah hijau di workspace. |
| Milestone 2 - Database deploy strategy | Completed | Migration files sudah visible ke git, explicit reconciliation migration sudah dibuat, `db:push` production diblokir, dan production flow diarahkan ke `db:migrate`. |
| Milestone 3 - Deploy-ready infrastructure | In progress | Env template dan guard sudah dibuat. Sisa konfirmasi: runtime process cPanel, staging smoke, dan secret/env final. |
| Milestone 4 - Production deploy and rollback | Blocked | Menunggu credential production, Vercel project/env confirmation, staging DB verification, backup DB/uploads, dan approval deploy. |
| Milestone 5 - Document automation v1 | Planned | Masuk setelah production stabil: normalized `jamaah_documents`, tracker dashboard, reminder, dan export operasional. |

### Implementasi penting yang sudah selesai

- Backend governance scripts sudah membaca dokumen dari folder `docs/`.
- Dashboard menu route checker sudah memvalidasi route di `src/app/(dashboard)` dan `src/app/(mobile)`.
- Route drift jamaah diperbaiki: `Paket Saya` mengarah ke `/jamaah/packages`.
- Dashboard lint dibuat pass dengan legacy tech debt tetap terlihat sebagai warning.
- `backend/.gitignore` tidak lagi mengabaikan folder `drizzle/`.
- Migration guard baru tersedia lewat `cd backend && npm run check:migrations`.
- Production env guard baru tersedia lewat `cd backend && npm run check:prod-env`.
- Migration production diarahkan ke `cd backend && npm run db:migrate`.
- `cd backend && npm run db:push` sengaja dibuat gagal agar production tidak memakai schema push.
- Disposable local schema push dipindah ke `cd backend && npm run db:push:dev`.
- Runtime schema patch dibuat emergency-only dan tidak boleh aktif di production normal.
- Migration reconciliation dibuat di `backend/drizzle/migrations/0009_tidy_bastion.sql`.
- Backend CORS sekarang membaca `CORS_ORIGINS`, selain `FRONTEND_URL` dan `DASHBOARD_URL`.
- Env template ditambahkan untuk `dashboard/.env.example` dan `frontend/.env.example`.
- `.cpanel.yml` mengecualikan `.env*`, `node_modules/`, `public/uploads/`, dan `backups/` dari rsync deploy agar runtime uploads tidak terhapus.

### Bukti verifikasi terakhir

Command berikut sudah dijalankan dan pass di workspace:

| Command | Hasil |
| --- | --- |
| `cd backend && npm run check:migrations` | Pass |
| `cd backend && npm run check:runbook` | Pass |
| `cd backend && npm run check:api-contract` | Pass |
| `cd backend && npm run check:pii-governance` | Pass |
| `cd backend && npm test` | Pass, 48 passed dan 4 DB integration test skipped karena staging/test DB belum diaktifkan |
| `cd backend && npm run check:prod-env` | Pass dengan dummy production-safe env |
| `cd dashboard && npm run test:menu-routes` | Pass |
| `cd dashboard && npm run lint` | Pass dengan legacy warnings |
| `cd dashboard && npm run build` | Pass |
| `cd frontend && npm run lint` | Pass |
| `cd frontend && npm run build` | Pass |

### Sisa pekerjaan sebelum production deploy

- Stage dan commit `backend/drizzle/migrations/**` serta `backend/drizzle/migrations/meta/**` bersama perubahan deploy-readiness.
- Jalankan DB integration test di staging/test MySQL: `ENABLE_DB_INTEGRATION_TESTS=true npm run test:db-integration`.
- Jalankan backend smoke test ke staging/production target dengan `SMOKE_BASE_URL`.
- Konfirmasi cara restart Node.js backend di cPanel dan PIC executor deploy.
- Finalisasi env production untuk backend, dashboard, dan frontend.
- Backup database dan `public/uploads` tepat sebelum production deploy.
- Deploy backend ke cPanel, dashboard dan frontend ke Vercel, lalu catat evidence deploy di runbook.

### Arah setelah production stabil

Prioritas berikutnya adalah **document automation v1** untuk meringankan kerja tim admin. Scope awal yang direkomendasikan:

- normalisasi dokumen jamaah ke model row-based `jamaah_documents`;
- dashboard tracker status dokumen: complete, incomplete, rejected, expired, dan reupload-needed;
- reminder dokumen untuk missing document, H-45/H-30, dan rejected reupload;
- export manifest/checklist dokumen untuk admin dalam format Excel/PDF.

## Daftar Isi

- [Overview](#overview)
- [Laporan Status Production Readiness](#laporan-status-production-readiness)
- [Gambaran Arsitektur](#gambaran-arsitektur)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Project](#menjalankan-project)
- [Dokumentasi API](#dokumentasi-api)
- [Struktur Project](#struktur-project)
- [Panduan Kontribusi](#panduan-kontribusi)
- [Troubleshooting](#troubleshooting)
- [Changelog / Riwayat Versi](#changelog--riwayat-versi)
- [Maintainers](#maintainers)

## Gambaran Arsitektur

Repository ini berisi tiga aplikasi utama:

- [`frontend/`](frontend) - website publik/marketing berbasis Next.js App Router untuk homepage, listing paket, detail paket, dan landing page agen dinamis.
- [`dashboard/`](dashboard) - dashboard operasional berbasis Next.js App Router untuk role `ADMIN`, `FINANCE`, `STAFF`, `AGEN`, dan `JAMAAH`.
- [`backend/`](backend) - REST API Express yang menangani autentikasi, otorisasi, business rules, upload dokumen, state pembayaran, dan akses database MySQL via Drizzle ORM.

Arsitektur backend mengikuti pola modular monolith. Entry point server ada di [`backend/server.js`](backend/server.js), komposisi middleware utama di [`backend/src/app.js`](backend/src/app.js), dan agregasi route domain di [`backend/src/routes/api.js`](backend/src/routes/api.js). Kanal dashboard diproteksi lewat [`dashboard/src/proxy.ts`](dashboard/src/proxy.ts) dan validasi session JWT server-side di [`dashboard/src/lib/validateSession.ts`](dashboard/src/lib/validateSession.ts). Kanal publik frontend mengonsumsi endpoint publik backend melalui [`frontend/src/lib/public-api.ts`](frontend/src/lib/public-api.ts).

```mermaid
flowchart LR
  U1[Pengunjung publik] --> F[frontend\nNext.js 16]
  U2[Tim internal / agen / jamaah] --> D[dashboard\nNext.js 16]

  F -->|GET /api/public/*| B[backend\nExpress 5 API]
  D -->|cookie auth + axios| B

  B -->|Drizzle ORM| DB[(MySQL)]
  B --> UP[public/uploads]
  B --> PUP[/api/protected-uploads/*]

  UP --> F
  PUP --> D
```

### Komponen utama dan interaksinya

| Komponen | Peran | Bukti utama |
| --- | --- | --- |
| Frontend publik | Homepage marketing, listing paket, detail paket, landing agen `/<namaagen>` | [`frontend/src/app/(marketing)/page.tsx`](frontend/src/app/%28marketing%29/page.tsx), [`frontend/src/app/(marketing)/packages/page.tsx`](frontend/src/app/%28marketing%29/packages/page.tsx), [`frontend/src/app/[namaagen]/page.tsx`](frontend/src/app/%5Bnamaagen%5D/page.tsx) |
| Dashboard internal | Workspace role-based dan redirect berdasarkan role | [`dashboard/src/app/page.tsx`](dashboard/src/app/page.tsx), [`dashboard/src/lib/routeAccess.ts`](dashboard/src/lib/routeAccess.ts), [`dashboard/src/lib/menu-config.ts`](dashboard/src/lib/menu-config.ts) |
| Backend API | Auth, public data, admin, jamaah, agen, master, notifications, calendar | [`backend/src/routes/api.js`](backend/src/routes/api.js) |
| Session & auth | Login email/password + OTP, cookie `access_token`, `/auth/me` | [`backend/src/routes/auth.js`](backend/src/routes/auth.js), [`backend/src/controllers/authController.js`](backend/src/controllers/authController.js) |
| Data layer | MySQL + Drizzle schema | [`backend/src/db/index.js`](backend/src/db/index.js), [`backend/src/db/schema.js`](backend/src/db/schema.js), [`backend/drizzle.config.js`](backend/drizzle.config.js) |
| Upload & file access | Static public assets + protected sensitive uploads | [`backend/src/app.js`](backend/src/app.js), [`dashboard/src/lib/utils.ts`](dashboard/src/lib/utils.ts) |
| Operational automation | Deploy, parity checks, uptime, backup, restore drill, incident drill | [`.github/workflows/`](.github/workflows), [`backend/src/scripts/`](backend/src/scripts), [`scripts/audit-api-parity.sh`](scripts/audit-api-parity.sh) |

### Role workspace ringkas

| Role | Default route | Catatan |
| --- | --- | --- |
| `ADMIN` | `/admin` | Kontrol penuh: user, paket, jamaah, agen, transaksi, master data, laporan |
| `FINANCE` | `/finance` | Akses transaksi, laporan, POS, dan subset route admin melalui rewrite/dashboard alias |
| `STAFF` | `/staff` | Akses operasional terbatas; beberapa route diarahkan ke workspace staff root |
| `AGEN` | `/agen` | Profil agen, jamaah binaan, komisi, paket, website agen |
| `JAMAAH` | `/jamaah` | Self-service profile, dokumen, paket, pembayaran, kalender |

### Dokumen referensi internal

#### Arsitektur, domain, dan governance

- [`docs/APP_CONCEPT.md`](docs/APP_CONCEPT.md) - konsep produk, arsitektur, dan role workspace
- [`docs/STAFF_MANAGEMENT.md`](docs/STAFF_MANAGEMENT.md) - detail implementasi fitur staff management
- [`docs/PII_ACCESS_MATRIX.md`](docs/PII_ACCESS_MATRIX.md) - matrix akses PII lintas role
- [`docs/CODE_REVIEW_REQUIREMENTS.md`](docs/CODE_REVIEW_REQUIREMENTS.md) - catatan review teknis dan requirement operasional

#### API, pembayaran, dan operasi

- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) - standar kontrak API, response envelope, dan governance OpenAPI
- [`docs/PAYMENT_FLOW.md`](docs/PAYMENT_FLOW.md) - state machine pembayaran dan SOP verifikasi
- [`docs/DEPLOYMENT_RUNBOOK.md`](docs/DEPLOYMENT_RUNBOOK.md) - panduan deploy, smoke test, rollback, dan monitoring
- [`docs/INCIDENT_RESPONSE_PLAYBOOK.md`](docs/INCIDENT_RESPONSE_PLAYBOOK.md) - severity, eskalasi, dan SOP incident

#### Progress dan appendices

- [`docs/CONCEPT_EXECUTION_PLAN.md`](docs/CONCEPT_EXECUTION_PLAN.md) - execution plan dan snapshot progress implementasi
- [`docs/CODE_IMPROVEMENTS.md`](docs/CODE_IMPROVEMENTS.md) - ringkasan hardening dan improvement yang pernah dicatat
- [`backend/SECURITY.md`](backend/SECURITY.md) - catatan keamanan backend
- [`backend/DB_INTEGRATION_TESTING.md`](backend/DB_INTEGRATION_TESTING.md) - panduan DB-backed integration test
- [`backend/STORAGE_BACKUP_RUNBOOK.md`](backend/STORAGE_BACKUP_RUNBOOK.md) - runbook backup uploads
- [`backend/RESTORE_DRILL_TEMPLATE.md`](backend/RESTORE_DRILL_TEMPLATE.md) - template laporan restore drill

## Tech Stack

| Area | Stack utama | Versi / catatan |
| --- | --- | --- |
| Backend API | Node.js, Express, Drizzle ORM, MySQL2, Zod, JWT, Nodemailer, Multer, Jimp, XLSX | `express@5.2.1`, `drizzle-orm@0.45.1`, `mysql2@3.16.0`, `zod@4.3.6`, `jsonwebtoken@9.0.3`, `nodemailer@7.0.12`, `multer@2.0.2`, `jimp@1.6.0`, `xlsx@0.18.5` |
| Dashboard | Next.js App Router, React, TypeScript, Zustand, TanStack Query, Axios, jose, Radix UI, Recharts, Tailwind CSS 4 | `next@16.1.1`, `react@19.2.3`, `zustand@5.0.9`, `@tanstack/react-query@5.90.16`, `axios@1.13.2`, `jose@6.1.0`, `tailwindcss@^4` |
| Frontend publik | Next.js App Router, React, TypeScript, TanStack Query, Axios, Framer Motion, Next SEO, Vercel Analytics, Radix UI, Tailwind CSS 4 | `next@16.1.1`, `react@19.2.3`, `@tanstack/react-query@5.90.16`, `axios@1.13.2`, `framer-motion@12.23.26`, `next-seo@7.0.1`, `@vercel/analytics@1.6.1`, `tailwindcss@^4` |
| Tooling | ESLint, Nodemon, Drizzle Kit, Node built-in test runner | `eslint@^9`, `nodemon@3.1.11`, `drizzle-kit@0.31.8` |
| CI/CD & ops | GitHub Actions, Vercel CLI, SCP deploy ke cPanel, bash + Python parity audit | Workflows di [`.github/workflows/`](.github/workflows); backend deploy juga memakai [`.cpanel.yml`](.cpanel.yml) |
| Runtime baseline | Node.js | Workflow deploy/test memakai Node `20` |

## Prerequisites

| Kebutuhan | Minimum | Catatan |
| --- | --- | --- |
| Node.js | 20+ | Seluruh workflow CI memakai Node 20 |
| npm | 10+ | Lockfile semua app memakai npm lockfile v3 |
| MySQL | 8+ | Backend dan DB integration test bergantung pada MySQL |
| Python | 3.x | Diperlukan bila menjalankan [`scripts/audit-api-parity.sh`](scripts/audit-api-parity.sh) secara lokal |
| SMTP account | sesuai provider | Diperlukan untuk uji login OTP end-to-end di luar mode test |

## Instalasi & Setup

### 1. Clone repository

```bash
git clone https://github.com/sahabatqolbu/sahabat-qolbu-project.git
cd sahabat-qolbu-project
```

### 2. Install dependency tiap aplikasi

```bash
cd backend && npm install
cd ../dashboard && npm install
cd ../frontend && npm install
```

### 3. Siapkan environment

#### Backend

Gunakan template [`backend/.env.example`](backend/.env.example):

```bash
cp backend/.env.example backend/.env
```

Minimal backend harus memiliki nilai valid untuk:

- `JWT_SECRET` (minimal 32 karakter)
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

#### Dashboard

Buat `dashboard/.env.local` atau lengkapi file env lokal dengan nilai berikut:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Sahabat Qolbu Dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3001
JWT_SECRET=<harus sama dengan backend JWT_SECRET>
```

#### Frontend

Buat `frontend/.env.local` dengan nilai berikut:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Sahabat Qolbu
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Jalankan aplikasi lokal

Urutan yang disarankan:

1. jalankan backend lebih dulu di port `5000`
2. jalankan dashboard di port `3001`
3. jalankan frontend di port `3000`

## Konfigurasi

### Backend environment

#### Core, auth, database

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `NODE_ENV` | `development` | Mode runtime backend |
| `PORT` | `5000` | Port server backend |
| `ENABLE_LOGS` | `true` | Mengaktifkan logging aplikasi di luar mode production yang ketat |
| `JWT_SECRET` | wajib diisi | Secret JWT; backend menolak start bila kosong atau kurang dari 32 karakter |
| `JWT_EXPIRE` | `7d` | Masa berlaku token JWT |
| `COOKIE_SECURE` | `false` di template, wajib `true` production | Override perilaku cookie secure; production harus HTTPS cookie |
| `DB_HOST` | `localhost` | Host MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USER` | `your_cpanel_user` | Username database |
| `DB_PASSWORD` | `your_secure_password` | Password database |
| `DB_NAME` | `sahabatqolbu_db` | Nama database |
| `DB_POOL_MAX` | `5` | Batas koneksi pool MySQL, default rendah untuk shared hosting |
| `DB_POOL_IDLE_TIMEOUT` | `30000` | Idle timeout pool MySQL dalam ms |
| `TRUST_PROXY` | `1` | Nilai `true`, `false`, atau hop count; production cPanel/nginx harus diset eksplisit |
| `ENABLE_RUNTIME_SCHEMA_PATCH` | `false` | Emergency-only compatibility patch; tidak boleh aktif di production normal |
| `ALLOW_PROD_RUNTIME_SCHEMA_PATCH` | `false` | Override darurat agar runtime patch boleh aktif di production setelah backup dan approval |
| `BACKEND_URL` | fallback `http://localhost:5000` | Base URL backend untuk membentuk URL file/dokumen tertentu |

#### Email dan OTP

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.hostinger.com` | Host SMTP |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_USER` | `noreply@sahabatqolbu.com` | Username SMTP |
| `SMTP_PASS` | wajib diisi | Password SMTP |
| `SMTP_FROM` | `Sahabat Qolbu <noreply@sahabatqolbu.com>` | Sender default email |
| `OTP_LENGTH` | `6` | Panjang OTP |
| `OTP_EXPIRY_MINUTES` | `5` | Masa berlaku OTP |
| `EMAIL_VERIFY_ON_BOOT` | `false` bila tidak diset | Verifikasi koneksi SMTP saat boot |
| `EMAIL_QUEUE_ENABLED` | `true` bila tidak diset | Mengaktifkan antrian email async di luar mode test |

#### Frontend URL, CORS, upload, rate limit, tracking

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `FRONTEND_URL` | `https://sahabatqolbu.com` | URL frontend publik untuk CORS dan tautan email |
| `DASHBOARD_URL` | `https://dashboard.sahabatqolbu.com` | URL dashboard untuk CORS dan tautan email |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Daftar origin tambahan; production gunakan origin HTTPS tambahan bila ada |
| `MAX_FILE_SIZE` | `5242880` | Batas ukuran upload file |
| `RATE_LIMIT_WINDOW` | `15` | Window rate limit authenticated API dalam menit |
| `RATE_LIMIT_MAX` | `300` | Batas request authenticated API per window |
| `PUBLIC_RATE_LIMIT_WINDOW` | fallback `15` | Window rate limit endpoint public read |
| `PUBLIC_RATE_LIMIT_MAX` | fallback `600` | Batas request endpoint public read |
| `AUTH_RATE_LIMIT_WINDOW` | fallback `15` | Window rate limit login/request OTP |
| `AUTH_RATE_LIMIT_MAX` | fallback `5` | Batas request login/request OTP |
| `OTP_RATE_LIMIT_WINDOW` | fallback `5` | Window rate limit verifikasi OTP |
| `OTP_RATE_LIMIT_MAX` | fallback `3` | Batas verifikasi OTP |
| `CREATE_ACCOUNT_RATE_LIMIT_WINDOW` | fallback `60` | Window rate limit pembuatan akun |
| `CREATE_ACCOUNT_RATE_LIMIT_MAX` | fallback `5` | Batas pembuatan akun |
| `DISABLE_RATE_LIMIT` | `false` bila tidak diset | Menonaktifkan seluruh limiter |
| `ERROR_TRACKING_ENABLED` | `false` bila tidak diset | Mengaktifkan hook error tracking terpusat |
| `ERROR_TRACKING_PROVIDER` | `log-only` | Nama provider tracker; saat ini default hanya log event tersanitasi |

#### Agent/business, backup, smoke, monitoring, drill, testing

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `AGENT_COMMISSION_PERCENTAGE` | fallback `10` | Persentase komisi agen |
| `AGENT_KTP_REUPLOAD_EXPIRY_HOURS` | fallback `72` | Batas waktu permintaan upload ulang KTP agen |
| `BACKUP_OUTPUT_DIR` | fallback `backups/uploads` | Lokasi backup uploads relatif ke `backend/` |
| `BACKUP_RETENTION_DAYS` | fallback `14` | Retensi backup uploads |
| `BACKUP_NAME` | `latest` saat restore | Nama backup yang akan direstore |
| `SMOKE_BASE_URL` | fallback `http://localhost:5000` | Base URL untuk `npm run smoke` |
| `SMOKE_AUTH_COOKIE` | tidak diset | Cookie auth opsional untuk smoke auth endpoint |
| `ENABLE_DB_INTEGRATION_TESTS` | `false` bila tidak diset | Mengaktifkan suite DB integration test |
| `BACKEND_HEALTHCHECK_URL` | tidak diset | Target health check backend |
| `BACKEND_PUBLIC_HEALTHCHECK_URL` | tidak diset | Target health check endpoint publik backend |
| `BACKEND_DOCS_BLOCK_URL` | tidak diset | Target probe hardening docs API |
| `DASHBOARD_HEALTHCHECK_URL` | tidak diset | Target probe dashboard |
| `FRONTEND_HEALTHCHECK_URL` | tidak diset | Target probe frontend |
| `AUTH_GUARD_URL` | tidak diset | Target critical auth/session guard |
| `AUTH_GUARD_EXPECTED_STATUS` | fallback `200` | Expected status auth guard |
| `AUTH_GUARD_COOKIE` | tidak diset | Cookie auth untuk guard |
| `PAYMENT_GUARD_URL` | tidak diset | Target critical payment-flow guard |
| `PAYMENT_GUARD_EXPECTED_STATUS` | fallback `200` | Expected status payment guard |
| `PAYMENT_GUARD_COOKIE` | fallback ke `AUTH_GUARD_COOKIE` | Cookie auth untuk payment guard |
| `PUBLIC_HEALTH_GUARD_URL` | tidak diset | Target public API guard |
| `PUBLIC_HEALTH_GUARD_EXPECTED_STATUS` | fallback `200` | Expected status public guard |
| `INCIDENT_DRILL_SCENARIO` | `auth-payment-guard` | Label skenario untuk incident drill |

#### Variable yang ada di template tetapi tidak terlihat dipakai pada jalur runtime utama yang dipindai

| Variable | Nilai di template | Catatan |
| --- | --- | --- |
| `ADMIN_IP_WHITELIST` | kosong | Ada di template; helper `ipWhitelist` tersedia di config security tetapi tidak terlihat di-mount pada app utama |
| `DEBUG` | `false` | Ada di template, tidak terlihat dipakai pada file runtime utama yang dipindai |
| `UPLOAD_PATH` | `./public/uploads` | Ada di template, tetapi jalur upload utama yang dipakai code dan scripts saat ini tetap `public/uploads` |

### Dashboard environment

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Base URL API untuk axios client dashboard |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:5000` | Base URL server backend untuk asset/protected uploads |
| `NEXT_PUBLIC_FRONTEND_URL` | fallback `http://localhost:3000` | Base URL frontend publik, dipakai misalnya pada halaman website agen |
| `NEXT_PUBLIC_APP_NAME` | `Sahabat Qolbu Dashboard` | Metadata aplikasi lokal |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | URL dashboard lokal |
| `NEXT_PUBLIC_DEBUG_LOGS` | aktif otomatis di dev, opsional `true` | Mengaktifkan debug log axios client |
| `JWT_SECRET` | wajib diisi | Dipakai server-side dashboard untuk memverifikasi cookie `access_token`; nilainya harus sama dengan backend |

### Frontend environment

| Variable | Default / contoh di repo | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Base URL API publik untuk listing/detail paket dan landing agen |
| `NEXT_PUBLIC_DASHBOARD_URL` | fallback `http://localhost:3001` | Base URL dashboard untuk redirect auth dari frontend |
| `NEXT_PUBLIC_APP_NAME` | `Sahabat Qolbu` | Metadata aplikasi lokal |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL frontend lokal |

### Config file penting

| File | Fungsi |
| --- | --- |
| [`backend/.env.example`](backend/.env.example) | Template environment backend |
| [`dashboard/.env.example`](dashboard/.env.example) | Template environment dashboard |
| [`frontend/.env.example`](frontend/.env.example) | Template environment frontend publik |
| [`backend/drizzle.config.js`](backend/drizzle.config.js) | Konfigurasi Drizzle Kit untuk schema dan migration output |
| [`backend/openapi/openapi.v1.baseline.yaml`](backend/openapi/openapi.v1.baseline.yaml) | Baseline kontrak OpenAPI untuk domain prioritas |
| [`backend/src/config/security.js`](backend/src/config/security.js) | Allowed origins, helmet config, request ID, security helpers |
| [`dashboard/next.config.ts`](dashboard/next.config.ts) | Remote image pattern, redirect/rewrite role `STAFF` dan `FINANCE` |
| [`dashboard/src/proxy.ts`](dashboard/src/proxy.ts) | Route protection untuk prefix `/admin`, `/finance`, `/staff`, `/agen`, `/jamaah` |
| [`dashboard/src/lib/validateSession.ts`](dashboard/src/lib/validateSession.ts) | Validasi JWT server-side di dashboard |
| [`frontend/next.config.ts`](frontend/next.config.ts) | Config Next.js frontend publik |
| [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml) | CI deploy backend + compliance checks + optional smoke |
| [`.github/workflows/deploy-dashboard.yml`](.github/workflows/deploy-dashboard.yml) | CI lint, route coverage check, build, deploy dashboard |
| [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml) | CI lint, build, deploy frontend |
| [`.cpanel.yml`](.cpanel.yml) | Descriptor rsync deployment backend ke cPanel |
| [`scripts/audit-api-parity.sh`](scripts/audit-api-parity.sh) | Audit keselarasan route/service dashboard-backend |

### GitHub Actions secrets dan variables yang dipakai workflow

| Workflow area | Secret / variable | Fungsi |
| --- | --- | --- |
| Backend DB integration | `DB_TEST_HOST`, `DB_TEST_PORT`, `DB_TEST_USER`, `DB_TEST_PASSWORD`, `DB_TEST_NAME` | Menyalakan job optional DB integration test di CI |
| Backend deploy smoke | `BACKEND_SMOKE_BASE_URL`, `BACKEND_SMOKE_AUTH_COOKIE` | Smoke check pasca deploy backend |
| Uptime / drill / critical alert | `BACKEND_HEALTHCHECK_URL`, `BACKEND_PUBLIC_HEALTHCHECK_URL`, `BACKEND_DOCS_BLOCK_URL`, `DASHBOARD_HEALTHCHECK_URL`, `FRONTEND_HEALTHCHECK_URL`, `AUTH_GUARD_URL`, `AUTH_GUARD_EXPECTED_STATUS`, `AUTH_GUARD_COOKIE`, `PAYMENT_GUARD_URL`, `PAYMENT_GUARD_EXPECTED_STATUS`, `PAYMENT_GUARD_COOKIE`, `PUBLIC_HEALTH_GUARD_URL`, `PUBLIC_HEALTH_GUARD_EXPECTED_STATUS`, `OPS_ALERT_WEBHOOK_URL`, `SEV1_PAGER_WEBHOOK_URL` | Monitoring, anomaly guard, incident drill |
| Upload backup / restore drill | `BACKUP_OUTPUT_DIR`, `BACKUP_RETENTION_DAYS` (repo variables) | Mengatur lokasi dan retensi backup uploads |
| Vercel deploy | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, serta pasangan `VERCEL_FRONTEND_*` | Deploy dashboard/frontend ke Vercel |
| Backend deploy | `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY` | SCP backend ke cPanel |

## Menjalankan Project

### Development

| App | Command | URL default |
| --- | --- | --- |
| Backend | `cd backend && npm run dev` | `http://localhost:5000` |
| Dashboard | `cd dashboard && npm run dev` | `http://localhost:3001` |
| Frontend | `cd frontend && npm run dev` | `http://localhost:3000` |

### Production build / start lokal

| App | Build | Start |
| --- | --- | --- |
| Backend | tidak ada langkah build terpisah | `cd backend && npm start` |
| Dashboard | `cd dashboard && npm run build` | `cd dashboard && npm run start` |
| Frontend | `cd frontend && npm run build` | `cd frontend && npm run start` |

### Backend scripts

| Command | Fungsi |
| --- | --- |
| `cd backend && npm test` | Menjalankan suite test Node bawaan untuk `src/tests/*.js` |
| `cd backend && npm run test:db-integration` | Menjalankan DB-backed integration test kritikal |
| `cd backend && npm run smoke` | Smoke check health, API root, docs hardening, public endpoints, dan optional auth `/auth/me` |
| `cd backend && npm run check:runbook` | Guard kepatuhan deployment runbook |
| `cd backend && npm run check:api-contract` | Guard kepatuhan kontrak API dan baseline OpenAPI |
| `cd backend && npm run check:pii-governance` | Guard artefak governance PII |
| `cd backend && npm run check:migrations` | Guard migration SQL/meta, output Drizzle, dan larangan `db:push` production |
| `cd backend && npm run check:prod-env` | Guard env production; jalankan dengan env target sebelum deploy/restart |
| `cd backend && npm run monitor:uptime` | Probe uptime backend/dashboard/frontend |
| `cd backend && npm run monitor:critical` | Probe anomaly auth/payment/public API |
| `cd backend && npm run drill:incident` | Menjalankan incident drill dan membuat artifact report |
| `cd backend && npm run backup:uploads` | Snapshot backup folder uploads |
| `cd backend && npm run restore:uploads` | Restore backup uploads |
| `cd backend && npm run restore:smoke` | Smoke check setelah restore uploads |
| `cd backend && npm run db:migrate` | Jalankan migration SQL yang sudah direview |
| `cd backend && npm run db:push` | Sengaja gagal agar production tidak memakai schema push |
| `cd backend && npm run db:push:dev` | Push schema hanya untuk database lokal disposable |
| `cd backend && npm run db:generate` | Generate migration artifacts |
| `cd backend && npm run db:studio` | Buka Drizzle Studio |
| `cd backend && npm run seed` | Menjalankan seed database |

### Dashboard scripts

| Command | Fungsi |
| --- | --- |
| `cd dashboard && npm run lint` | Lint dashboard |
| `cd dashboard && npm run test:menu-routes` | Validasi semua menu route punya halaman yang bisa diakses |
| `cd dashboard && npm run build` | Build dashboard |

### Frontend scripts

| Command | Fungsi |
| --- | --- |
| `cd frontend && npm run lint` | Lint frontend |
| `cd frontend && npm run build` | Build frontend |

### Workflow otomatis yang sudah ada di repo

| Workflow | File | Trigger utama |
| --- | --- | --- |
| Backend deploy | [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml) | push ke `main` pada perubahan `backend/**` |
| Dashboard deploy | [`.github/workflows/deploy-dashboard.yml`](.github/workflows/deploy-dashboard.yml) | push ke `main` pada perubahan `dashboard/**` |
| Frontend deploy | [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml) | push ke `main` pada perubahan `frontend/**` |
| Backend DB integration | [`.github/workflows/backend-db-integration.yml`](.github/workflows/backend-db-integration.yml) | push / manual |
| API parity | [`.github/workflows/api-parity-check.yml`](.github/workflows/api-parity-check.yml) | push / PR / manual |
| Uptime monitor | [`.github/workflows/uptime-monitor.yml`](.github/workflows/uptime-monitor.yml) | schedule `*/30 * * * *` |
| Critical alert monitor | [`.github/workflows/critical-alert-monitor.yml`](.github/workflows/critical-alert-monitor.yml) | schedule `*/15 * * * *` |
| Uploads backup | [`.github/workflows/uploads-backup.yml`](.github/workflows/uploads-backup.yml) | schedule harian |
| Uploads restore drill | [`.github/workflows/uploads-restore-drill.yml`](.github/workflows/uploads-restore-drill.yml) | schedule bulanan |
| Incident drill | [`.github/workflows/incident-drill.yml`](.github/workflows/incident-drill.yml) | schedule bulanan |

### Dokumen operasi terkait

- [`docs/DEPLOYMENT_RUNBOOK.md`](docs/DEPLOYMENT_RUNBOOK.md)
- [`docs/INCIDENT_RESPONSE_PLAYBOOK.md`](docs/INCIDENT_RESPONSE_PLAYBOOK.md)
- [`backend/STORAGE_BACKUP_RUNBOOK.md`](backend/STORAGE_BACKUP_RUNBOOK.md)
- [`backend/RESTORE_DRILL_TEMPLATE.md`](backend/RESTORE_DRILL_TEMPLATE.md)

## Dokumentasi API

### Base path dan version bridge

Backend mengekspos API pada dua base path yang aktif bersamaan:

- `/api`
- `/api/v1`

Keduanya dimount dari router yang sama di [`backend/src/routes/api.js`](backend/src/routes/api.js). Rujukan dokumentasi utamanya ada di [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md), [`docs/PAYMENT_FLOW.md`](docs/PAYMENT_FLOW.md), dan baseline kontrak machine-readable di [`backend/openapi/openapi.v1.baseline.yaml`](backend/openapi/openapi.v1.baseline.yaml).

### Model autentikasi

- Login dimulai dengan `POST /auth/login` menggunakan email dan password.
- Verifikasi login memakai `POST /auth/verify-otp`.
- Session disimpan dalam cookie httpOnly `access_token`.
- Profil session saat ini diakses melalui `GET /auth/me`.
- Logout memakai `POST /auth/logout`.
- Untuk request mutating berbasis cookie, backend mewajibkan validasi `Origin` / `Referer` dan memblokir request cross-site.
- Dashboard memverifikasi cookie JWT yang sama secara server-side melalui [`dashboard/src/lib/validateSession.ts`](dashboard/src/lib/validateSession.ts).

### Format response

#### Success response

```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {}
}
```

#### Paginated response

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

#### Error response

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "email",
      "message": "Format email tidak valid"
    }
  ]
}
```

### HTTP status convention

- `200` - read/update berhasil
- `201` - create berhasil
- `400` - input / validasi tidak valid
- `401` - unauthorized / token tidak valid
- `403` - forbidden / role tidak berhak / security guard aktif
- `404` - resource tidak ditemukan
- `409` - conflict
- `422` - rule bisnis gagal
- `429` - rate limit
- `500` - internal server error

### Endpoint catalog ringkas

#### Auth

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Login email/password dan kirim OTP |
| `POST` | `/api/auth/verify-otp` | Verifikasi OTP login |
| `POST` | `/api/auth/request-otp` | Minta OTP baru |
| `GET` | `/api/auth/me` | Ambil user aktif dari session |
| `POST` | `/api/auth/logout` | Logout |
| `POST` | `/api/auth/password/request-otp` | Minta OTP ganti password |
| `POST` | `/api/auth/password/change` | Ganti password dengan OTP |
| `POST` | `/api/auth/email/request-otp` | Minta OTP ganti email |
| `POST` | `/api/auth/email/change` | Ganti email dengan OTP |

Semua endpoint di atas juga tersedia via prefix `/api/v1`.

#### Public

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/public/health-check` | Health check router public |
| `GET` | `/api/public/packages` | Listing paket publik |
| `GET` | `/api/public/packages/:id` | Detail paket publik |
| `GET` | `/api/public/agents/slugs` | Daftar slug landing agen |
| `GET` | `/api/public/agents/:slug` | Payload landing page agen |

#### Admin domain

| Prefix / endpoint contoh | Fungsi |
| --- | --- |
| `/api/admin/users` | CRUD user, import, bulk action, reset password |
| `/api/admin/staff` | CRUD dan statistik staff |
| `/api/admin/dashboard/stats` | Statistik dashboard admin |
| `/api/admin/transactions` | Daftar transaksi |
| `/api/admin/transactions/:id/verify` | Verifikasi transaksi oleh `ADMIN` / `FINANCE` |
| `/api/admin/packages` | CRUD paket, upload itinerary PDF, upload image, import/export |
| `/api/admin/finance/pos/*` | Assign package dan reminder POS |

#### Jamaah domain

| Prefix / endpoint contoh | Fungsi |
| --- | --- |
| `/api/jamaah/profile` | Self-service profile jamaah |
| `/api/jamaah/biodata` | Update biodata jamaah |
| `/api/jamaah/documents` | Upload dokumen jamaah |
| `/api/jamaah/payments` | Lihat pembayaran milik sendiri |
| `/api/jamaah/package` | Lihat paket jamaah |
| `/api/jamaah/package/request` | Request konsultasi paket |
| `/api/jamaah/admin/*` | Alias route admin untuk manajemen jamaah, dokumen, dan payment |
| `/api/admin/jamaah/*` | Explicit alias mount ke modul jamaah admin |

#### Agen domain

| Prefix / endpoint contoh | Fungsi |
| --- | --- |
| `/api/agen/profile` | Profil agen, submit approval, upload dokumen/foto/logo |
| `/api/agen/packages` | Paket tersedia untuk agen |
| `/api/agen/jamaah` | Manajemen jamaah milik agen |
| `/api/agen/dashboard` | Statistik dashboard agen |
| `/api/agen/commission` | Komisi agen |
| `/api/agen/notifications*` | Notifikasi agen |
| `/api/agen/reminders/*` | Reminder jamaah oleh agen |
| `/api/admin/agen/*` | Explicit alias mount ke modul admin agen |

#### Master data, notifications, calendar

| Prefix | Fungsi |
| --- | --- |
| `/api/master/*` | Hotel, maskapai, bandara, bank, testimonial, FAQ, gallery, company, agent level/requirement/purpose, periods |
| `/api/admin/master/*` | Alias mount ke modul master |
| `/api/notifications/*` | Route notifikasi |
| `/api/calendar/*` | Route kalender |

### Upload dan akses file

- Public asset folder yang bisa diakses static: `company`, `hotels`, `airlines`, `packages`, `itinerary`, `general`
- Sensitive folder yang diblokir dari akses static langsung: `profiles`, `jamaah`, `agents`, `documents`, `payments`
- Akses file sensitif harus melalui endpoint terproteksi: `/api/protected-uploads/:folder/:filename`

### Catatan keamanan kontrak API

- Public docs endpoint sengaja diblokir pada runtime: `/api/openapi`, `/api/docs`, `/api/swagger`, termasuk varian `/api/v1/*`
- Status yang diharapkan untuk akses publik ke docs tersebut adalah `403` dengan code `SECURITY_DOCS_DISABLED`
- Checklist review kontrak backend ada di [`.github/pull_request_template.md`](.github/pull_request_template.md)
- Sumber standar kontrak ada di [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)

## Struktur Project

```text
sahabat-qolbu-project/
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ drizzle.config.js
│  ├─ openapi/
│  │  └─ openapi.v1.baseline.yaml
│  ├─ public/
│  │  └─ uploads/
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ db/
│  │  ├─ middlewares/
│  │  ├─ routes/
│  │  ├─ scripts/
│  │  ├─ tests/
│  │  ├─ utils/
│  │  └─ validators/
│  ├─ SECURITY.md
│  ├─ DB_INTEGRATION_TESTING.md
│  ├─ STORAGE_BACKUP_RUNBOOK.md
│  └─ RESTORE_DRILL_TEMPLATE.md
├─ dashboard/
│  ├─ package.json
│  ├─ next.config.ts
│  └─ src/
│     ├─ app/
│     │  ├─ (dashboard)/
│     │  ├─ (mobile)/
│     │  ├─ login/
│     │  └─ verify-otp/
│     ├─ components/
│     ├─ lib/
│     ├─ services/
│     ├─ stores/
│     └─ scripts/
├─ frontend/
│  ├─ package.json
│  ├─ next.config.ts
│  └─ src/
│     ├─ app/
│     │  ├─ (marketing)/
│     │  └─ [namaagen]/
│     ├─ components/
│     ├─ context/
│     └─ lib/
├─ scripts/
│  └─ audit-api-parity.sh
├─ .github/
│  └─ workflows/
├─ .cpanel.yml
├─ docs/
│  ├─ APP_CONCEPT.md
│  ├─ API_CONTRACT.md
│  ├─ PAYMENT_FLOW.md
│  ├─ DEPLOYMENT_RUNBOOK.md
│  ├─ INCIDENT_RESPONSE_PLAYBOOK.md
│  ├─ PII_ACCESS_MATRIX.md
│  ├─ CONCEPT_EXECUTION_PLAN.md
│  ├─ CODE_IMPROVEMENTS.md
│  ├─ CODE_REVIEW_REQUIREMENTS.md
│  ├─ STAFF_MANAGEMENT.md
│  └─ info.md
```

### Fungsi folder utama

| Path | Fungsi |
| --- | --- |
| [`backend/src/routes/`](backend/src/routes) | Pemetaan route per domain: auth, public, admin, jamaah, agen, master, notifications, calendar |
| [`backend/src/controllers/`](backend/src/controllers) | Business logic per domain |
| [`backend/src/db/`](backend/src/db) | Koneksi DB, schema Drizzle, seed |
| [`backend/src/scripts/`](backend/src/scripts) | Smoke check, monitoring, governance guard, backup, restore, incident drill |
| [`backend/src/tests/`](backend/src/tests) | Regression test, API integration lite, DB integration kritikal |
| [`dashboard/src/app/(dashboard)/`](dashboard/src/app/%28dashboard%29) | Shell desktop untuk admin/finance/staff |
| [`dashboard/src/app/(mobile)/`](dashboard/src/app/%28mobile%29) | Shell mobile / lightweight workspace untuk agen dan jamaah |
| [`dashboard/src/services/`](dashboard/src/services) | Service layer API dashboard |
| [`dashboard/src/stores/`](dashboard/src/stores) | Zustand stores untuk auth/OTP |
| [`dashboard/src/lib/`](dashboard/src/lib) | Axios client, session validation, route policy, util gambar |
| [`frontend/src/app/(marketing)/`](frontend/src/app/%28marketing%29) | Halaman publik brand dan paket |
| [`frontend/src/app/[namaagen]/`](frontend/src/app/%5Bnamaagen%5D) | Landing page agen dinamis |
| [`frontend/src/lib/public-api.ts`](frontend/src/lib/public-api.ts) | Mapping data backend public ke model marketing frontend |
| [`scripts/audit-api-parity.sh`](scripts/audit-api-parity.sh) | Audit konsistensi route/service dashboard dan backend |
| [`.github/workflows/`](.github/workflows) | Otomasi deploy, testing, monitor, backup, dan drill |

## Panduan Kontribusi

### Branching dan merge flow

Repository tidak memiliki dokumen branching policy formal tersendiri, tetapi seluruh workflow deploy aktif pada `push` ke branch `main`. Praktiknya, perubahan sebaiknya dikerjakan melalui branch kerja, direview lewat pull request, lalu digabung ke `main` setelah lolos validasi yang relevan.

### Checklist sebelum membuat PR

| Scope perubahan | Validasi minimum yang disarankan |
| --- | --- |
| Backend | `cd backend && npm test` |
| Backend contract / ops / governance | `cd backend && npm run check:runbook && npm run check:api-contract && npm run check:pii-governance` |
| Backend DB critical flow | `cd backend && ENABLE_DB_INTEGRATION_TESTS=true npm run test:db-integration` |
| Dashboard | `cd dashboard && npm run test:menu-routes && npm run lint && npm run build` |
| Frontend | `cd frontend && npm run lint && npm run build` |
| Cross-app dashboard-backend route alignment | `bash ./scripts/audit-api-parity.sh` |

### PR review requirements yang sudah terdokumentasi

PR template di [`.github/pull_request_template.md`](.github/pull_request_template.md) mewajibkan reviewer/author memeriksa hal berikut untuk perubahan backend:

- response mengikuti [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)
- HTTP status sesuai konvensi kontrak
- error `code` terstruktur diupdate bila flow baru ditambahkan
- breaking change tidak masuk tanpa catatan deprecation/versioning plan
- baseline OpenAPI di [`backend/openapi/openapi.v1.baseline.yaml`](backend/openapi/openapi.v1.baseline.yaml) ikut diperbarui bila kontrak endpoint berubah

### Konvensi commit message yang terlihat di repo

Riwayat commit terbaru menunjukkan pola singkat dan langsung, misalnya:

- `update readme.md`
- `fix: trigger deploy`
- `refactor(admin-ui): standardize layout, CTA styles, and stats cards across admin pages; fix missing Progress import`
- `add POS payments, mobile package detail UI, and role-based access control`

Gunakan pesan commit yang singkat, spesifik, dan menjelaskan intent perubahan tanpa perlu membuat kebijakan baru yang tidak ada di repo.

### Panduan code style yang relevan dari codebase

- Dashboard dan frontend memakai ESLint.
- Backend mengandalkan helper response standar dan structured error code; hindari response shape custom yang drift dari kontrak.
- Jangan membuka folder upload sensitif secara publik; gunakan `/api/protected-uploads/*`.
- Jika mengubah route dashboard atau menu, jalankan `npm run test:menu-routes`.
- Jika mengubah service/route lintas dashboard-backend, jalankan parity audit di [`scripts/audit-api-parity.sh`](scripts/audit-api-parity.sh).

## Troubleshooting

| Masalah | Gejala | Langkah cek / perbaikan |
| --- | --- | --- |
| Backend gagal start karena env | Error `Missing required environment variables` atau `JWT_SECRET must be at least 32 characters long` | Lengkapi `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` di `backend/.env`; pastikan `JWT_SECRET` >= 32 karakter |
| Koneksi DB gagal | Startup berhenti setelah `Database connection failed` | Cek `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; sinkronkan schema/migration bila perlu |
| Dashboard terus redirect ke `/login` | Cookie ada tetapi session tetap dianggap invalid | Pastikan `JWT_SECRET` di dashboard sama dengan backend, cookie `access_token` valid, dan route cocok dengan role user |
| Route dashboard diarahkan balik ke root role | User `STAFF` atau `FINANCE` membuka route yang diblokir policy | Cek aturan di [`dashboard/src/lib/routeAccess.ts`](dashboard/src/lib/routeAccess.ts) dan rewrite di [`dashboard/next.config.ts`](dashboard/next.config.ts) |
| DB integration test selalu skip | `npm run test:db-integration` tidak mengeksekusi skenario DB | Set `ENABLE_DB_INTEGRATION_TESTS=true` dan arahkan ke database test/non-production |
| Smoke check gagal | `npm run smoke` gagal membaca endpoint | Pastikan backend hidup, `SMOKE_BASE_URL` benar, dan `SMOKE_AUTH_COOKIE` diset bila ingin menguji `/auth/me` |
| Akses `/api/docs`, `/api/openapi`, atau `/api/swagger` ditolak | Mendapat `403` dengan code `SECURITY_DOCS_DISABLED` | Ini perilaku yang memang diharapkan di runtime; gunakan spesifikasi file di repo, bukan endpoint publik |
| File pembayaran / dokumen sensitif tidak bisa diakses via `/uploads/...` | Mendapat `403` | Gunakan endpoint `/api/protected-uploads/:folder/:filename`; dashboard sudah punya helper untuk normalize path sensitif |
| API rate limit | Mendapat `429` saat login, OTP, atau API public/authenticated | Tunggu `Retry-After`, cek konfigurasi `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`, `OTP_RATE_LIMIT_*`, atau `PUBLIC_RATE_LIMIT_*` |
| Gambar / dokumen di dashboard tidak tampil | URL asset mengarah ke origin yang salah | Pastikan `NEXT_PUBLIC_SERVER_URL` dan `NEXT_PUBLIC_API_URL` mengarah ke backend yang benar |
| Frontend tidak bisa memuat paket atau landing agen | Halaman paket kosong atau `notFound()` | Pastikan `NEXT_PUBLIC_API_URL` frontend menunjuk ke backend `/api`, dan endpoint publik backend tersedia |

## Changelog / Riwayat Versi

Repository ini belum memiliki file changelog formal atau skema release semver terpadu. Snapshot status paling jelas saat ini ada di [`docs/CONCEPT_EXECUTION_PLAN.md`](docs/CONCEPT_EXECUTION_PLAN.md) dengan `Last update: 2026-02-20`.

### Snapshot implementasi dari execution plan

| Phase | Status yang tercatat |
| --- | --- |
| Phase 0 - Foundation | Completed |
| Phase 1 - API Contract Standardization | Completed |
| Phase 2 - Payment Flow Enforcement | Completed (core), follow-up needed |
| Phase 3 - Testing Strategy Berbasis Risiko | In progress |
| Phase 4 - Email Queue & Async Processing | Completed |
| Phase 5 - Storage & Data Protection Hardening | In progress |
| Phase 6 - Observability & Incident Readiness | In progress |
| Phase 7 - Deployment Runbook Execution | In progress |

### Arah perubahan terbaru yang terlihat di git

- `9bb3349` - `update readme.md`
- `f0a8d3d` - `update friday 20`
- `ed0cbb7` - `add POS payments, mobile package detail UI, and role-based access control`
- `989c64a` - `refactor(admin-ui): standardize layout, CTA styles, and stats cards across admin pages; fix missing Progress import`
- rangkaian commit sebelum itu banyak berfokus pada workflow deploy backend dan otomasi release

## Maintainers

Metadata repo tidak menampilkan daftar maintainer formal tunggal, tetapi sinyal ownership yang terlihat saat ini adalah:

| Sumber | Nilai |
| --- | --- |
| `backend/package.json` `author` | `Sahabat Qolbu` |
| Git user / author commit terbaru | `Hammad` |
| README lama di repo | `Sahabat Qolbu IT Team` |

Untuk kebutuhan operasional harian, anggap maintainer praktis saat ini adalah tim internal Sahabat Qolbu yang mengelola backend, dashboard, frontend, dan workflow CI/CD pada repository ini.

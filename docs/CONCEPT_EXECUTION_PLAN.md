# CONCEPT_EXECUTION_PLAN - Sahabat Qolbu

Status: **Active Execution Plan**  
Acuan utama: `APP_CONCEPT.md` (LOCKED v1.0), `PAYMENT_FLOW.md`, `API_CONTRACT.md`, `DEPLOYMENT_RUNBOOK.md`

Last update: **2026-02-20**

Progress snapshot:
- Phase 0: **Completed**
- Phase 1: **Completed** (response helper usage + structured error code baseline sudah enforce di helper/validator/error-handler + 404 fallback)
- Phase 2: **Completed (Core), Follow-up Needed** (proof policy + duplicate verify guard + self-verification block + payment verify audit log + state machine transaksi enforced; masih ada gap operasional pada konsistensi posting nominal vs momen verifikasi dan alignment UX transisi status)
- Phase 3: **In Progress** (regression suite berkembang; DB-backed integration tests untuk OTP/approval/payment sudah tersedia dengan env gate `ENABLE_DB_INTEGRATION_TESTS`, namun command `npm test` masih perlu distabilkan karena ada indikasi process hang/open handle setelah sebagian test selesai)
- Phase 4: **Completed** (email queue implemented - async email processing with retry policy + queue monitoring endpoint)
- Phase 5: **In Progress** (backup script uploads + restore script + storage backup runbook + scheduler backup/restore drill sudah tersedia; secondary backup location final & evidence rutin masih berjalan)
- Phase 6: **Not Started (Operationally)** (baseline logger sudah ada, tetapi error tracking terpusat/uptime monitoring/alerting production belum aktif penuh)
- Phase 7: **In Progress** (workflow CI/CD dan smoke check post-deploy sudah aktif; lint `frontend` sudah hijau, lint `dashboard` menurun signifikan namun masih ada blocker di cluster `jamaah` + `master`)

## 1) Tujuan
Dokumen ini berisi daftar kerja bertahap agar implementasi project sepenuhnya selaras dengan konsep produk, arsitektur, keamanan, dan operasional yang sudah disepakati.

## 2) Prinsip Eksekusi
- Kerjakan berdasarkan risiko tertinggi dulu (security, payment, auth).
- Hindari big-bang rewrite; gunakan incremental hardening.
- Setiap fase harus punya output yang bisa diverifikasi (test/build/checklist).
- Semua perubahan kontrak API wajib sinkron dengan client (`dashboard`/`frontend`).

## 3) Roadmap Implementasi Bertahap

## Phase 0 - Foundation (Sebagian selesai)
Tujuan: membangun fondasi minimum untuk alignment konsep.

Checklist:
- [x] Lock konsep v1.0 pada `APP_CONCEPT.md`
- [x] Buat dokumen turunan (`PAYMENT_FLOW.md`, `API_CONTRACT.md`, `DEPLOYMENT_RUNBOOK.md`)
- [x] Tambah dukungan path API version bridge (`/api/v1`)
- [x] Tambah baseline test command backend

Definition of done:
- Dokumen tersedia dan bisa dijadikan referensi resmi tim.

## Phase 1 - API Contract Standardization (Completed)
Tujuan: menyeragamkan response shape backend agar sesuai `API_CONTRACT.md`.

Checklist:
- [x] Standarisasi response `jamaahController`
- [x] Standarisasi + paginated response `transactionController`
- [x] Hardening input parsing `notificationController`
- [x] Cleanup logging + parsing aman `masterController`
- [x] Standarisasi response `jamaahSelfController`
- [x] Standarisasi response `agenJamaahController`
- [x] Audit semua controller tersisa (no raw `res.status(...).json` untuk pola umum)
- [x] Tambah contract regression test untuk menjaga konsistensi style response

Definition of done:
- Endpoint utama konsisten memakai helper response.
- Endpoint list utama mengembalikan pagination metadata standar.

## Phase 2 - Payment Flow Enforcement
Tujuan: implementasi ketat state machine pembayaran sesuai `PAYMENT_FLOW.md`.

Checklist:
- [x] Enforce valid status transitions di endpoint verifikasi transaksi admin
- [x] Wajibkan alasan pada status cancel/refund transaksi
- [x] Tambahkan audit payload minimum (before/after, actor, timestamp) untuk perubahan status transaksi
- [x] Validasi nominal dan kalkulasi outstanding dibuat konsisten via helper shared (`paymentState`)
- [x] Tambahkan guard untuk duplicate/invalid proof scenarios (duplicate verify + invalid payment proof path policy sudah enforced lintas validator/controller)
- [x] Ekstrak workflow validasi status transaksi ke helper dedicated (`transactionWorkflow`)
- [x] Blok verifikasi pembayaran sendiri pada endpoint verifikasi payment jamaah
- [x] Tambah audit log untuk aksi verify payment (`VERIFY_PAYMENT`, `JAMAAH_PAYMENT`)

Definition of done:
- Tidak ada transisi status ilegal.
- Semua perubahan status kritikal punya jejak audit minimum.

## Phase 3 - Testing Strategy Berbasis Risiko
Tujuan: menutup gap testing untuk alur kritikal.

Checklist:
- [~] Unit test: validator, parsing nominal, ownership checks, helper auth (bertahap sudah berjalan; termasuk payment proof policy + jamaah payment validation + role middleware code contract)
- [~] Integration test: login + OTP (DB-backed test skeleton sudah ditambahkan; akan aktif penuh saat environment CI/staging menyediakan DB test)
- [~] Integration test: payment (upload proof -> verify -> status) (baseline integration-lite API + CSRF guard + anti-self-verification regression + verify-payment audit log regression sudah ada, full lifecycle DB-backed masih lanjut)
- [~] Integration test: approval jamaah/agen (DB-backed test skeleton sudah ditambahkan; akan aktif penuh saat environment CI/staging menyediakan DB test)
- [x] Tambah env gate dan script dedicated untuk DB integration test (`ENABLE_DB_INTEGRATION_TESTS`, `npm run test:db-integration`)
- [x] Tambah contract regression test untuk endpoint utama (response helper consistency)
- [x] Tambah regression test state machine & workflow transaksi (helper-based)
- [x] Tambah integration-lite test untuk `/health`, `/api|/api/v1` bridge, `/api/public` bridge, CSRF cookie-origin guard, unauthorized code contract, dan 404 code contract (`RESOURCE_NOT_FOUND`)
- [x] Tambah unit test role middleware untuk `AUTH_UNAUTHORIZED` dan `AUTH_FORBIDDEN`

Definition of done:
- Critical path punya coverage test yang executable di CI.

## Phase 4 - Email Queue & Async Processing
Tujuan: menghilangkan bottleneck pengiriman email sinkron.

Checklist:
- [x] Introduce queue worker untuk email OTP/kredensial/reminder
- [x] Retry policy + dead-letter handling
- [x] Timeout & error handling terstruktur
- [x] Monitoring event email success/fail rate

Definition of done:
- Request auth/reminder tidak blocked oleh SMTP lambat.

## Phase 5 - Storage & Data Protection Hardening
Tujuan: meningkatkan ketahanan dokumen sensitif (KTP/paspor/dll).

Checklist:
- [~] Dokumentasikan storage saat ini + backup folder uploads otomatis (runbook + script backup/restore tersedia)
- [~] Implement secondary backup location untuk uploads (siap via env `BACKUP_OUTPUT_DIR`, perlu finalisasi lokasi infra)
- [~] Restore drill file + DB berkala (workflow restore drill + template laporan sudah tersedia; eksekusi periodik + evidence historis berjalan)
- [ ] Access matrix PII (quarterly review)
- [ ] Rencana migrasi object storage (S3-compatible/MinIO)

Definition of done:
- Prosedur backup/restore file-DB terbukti bisa dijalankan.

## Phase 6 - Observability & Incident Readiness
Tujuan: visibilitas produksi yang cukup untuk operasi harian.

Checklist:
- [~] Structured logging konsisten (baseline logger dan security/audit log sudah aktif; standarisasi lintas modul masih lanjut)
- [~] Error tracking terpusat (baseline centralized error-tracker hook sudah aktif di global error handler dengan mode aman `log-only`; integrasi provider eksternal + dashboard observability masih lanjut)
- [~] Uptime monitoring backend/frontend (baseline scheduler probe + optional webhook alert sudah aktif via workflow uptime monitor)
- [~] Alert rule auth anomalies + payment verification failures (baseline probe + scheduled workflow + optional webhook pager sudah aktif, tuning threshold dan coverage endpoint masih lanjut)
- [~] Incident severity + escalation flow aktif (playbook insiden + escalation matrix + workflow drill bulanan + artifact report sudah aktif; verifikasi rutin pasca secret/environment final masih lanjut)

Definition of done:
- Tim bisa mendeteksi dan merespons incident kritikal dengan cepat.

## Phase 7 - Deployment Runbook Execution
Tujuan: mengeksekusi deploy process sesuai `DEPLOYMENT_RUNBOOK.md` setelah infra final.

Checklist:
- [ ] Finalisasi detail infra production (2 vCPU/8GB/100GB NVMe/8TB bandwidth target)
- [ ] Tetapkan environment strategy final (dev/staging/prod)
- [~] CI/CD gate: lint + test + build (backend test gate + dashboard/frontend lint/build gate sudah aktif di workflow; backend DB integration workflow terpisah sudah ditambahkan, pending secret DB test di repo settings)
- [ ] Rollback procedure tervalidasi
- [~] Post-deploy smoke checklist dijalankan rutin (script smoke backend + workflow hook optional sudah tersedia)

Definition of done:
- Release production repeatable, aman, dan punya rollback jelas.

## 4) Prioritas Eksekusi (Urutan Disarankan)
1. Tutup gap integritas payment flow: pastikan perhitungan `totalPayment/outstanding/statusPayment` diposting saat verifikasi valid, bukan saat bukti baru diunggah.
2. Sinkronkan role policy verifikasi pembayaran/transaksi (`ADMIN` vs `FINANCE`) agar sesuai `PAYMENT_FLOW.md` dan implementasi route/UI.
3. Stabilkan runner test backend agar `npm test` selesai clean (identifikasi dan tutup open handle/timer/socket yang menahan process exit).
4. Aktifkan DB integration workflow di CI dengan melengkapi secrets DB test (`DB_TEST_HOST/USER/PASSWORD/NAME`).
5. Tuntaskan lint blocker prioritas tinggi di `dashboard` dan `frontend` (khususnya `no-explicit-any`, `react/no-unescaped-entities`, purity rule) agar quality gate lint/build benar-benar enforceable.
6. Tuntaskan sisa Phase 3 dengan menjalankan integration critical path penuh secara rutin di CI/staging.
7. Paralelkan Phase 5 dan 6 sesuai kapasitas tim.
8. Finalisasi Phase 7 (rollback drill + smoke rutin + env strategy final) setelah keputusan infra kantor selesai.

## 4.1 Backlog Perbaikan dari Review 2026-02-18
Daftar ini adalah temuan langsung dari review keselarasan dokumen konsep vs implementasi aktual.

### A) CI/Test Reliability
- [ ] Investigasi penyebab test process tidak exit setelah suite selesai (kemungkinan interval/queue/timer asynchronous).
- [ ] Tambahkan guard shutdown untuk background worker (email queue) saat mode test.
- [ ] Tambahkan guideline troubleshooting test hang di `backend/DB_INTEGRATION_TESTING.md`.

### B) Quality Gate Frontend/Dashboard
- [~] Kurangi penggunaan `any` di service/page kritikal sebagai prioritas (auth, agen, jamaah, package). (cluster `agen`, `content/faqs`, `content/testimonials`, `calendar`, `jamaah/[bookingNumber]`, `jamaah/create`, `jamaah/list`, `master/agent-levels`, `master/agent-purposes`, `master/agent-requirements`, `master/airports`, `master/banks`, dan `master/airlines` sudah dirapikan; cluster `master/hotels`, `master/periods`, serta `packages` masih lanjut)
- [~] Perbaiki `react/no-unescaped-entities` dan warning purity yang memblokir lint. (`frontend` sudah bersih dari error lint; `dashboard` tersisa warning/error di modul tertentu)
- [ ] Pastikan lint dashboard/frontend hijau sebelum deploy workflow dianggap valid penuh.

### C) Product-Concept Alignment
- [ ] Refactor workspace `FINANCE` dan `STAFF` agar tidak hanya meminjam halaman `ADMIN` (role-centric UX sesuai `APP_CONCEPT.md`).
- [ ] Evaluasi migrasi bertahap dari iframe marketing (`frontend/src/app/(marketing)/*`) ke halaman Next native untuk target SEO, observability, dan maintainability.
- [x] Tambahkan access matrix PII dan jadwal review quarterly sebagai deliverable Phase 5.

### D) Runbook/Smoke Consistency
- [x] Sinkronisasi smoke check endpoint publik agar prioritas ke path kontrak (`/api/public/*`) dengan fallback alias lama.
- [x] Tambahkan smoke check khusus endpoint versi `/api/v1` untuk endpoint kritikal tambahan (auth/public).

### E) Payment Integrity & Contract-Flow Alignment
- [~] Ubah alur posting pembayaran jamaah: nominal terbayar dan status agregat (`statusPayment`) hanya berubah saat bukti lolos verifikasi (bukan saat `addPayment`). (backend `jamaahController` dan regression DB test sudah disesuaikan; rollout lanjutan untuk status proof granular + sinkronisasi UI/operasional masih berjalan)
- [ ] Tambahkan status bukti pembayaran level item (`UPLOADED`/`VERIFIED`/`REJECTED`) + `rejectionReason` agar SOP reject/reupload bisa diaudit.
- [ ] Selaraskan hak verifikasi transaksi: izinkan `FINANCE` sesuai dokumen atau revisi dokumen jika kebijakan final adalah `ADMIN` only.
- [ ] Perbaiki UX transaksi agar transisi state machine valid (hindari aksi langsung `PENDING -> VERIFIED`, wajib reason untuk `CANCELLED`/`REFUNDED`).
- [ ] Tambahkan integration test end-to-end untuk partial payment, cancel-with-reason, reject-proof, dan anti-self-verification.

### F) Role-centric Workspace Parity
- [ ] Implement workspace `FINANCE` native (route/page sendiri) untuk menu yang sudah diekspos (`/finance/users`, `/finance/packages`, `/finance/jamaah`, `/finance/agen`, `/finance/transactions`, `/finance/reports`).
- [ ] Implement workspace `STAFF` native (route/page sendiri) agar tidak hanya alias dari halaman `ADMIN`.
- [ ] Tambahkan regression check untuk mencegah dead link menu lintas role (minimal route smoke test per role).

### G) Frontend Channel Convergence
- [ ] Susun rencana migrasi bertahap landing iframe (`frontend/src/app/(marketing)/page.tsx`, `frontend/src/app/(marketing)/packages/page.tsx`, `frontend/src/app/[namaagen]/AgentLandingFrame.tsx`) ke halaman Next native berbasis data API.
- [ ] Tambahkan metrik keberhasilan migrasi channel publik (SEO indexability, LCP/CLS, observability event coverage).

## 4.2 Backlog Perbaikan dari Review 2026-02-20
Daftar ini menambahkan gap yang masih terlihat antara dokumen konsep dan implementasi aktual saat ini.

### H) Payment SOP Completeness & Route Exposure
- [x] Ekspos endpoint reject bukti pembayaran di route (`PATCH /api/jamaah/admin/payments/:paymentId/reject`) dengan validator `jamaahAdminSchemas.rejectPayment`, agar SOP reject/reupload pada `PAYMENT_FLOW.md` bisa dieksekusi end-to-end oleh client.
- [~] Sinkronkan UI dashboard transaksi/pembayaran agar aksi `REJECTED` dan alasan penolakan (`rejectionReason`) terlihat dan bisa ditindaklanjuti jamaah/agen. (admin jamaah detail sudah support; route dashboard `AGEN/JAMAAH` kini terhubung ke implementasi mobile existing agar user-role path tidak lagi terblokir placeholder)
- [~] Tambahkan regression/integration test untuk jalur reject-payment (upload -> reject -> reupload -> verify) agar flow manual transfer benar-benar terjaga. (DB integration scenario sudah ditambahkan; eksekusi rutin mengikuti gate `ENABLE_DB_INTEGRATION_TESTS`)

### I) Role Policy & Contract Consistency
- [x] Selaraskan kebijakan verifier transaksi di endpoint `/admin/transactions/:id/verify` agar sesuai dokumen (`ADMIN`/`FINANCE`) atau revisi dokumen jika keputusan final tetap `ADMIN` only.
- [~] Tambahkan policy check lintas controller agar role payment verifier (transaction-level vs jamaah-payment-level) konsisten dan tidak drift. (regression test route-policy sudah ditambahkan; perlu perluasan ke lint guard lintas layer jika dibutuhkan)

### J) Workspace Parity vs Menu Exposure
- [x] Hilangkan dead-link pada menu `FINANCE` dan `STAFF` dengan cara implement route native atau fallback route-map eksplisit untuk seluruh menu yang ditampilkan (`/finance/*`, `/staff/*`).
- [x] Tambahkan smoke test navigasi per role berbasis konfigurasi menu (`dashboard/src/lib/menu-config.ts`) untuk memastikan setiap `href` punya page yang valid.
- [x] Integrasikan smoke test menu-route ke workflow CI dashboard (`.github/workflows/deploy-dashboard.yml`) agar regression dead-link tertahan sebelum proses build/deploy.
- [x] Tingkatkan quality gate menu-route level 2: deteksi route placeholder (`Coming Soon`) sebagai warning terstruktur untuk backlog migrasi halaman yang belum native.

### K) API Contract Governance Follow-through
- [x] Tambahkan checklist review kontrak per PR backend (status code + shape + error code) dan link ke `API_CONTRACT.md` agar konsistensi tidak bergantung audit manual periodik.
- [x] Siapkan baseline OpenAPI bertahap untuk domain prioritas (`auth`, `public`, `jamaah-payment`, `transactions`) sesuai catatan kontrak.
- [x] Pastikan baseline OpenAPI tidak terekspos sebagai endpoint publik; blokir akses `/api/openapi`, `/api/docs`, dan `/api/swagger` (termasuk prefix `/api/v1`) di level aplikasi backend.
- [x] Tambahkan compliance guard otomatis untuk governance API (`npm run check:api-contract`) dan integrasikan ke workflow backend deploy agar drift kontrak/OpenAPI bisa tertahan di CI.

### L) Runbook-to-Implementation Traceability
- [x] Tautkan setiap item smoke test runbook ke script/command aktual (mis. `backend/src/scripts/smokeCheck.js`) agar tidak ada item checklist yang belum terotomasi.
- [x] Tambahkan template evidence pasca deploy (timestamp, hasil check, owner) untuk mendukung audit operasional dan postmortem.
- [x] Tambahkan compliance guard otomatis (`npm run check:runbook`) dan integrasikan ke workflow backend deploy agar drift runbook bisa tertahan di CI.

### M) PII Governance & Least-Privilege Controls
- [x] Bentuk dokumen access matrix PII lintas role + kontrol wajib + template evidence review di `PII_ACCESS_MATRIX.md`.
- [x] Tambahkan guard otomatis `npm run check:pii-governance` untuk memastikan artefak governance PII dan baseline proteksi uploads sensitif tetap aktif.
- [x] Integrasikan guard PII governance ke workflow backend deploy (`.github/workflows/deploy-backend.yml`).

## 5) KPI Keberhasilan
- Penurunan error regresi di endpoint kritikal.
- Tidak ada transisi payment ilegal di production.
- Waktu respon incident kritikal turun.
- Release success rate meningkat per sprint.
- Jumlah endpoint non-standar response mendekati nol.

## 6) Mekanisme Review
- Weekly: review progress phase + blocker.
- Monthly: evaluasi KPI teknikal.
- Quarterly: review dan update `APP_CONCEPT.md` + dokumen turunan.

## 7) Update Log (Ringkas)
- 2026-02-20: Tambah workflow drill insiden bulanan `.github/workflows/incident-drill.yml` + script `backend/src/scripts/incidentDrillRun.js` (output artifact `incident-drill-report`) untuk membiasakan latihan eskalasi berbasis evidence.
- 2026-02-20: `INCIDENT_RESPONSE_PLAYBOOK.md` diperluas dengan cadence drill operasional bulanan dan aturan review artifact pada weekly ops review.
- 2026-02-20: Tambah baseline error tracking terpusat: hook `captureErrorEvent` pada global error handler (`backend/src/middlewares/errorHandler.js`) dengan util `backend/src/utils/errorTracker.js` (mode default `log-only`, sanitized event payload, siap aktivasi provider via env).
- 2026-02-20: Tambah regression test untuk memastikan wiring centralized error tracker tetap aktif (`backend/src/tests/security-and-authz.test.js`).
- 2026-02-20: `DEPLOYMENT_RUNBOOK.md` diperluas dengan catatan aktivasi error tracking provider (`ERROR_TRACKING_ENABLED`, `ERROR_TRACKING_PROVIDER`) dan kebijakan sanitization field sensitif.
- 2026-02-20: Tambah baseline alert rule auth/payment via `backend/src/scripts/criticalAlertProbe.js` + workflow `.github/workflows/critical-alert-monitor.yml` (15 menit) dengan notifikasi webhook ops dan pager opsional.
- 2026-02-20: Tambah dokumen `INCIDENT_RESPONSE_PLAYBOOK.md` berisi severity definition, escalation matrix, SOP handling, dan template incident record; runbook deployment disinkronkan ke implementasi ini.
- 2026-02-20: Tambah baseline observability uptime: script `backend/src/scripts/uptimeProbe.js` + workflow terjadwal `.github/workflows/uptime-monitor.yml` (30 menit) dengan opsi alert webhook `OPS_ALERT_WEBHOOK_URL`.
- 2026-02-20: `DEPLOYMENT_RUNBOOK.md` diperbarui dengan implementasi monitoring minimum aktual (probe endpoint backend/dashboard/frontend + verifikasi docs hardening status code).
- 2026-02-20: Tambah `PII_ACCESS_MATRIX.md` sebagai baseline governance least-privilege (klasifikasi data, access matrix per role, kontrol wajib, jadwal review quarterly, dan evidence template).
- 2026-02-20: Tambah guard `backend/src/scripts/piiGovernanceCheck.js` + script `npm run check:pii-governance`; workflow backend deploy kini menjalankan guard PII governance setelah guard runbook/API contract.
- 2026-02-20: Tambah guard `backend/src/scripts/apiContractComplianceCheck.js` + script `npm run check:api-contract` untuk memastikan `API_CONTRACT.md` dan baseline `backend/openapi/openapi.v1.baseline.yaml` tetap memenuhi elemen governance minimum.
- 2026-02-20: Workflow backend deploy (`.github/workflows/deploy-backend.yml`) kini menjalankan `npm run check:api-contract` setelah `check:runbook` sebelum test/deploy.
- 2026-02-20: Tambah guard `backend/src/scripts/runbookComplianceCheck.js` + script `npm run check:runbook` untuk memastikan elemen wajib runbook (mapping command, evidence template, docs hardening check, backup/restore command) tetap terjaga.
- 2026-02-20: Workflow backend deploy (`.github/workflows/deploy-backend.yml`) kini menjalankan `npm run check:runbook` sebelum test/deploy untuk menahan drift operasional sejak tahap CI.
- 2026-02-20: `DEPLOYMENT_RUNBOOK.md` diperkuat dengan mapping checklist -> command/script (backend smoke, dashboard menu-route check, docs hardening check), catatan prasyarat eksekusi smoke, serta command backup/restore reference.
- 2026-02-20: Tambah template evidence pasca deploy/restore di runbook (timestamp, environment, hasil check, artifacts, approval) untuk audit trail operasional yang konsisten.
- 2026-02-20: Hardening keamanan API docs: akses publik ke path dokumentasi (`/api/openapi`, `/api/docs`, `/api/swagger` + varian `/api/v1/*`) diblokir dengan kode `SECURITY_DOCS_DISABLED`; ditambah regression test di `backend/src/tests/security-and-authz.test.js`.
- 2026-02-20: API contract governance diaktifkan melalui `.github/pull_request_template.md` (checklist kontrak backend) dan sinkronisasi dokumentasi `API_CONTRACT.md` pada bagian governance repo.
- 2026-02-20: Baseline OpenAPI awal ditambahkan di `backend/openapi/openapi.v1.baseline.yaml` untuk domain prioritas `auth`, `public`, `jamaah-payment`, dan `transactions` sebagai fondasi ekspansi spesifikasi kontrak bertahap.
- 2026-02-20: Implement modul `Gallery` end-to-end (backend route/controller + dashboard admin CRUD page) dan aktifkan parity `STAFF` via re-export ke halaman admin gallery.
- 2026-02-20: Placeholder warning menu-route level 2 kini bersih untuk seluruh `href` menu karena `admin/staff content gallery` sudah tidak lagi berstatus `Coming Soon`.
- 2026-02-20: Route dashboard `AGEN`/`JAMAAH` dialihkan dari placeholder ke re-export halaman mobile existing (dashboard, profile, jamaah list/create, commissions, website, packages, documents, payments) agar coverage menu punya pengalaman fungsional minimum.
- 2026-02-20: Menu-route smoke checker ditingkatkan dengan deteksi placeholder route berbasis source scan (`Coming Soon`) dan melaporkan warning terstruktur; status terbaru masih ada placeholder di `/admin/content/gallery` dan `/staff/content/gallery`.
- 2026-02-20: Workflow deploy dashboard diperkuat dengan step `npm run test:menu-routes` sebelum lint/build (`.github/workflows/deploy-dashboard.yml`) untuk menahan regression route-menu sejak tahap CI.
- 2026-02-20: Lengkapi parity workspace `FINANCE`/`STAFF` untuk menu utama (users/packages/agen/transactions/reports + master/content/profile yang diperlukan) melalui route page alias/re-export, sehingga menu tidak lagi mengarah ke 404.
- 2026-02-20: Tambah smoke check menu-route `dashboard/src/scripts/check-menu-routes.mjs` + script `npm run test:menu-routes`; hasil terbaru: seluruh `href` pada `menu-config.ts` sudah memiliki page target.
- 2026-02-20: Tambah placeholder page untuk route `AGEN`, `JAMAAH`, dan `admin/content/gallery` yang belum memiliki implementasi fitur penuh agar coverage route tetap terjaga sambil menunggu fase implementasi domain.
- 2026-02-20: Mulai parity workspace `FINANCE`/`STAFF` untuk modul `jamaah` dengan menambahkan route alias berbasis re-export (`/finance/jamaah/*`, `/staff/jamaah/*`) dan role-aware base path di halaman admin jamaah (list/detail/create/edit) agar navigasi tidak hardcode `/admin`.
- 2026-02-20: Tambah regression test policy verifier pembayaran untuk menjaga konsistensi role `ADMIN`/`FINANCE` pada route verify/reject payment jamaah dan verify transaksi (`backend/src/tests/security-and-authz.test.js`).
- 2026-02-20: Sinkronisasi policy verifier transaksi: route backend `PATCH /api/admin/transactions/:id/verify` kini mengizinkan `ADMIN` dan `FINANCE` sesuai arah `PAYMENT_FLOW.md`.
- 2026-02-20: UI admin jamaah detail (tab pembayaran) ditingkatkan untuk menampilkan status proof (`UPLOADED`/`VERIFIED`/`REJECTED`), `rejectionReason`, aksi reject bukti, dan pesan menunggu upload ulang.
- 2026-02-20: Implement endpoint reject payment proof pada route jamaah admin (`PATCH /api/jamaah/admin/payments/:paymentId/reject`) + validasi reason, sehingga SOP reject/reupload di `PAYMENT_FLOW.md` sudah tersedia di level API.
- 2026-02-20: Tambah DB integration test lifecycle pembayaran `upload -> reject -> reupload -> verify` termasuk guard anti-self-verification dan validasi reject-without-reason.
- 2026-02-20: Review alignment menyimpulkan sebagian besar fondasi konsep sudah terpasang (API v1 bridge, response helper, payment-state helper, backup/restore workflow, role menu baseline), namun masih ada gap prioritas: endpoint reject-payment belum diekspos route, mismatch policy verifier transaksi (`ADMIN` vs `FINANCE`), dead-link menu workspace `FINANCE/STAFF`, dan channel publik masih iframe-based.
- 2026-02-20: Tambah backlog `4.2` untuk menutup gap baru hasil review (payment SOP completeness, role-policy consistency, workspace parity, API governance follow-through, runbook traceability).
- 2026-02-20: Implementasi awal payment verify-time accounting di backend: `addPayment` tidak lagi mem-posting total/outstanding, update agregat pembayaran dipindah ke `verifyPayment` berbasis total pembayaran terverifikasi; regression DB integration test disesuaikan mengikuti behavior baru.
- 2026-02-20: Review alignment terbaru menambahkan backlog prioritas untuk integritas payment posting (verify-time accounting), sinkronisasi role verifikasi (`ADMIN`/`FINANCE`), parity workspace role-centric (`FINANCE`/`STAFF`), dan rencana konvergensi frontend iframe -> Next native.
- 2026-02-19: Refactor cluster `dashboard/src/app/(dashboard)/admin/master/airlines/*` untuk eliminasi `no-explicit-any` utama, perbaikan `prefer-const`, serta standarisasi error handling; cluster ini menjadi warning-only.
- 2026-02-19: Refactor cluster `dashboard/src/app/(dashboard)/admin/master/airports/*` dan `dashboard/src/app/(dashboard)/admin/master/banks/*` untuk eliminasi `no-explicit-any` utama serta standarisasi error handling; seluruh file cluster ini menjadi warning-only.
- 2026-02-19: Refactor `dashboard/src/app/(dashboard)/admin/master/agent-purposes/page.tsx` dan `dashboard/src/app/(dashboard)/admin/master/agent-requirements/page.tsx` untuk eliminasi `no-explicit-any` serta standarisasi error handling; kedua file kini warning-only.
- 2026-02-19: Refactor cluster `dashboard/src/app/(dashboard)/admin/master/agent-levels/*` (create, list, edit) untuk menghapus error `no-explicit-any` dan standarisasi error parser; cluster ini menjadi warning-only.
- 2026-02-19: Refactor `dashboard/src/app/(dashboard)/admin/jamaah/create/page.tsx` untuk menghapus error `no-explicit-any` (typed form + typed options + error handler standar), status file menjadi warning-only.
- 2026-02-19: Refactor `dashboard/src/app/(dashboard)/admin/jamaah/page.tsx` untuk menghapus error `no-explicit-any` (typed helper/filter badge + error parser), status file menjadi warning-only.
- 2026-02-19: Lanjutan refactor lint `dashboard/src/app/(dashboard)/admin/jamaah/[bookingNumber]/page.tsx` (eliminasi `no-explicit-any` utama + perbaikan `react/no-unescaped-entities`), status file turun menjadi warning-only.
- 2026-02-19: Stabilkan lint `frontend` hingga hijau (axios typing, unescaped entities, hook deps, static landing JS warnings) sebagai bagian quality gate Phase 7.
- 2026-02-19: Kurangi blocker lint `dashboard` pada cluster `agen`, `content/faqs`, `content/testimonials`, dan `calendar` dengan refactor typing (`no-explicit-any`) serta perbaikan contract error handling di page-level.
- 2026-02-19: Lanjutan hardening `jamaah/[bookingNumber]/edit` (hapus `any` utama + perbaikan `react/no-unescaped-entities`), menyisakan warning non-blocking untuk tahap berikutnya.
- 2026-02-19: Smoke check backend diperluas untuk memprioritaskan endpoint `/api/v1/public/*` dan `/api/v1/auth/me` dengan fallback kompatibilitas.
- 2026-02-18: Hasil review alignment konsep menambahkan backlog perbaikan terstruktur (test exit reliability, lint gate stabilization, role-centric workspace alignment, observability readiness).
- 2026-02-18: Smoke check backend diperbarui untuk memprioritaskan endpoint kontrak publik `/api/public/*` dengan fallback kompatibilitas legacy.
- 2026-02-17: Tambah DB-backed integration test critical path (OTP, approval, payment) + env gate `ENABLE_DB_INTEGRATION_TESTS` + script `test:db-integration`.
- 2026-02-17: Tambah workflow backend DB integration terpisah (`.github/workflows/backend-db-integration.yml`) dan sinkronisasi status Phase 3/7.
- 2026-02-17: Implementasi email queue async + retry + monitoring endpoint health detail; Phase 4 ditandai completed.
- 2026-02-17: Tambah backup/restore uploads + smoke check + runbook storage + workflow backup harian dan restore drill bulanan; status Phase 5 diperbarui.

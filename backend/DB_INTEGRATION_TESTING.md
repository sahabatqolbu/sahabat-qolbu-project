# DB Integration Testing Guide

Dokumen ini menjelaskan cara menjalankan test DB-backed untuk critical flow (`auth OTP`, `approval`, `payment verify`) secara aman dan repeatable.

## 1) Tujuan
- Menjalankan test end-to-end API yang benar-benar menyentuh database.
- Memvalidasi contract bisnis kritikal di luar unit test/lite integration.
- Menjadi baseline untuk gate CI/staging sebelum release.

## 2) Scope Test Saat Ini
File test: `backend/src/tests/integration-db-critical.test.js`

Flow yang dicakup:
- Login -> generate OTP -> verify OTP -> cookie auth set.
- Approval jamaah + approval agen oleh admin.
- Guard approval/reject (reason wajib, role forbidden).
- Payment lifecycle: add payment -> verify -> duplicate verify blocked + anti self-verification.

## 3) Prasyarat
- Database MySQL tersedia dan schema sudah sinkron dengan project.
- Environment backend sudah punya konfigurasi DB valid.
- Test dijalankan terhadap database khusus test/staging (bukan production).

## 4) Environment Variables
Wajib set:

```bash
ENABLE_DB_INTEGRATION_TESTS=true
```

Disarankan set environment terpisah untuk test DB, misal:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=sahabatqolbu_test
NODE_ENV=test
```

Catatan:
- Jika `ENABLE_DB_INTEGRATION_TESTS` tidak di-set `true`, test DB otomatis di-skip.

## 5) Menjalankan Test

Jalankan seluruh suite (unit + lite + db-gated):

```bash
npm run test
```

Jalankan khusus DB integration test:

```bash
npm run test:db-integration
```

## 6) Data Isolation & Cleanup
- Test membuat data dengan suffix unik timestamp/random untuk menghindari tabrakan.
- Cleanup dilakukan di akhir test untuk tabel yang tersentuh:
  - `jamaah_payments`
  - `jamaah_data`
  - `agent_data`
  - `users`
- Meski ada cleanup, tetap gunakan database non-production.

## 7) Rekomendasi CI/Staging
- Buat job terpisah `db-integration-tests` setelah job unit/lint/build.
- Inject secret DB test via CI secrets.
- Jalankan migrasi/schema sync sebelum test DB dijalankan.
- Job DB integration boleh dijadikan required check untuk branch release.

## 8) Troubleshooting Cepat
- **Semua test DB status skip**
  - Pastikan `ENABLE_DB_INTEGRATION_TESTS=true`.
- **Gagal koneksi DB**
  - Cek `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`.
- **Gagal karena schema mismatch**
  - Jalankan sync migrasi/schema terlebih dahulu.

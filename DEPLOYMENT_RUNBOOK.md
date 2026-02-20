# DEPLOYMENT_RUNBOOK - Sahabat Qolbu

Status dokumen: **Draft Runbook v1.0**  
Tanggal: **2026-02-14**  
Status infra: **menunggu final keputusan kantor**

## 1) Tujuan
Runbook ini jadi panduan deploy/rollback/incident agar release aman, repeatable, dan bisa dieksekusi tim secara konsisten.

## 2) Konteks Infrastruktur (Target Saat Ini)
Target resource server yang sedang diupayakan:
- `2 vCPU`
- `8 GB RAM`
- `100 GB NVMe`
- `8 TB bandwidth`

Konsekuensi operasional:
- optimasi resource wajib disiplin,
- proses non-kritis sebaiknya async,
- monitoring performa harus aktif sejak awal.

## 3) Environment Strategy
- `development`: untuk coding harian.
- `staging`: mirror flow production untuk validasi release.
- `production`: trafik real user.

Aturan minimum:
- tidak ada test eksperimental langsung di production,
- semua env menggunakan konfigurasi `.env` terpisah,
- secret tidak boleh di-commit ke git.

## 4) Pre-Deployment Checklist
- [ ] Branch release sudah direview.
- [ ] Build `backend`, `dashboard`, `frontend` sukses.
- [ ] Tidak ada error kritikal lint/type-check.
- [ ] Migrasi DB sudah ditinjau + rollback plan tersedia.
- [ ] Backup database terbaru tersedia.
- [ ] Backup file upload terbaru tersedia.
- [ ] Changelog release tersedia untuk tim terkait.

## 5) Deployment Steps (Generic)

## 5.1 Backend
1. Pull kode release.
2. Install dependencies.
3. Jalankan migrasi schema (jika ada).
4. Restart service backend.
5. Cek health endpoint dan auth endpoint.

## 5.2 Dashboard
1. Build aplikasi.
2. Deploy build artifact.
3. Validasi login dan role routing minimum.

## 5.3 Frontend
1. Build aplikasi.
2. Deploy static/server artifact sesuai mode deploy.
3. Validasi homepage, packages, dan landing agen.

## 6) Smoke Test Setelah Deploy

Catatan keamanan akses API internal:
- Dokumentasi API machine-readable (`OpenAPI/Swagger`) **tidak boleh dibuka publik**.
- Endpoint docs (`/api/docs`, `/api/openapi`, `/api/swagger` termasuk varian `/api/v1/*`) harus return `403` + code `SECURITY_DOCS_DISABLED`.
- Akses endpoint privat wajib melalui session/cookie auth + role authorization, bukan anonymous public traffic.

## 6.1 Critical checks
- [ ] `GET /health` backend normal.
- [ ] Login + OTP flow berhasil.
- [ ] Akses dashboard sesuai role.
- [ ] Endpoint public package dan agent landing normal.
- [ ] Upload dokumen/pembayaran minimal 1 skenario.
- [ ] Verifikasi hardening docs API: endpoint docs/openapi publik terblokir (`403 SECURITY_DOCS_DISABLED`).

### Mapping checklist -> command/script
Gunakan mapping ini agar setiap checklist punya jejak eksekusi yang jelas.

| Checklist | Command | Catatan |
|---|---|---|
| `GET /health` backend normal | `cd backend && npm run smoke` | tervalidasi via `health` check |
| Login + OTP flow berhasil | `cd backend && npm run smoke` + manual OTP sanity | smoke mencakup `auth/me` jika `SMOKE_AUTH_COOKIE` diset |
| Endpoint public package dan agent landing normal | `cd backend && npm run smoke` | tervalidasi via `public-packages` dan `public-agent-slugs` |
| Hardening docs API | `cd backend && npm run smoke` | tervalidasi via `docs-disabled-v1` (`403 SECURITY_DOCS_DISABLED`) |
| Upload dokumen/pembayaran minimal 1 skenario | manual protected flow + log hasil | untuk saat ini belum fully automated di smoke script |
| Akses dashboard sesuai role | `cd dashboard && npm run test:menu-routes` + login role checks | menu-route check otomatis, role-login tetap manual |

### Catatan eksekusi smoke
- `npm run smoke` membutuhkan backend aktif (`SMOKE_BASE_URL` mengarah ke service yang hidup).
- Jika di CI/deploy server hidup, gunakan endpoint target environment.
- Jika lokal, jalankan backend dulu sebelum smoke (`cd backend && npm run dev`).

## 6.2 Payment checks
- [ ] Upload proof berhasil.
- [ ] Verifikasi payment oleh role berwenang berhasil.
- [ ] Status transaksi berubah sesuai rule.

## 7) Rollback Procedure

Trigger rollback jika:
- auth gagal massal,
- payment flow error kritikal,
- error rate tinggi berkelanjutan,
- data integrity issue.

Langkah rollback minimum:
1. Freeze deploy baru.
2. Revert ke artifact versi stabil terakhir.
3. Jika migrasi merusak kompatibilitas, jalankan rollback DB sesuai plan.
4. Validasi health + smoke test inti.
5. Umumkan status rollback ke tim.

## 8) Incident Response

## 8.1 Severity (saran)
- `SEV-1`: layanan inti down / payment/auth lumpuh.
- `SEV-2`: fungsi penting terganggu sebagian.
- `SEV-3`: bug non-kritis.

## 8.2 Alur eskalasi
1. Deteksi (monitoring/report user).
2. Triage (scope, impact, severity).
3. Mitigasi cepat (hotfix/rollback).
4. RCA ringkas setelah stabil.
5. Postmortem untuk SEV-1/SEV-2.

Implementasi saat ini (baseline):
- Workflow guard anomaly auth/payment: `.github/workflows/critical-alert-monitor.yml` (setiap 15 menit + manual trigger).
- Script probe critical: `backend/src/scripts/criticalAlertProbe.js` (`npm run monitor:critical`).
- Dokumen playbook insiden aktif: `INCIDENT_RESPONSE_PLAYBOOK.md`.

## 9) Monitoring Minimum Produksi
- uptime monitoring backend/frontend,
- error tracking terpusat,
- alert untuk auth anomaly dan payment verification failure,
- dashboard metric dasar (CPU, RAM, disk, response time).

Implementasi saat ini (baseline):
- Workflow terjadwal uptime probe: `.github/workflows/uptime-monitor.yml` (setiap 30 menit + manual trigger).
- Script probe: `backend/src/scripts/uptimeProbe.js` (`npm run monitor:uptime`).
- Cakupan probe (berdasarkan secret URL yang tersedia):
  - backend health,
  - backend public health,
  - hardening docs endpoint (`403 SECURITY_DOCS_DISABLED`),
  - dashboard health,
  - frontend health.
- Alert ops opsional via webhook `OPS_ALERT_WEBHOOK_URL` bila probe gagal.

Error tracking baseline:
- Error tracker hook terpusat aktif di global error handler (`backend/src/middlewares/errorHandler.js` -> `backend/src/utils/errorTracker.js`).
- Default mode saat ini: `log-only` (aman tanpa external credential).
- Aktivasi provider eksternal disiapkan via env:
  - `ERROR_TRACKING_ENABLED=true`
  - `ERROR_TRACKING_PROVIDER=<provider-name>`
- Sanitization wajib: header sensitif (`authorization`, `cookie`) dan identitas sensitif tidak dikirim raw.

## 10) Backup & Restore Ops

## 10.1 Backup
- DB backup harian.
- Upload folder backup berkala ke secondary location.

## 10.2 Restore drill
- uji restore terjadwal (minimal bulanan disarankan),
- validasi integritas data setelah restore,
- dokumentasi hasil restore test.

Command referensi:
- Backup uploads: `cd backend && npm run backup:uploads`
- Restore uploads: `cd backend && npm run restore:uploads`
- Restore smoke check: `cd backend && npm run restore:smoke`

## 10.3 Evidence Template (Post Deploy / Restore)
Gunakan template ini setiap release/restore agar audit trail konsisten:

```text
Timestamp: YYYY-MM-DD HH:mm:ss TZ
Environment: staging|production
Release/Backup ID: <tag/commit/backup-name>
Executor: <nama>

Checks:
- backend smoke: PASS|FAIL (command + output ringkas)
- dashboard menu-route check: PASS|FAIL
- docs hardening check (`SECURITY_DOCS_DISABLED`): PASS|FAIL
- upload/payment sanity: PASS|FAIL (manual notes)

Artifacts:
- CI run URL / workflow ID
- Log file / screenshot / curl output

Approval:
- Technical owner: <nama>
- Ops/Product representative: <nama>
```

## 11) Ownership & Approval
Tetapkan PIC per area:
- Backend owner
- Dashboard owner
- Frontend owner
- Infra/DevOps owner

Setiap release production wajib mendapat persetujuan minimal:
- teknikal owner,
- product/ops representative.

## 12) Catatan Lanjutan
Setelah infra final disetujui kantor, dokumen ini perlu diupdate dengan:
- detail provider/host,
- detail CI/CD aktual,
- domain & SSL final,
- angka SLO final,
- on-call roster.

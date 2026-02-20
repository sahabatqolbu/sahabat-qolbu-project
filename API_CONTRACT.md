# API_CONTRACT - Sahabat Qolbu

Status dokumen: **Draft Kontrak v1.0**  
Tanggal: **2026-02-14**

## 1) Tujuan
Dokumen ini mendefinisikan standar kontrak API agar seluruh client (`dashboard`, `frontend`, integrasi internal) konsisten dan aman saat release.

## 2) Versioning Strategy
- Base path direkomendasikan: `/api/v1`.
- Breaking change hanya boleh pada versi mayor berikutnya (mis. `v2`).
- Endpoint lama diberi masa deprecate terjadwal sebelum dinonaktifkan.

## 3) Response Standard

## 3.1 Success response (default)
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {}
}
```

## 3.2 Paginated response
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

## 3.3 Error response
```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    { "field": "email", "message": "Format email tidak valid" }
  ]
}
```

## 3.4 Catatan penting
- `message` wajib human-readable (bahasa operasional tim).
- `data` bisa `null` untuk operasi non-return payload.
- `errors` opsional dan dipakai untuk validasi/input issue.

## 4) HTTP Status Convention
- `200 OK`: read/update berhasil.
- `201 Created`: create berhasil.
- `400 Bad Request`: validasi/input tidak valid.
- `401 Unauthorized`: token/cookie tidak valid.
- `403 Forbidden`: role tidak berhak.
- `404 Not Found`: resource tidak ada/akses ditutup.
- `409 Conflict`: bentrok data unik/state.
- `422 Unprocessable Entity`: valid format tapi tidak lolos rule bisnis.
- `429 Too Many Requests`: rate limit.
- `500 Internal Server Error`: error internal.

## 5) Header & Auth Policy
- Auth utama: cookie `access_token` (httpOnly).
- Untuk request sensitif berbasis cookie, origin validation wajib aktif.
- Content type default: `application/json`.
- Upload endpoint: `multipart/form-data`.

## 6) Idempotency & Retry
- `GET` harus idempotent.
- `POST` payment/upload penting disarankan memakai key/idempotency strategy pada fase berikutnya.
- Client boleh retry untuk network error dengan backoff.

## 7) Error Code Internal (Disarankan)
Tambahkan `code` terstruktur pada error untuk client handling yang stabil, misalnya:
- `AUTH_INVALID_TOKEN`
- `AUTH_FORBIDDEN_ROLE`
- `VALIDATION_FAILED`
- `PAYMENT_PROOF_INVALID`
- `RESOURCE_NOT_FOUND`

Contoh:
```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "Validasi gagal",
  "errors": []
}
```

## 8) Endpoint Catalog (Ringkas)

## 8.1 Auth
- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/request-otp`
- `GET /auth/me`
- `POST /auth/logout`

## 8.2 Public
- `GET /public/packages`
- `GET /public/packages/:id`
- `GET /public/agents/slugs`
- `GET /public/agents/:slug`

## 8.3 Admin domain
- users, packages, jamaah, agen, transactions, master data, reports, content.

## 8.4 AGEN domain
- profile, jamaah management, payment proof support, website management.

## 8.5 JAMAAH domain
- profile, biodata, documents, payments, package info.

Catatan: daftar endpoint detail per modul sebaiknya dikelola via generated OpenAPI di fase berikutnya.

## 9) Breaking Change Policy
- Setiap PR yang mengubah payload request/response wajib menandai `BREAKING_CHANGE`.
- Wajib update dokumen kontrak + contoh payload.
- Wajib sinkronisasi client sebelum cut-over endpoint lama.

## 10) Deprecation Template
Gunakan format ini saat menandai endpoint lama:
- Endpoint: `/api/v1/example`
- Status: Deprecated sejak `YYYY-MM-DD`
- Pengganti: `/api/v2/example`
- Sunset date: `YYYY-MM-DD`
- Dampak client: [ringkas]

## 11) Checklist API Release
- [ ] Kontrak response mengikuti standar.
- [ ] HTTP status sesuai konvensi.
- [ ] Endpoint baru tercatat di catalog.
- [ ] Tidak ada breaking change tanpa versi/deprecation plan.
- [ ] Dashboard/frontend service layer sudah sinkron.

## 12) Governance di Repository
- PR backend wajib menggunakan checklist kontrak API pada template PR: `.github/pull_request_template.md`.
- Baseline OpenAPI awal tersedia di `backend/openapi/openapi.v1.baseline.yaml` dengan cakupan bertahap domain prioritas:
  - auth
  - public
  - jamaah-payment
  - transactions
- Setiap perubahan kontraktual pada domain baseline wajib memperbarui file OpenAPI tersebut dalam PR yang sama.

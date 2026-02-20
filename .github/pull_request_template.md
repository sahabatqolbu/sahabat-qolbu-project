## Summary
- 

## API Contract Checklist (Backend)
- [ ] Mengacu ke `API_CONTRACT.md` untuk format response (`success/message/data/errors`).
- [ ] HTTP status sudah sesuai konvensi kontrak (`200/201/400/401/403/404/409/422/429/500`).
- [ ] Error `code` terstruktur ditambahkan/diupdate jika ada flow baru.
- [ ] Tidak ada breaking change tanpa catatan deprecation/versioning plan.
- [ ] Jika mengubah request/response endpoint existing, contoh payload kontrak ikut diperbarui.

## OpenAPI Impact
- [ ] Tidak ada perubahan endpoint kontraktual.
- [ ] Ada perubahan endpoint kontraktual dan baseline OpenAPI sudah diperbarui (`backend/openapi/openapi.v1.baseline.yaml`).

## Validation
- [ ] Test/lint relevan sudah dijalankan dan hasilnya dicatat.

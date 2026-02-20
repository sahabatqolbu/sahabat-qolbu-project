# Storage Backup Runbook (Uploads)

Dokumen ini mencatat implementasi backup/restore untuk folder upload backend.

## Scope
- Source utama upload: `backend/public/uploads`
- Backup output default: `backend/backups/uploads`
- Retention default: `14 hari`

## Scripts
- Backup: `npm run backup:uploads`
- Restore: `npm run restore:uploads`
- Restore smoke check: `npm run restore:smoke`

## Environment Variables
- `BACKUP_OUTPUT_DIR` (opsional): override lokasi backup (relative ke `backend/`)
- `BACKUP_RETENTION_DAYS` (opsional): jumlah hari retensi backup
- `BACKUP_NAME` (opsional untuk restore): nama folder backup tertentu; default `latest`

## Backup Process
1. Script membuat snapshot folder upload ke direktori baru berformat `uploads-<timestamp>`.
2. Script menulis metadata backup ke `backup-metadata.json`.
3. Script menghapus backup lama sesuai retention policy.

Contoh:
```bash
npm run backup:uploads
```

## Restore Process
1. Script memilih backup `latest` (atau `BACKUP_NAME` jika diset).
2. Folder `public/uploads` saat ini diganti dengan isi backup terpilih.
3. Script menampilkan ringkasan source/target restore.

Contoh restore latest:
```bash
npm run restore:uploads
```

Contoh restore backup tertentu:
```bash
BACKUP_NAME=uploads-2026-02-17T05-13-50-149Z npm run restore:uploads
```

## Restore Drill (Recommended)
- Workflow scheduler: `.github/workflows/uploads-restore-drill.yml`
- Frekuensi default: bulanan (awal bulan) + manual trigger.
- Drill flow:
  1. Buat backup terbaru,
  2. restore dari `latest`,
  3. jalankan smoke check metadata (`restore:smoke`).

Gunakan template laporan: `backend/RESTORE_DRILL_TEMPLATE.md`.

## Operational Notes
- Jalankan pada environment non-production terlebih dahulu untuk drill.
- Untuk production, jadwalkan backup harian (cron/CI scheduler).
- Simpan snapshot backup di secondary location (mount/storage terpisah) via `BACKUP_OUTPUT_DIR`.
- Tetap hindari menyimpan secret dalam folder upload.

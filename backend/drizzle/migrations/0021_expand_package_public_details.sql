ALTER TABLE packages
  ADD COLUMN registration_requirements TEXT NULL AFTER notes,
  ADD COLUMN terms_conditions TEXT NULL AFTER registration_requirements,
  ADD COLUMN registration_steps TEXT NULL AFTER terms_conditions;
--> statement-breakpoint
ALTER TABLE master_hotels
  ADD COLUMN description TEXT NULL AFTER name,
  ADD COLUMN map_url VARCHAR(500) NULL AFTER address,
  ADD COLUMN video_urls JSON NULL AFTER image_url;
--> statement-breakpoint
ALTER TABLE master_airlines
  ADD COLUMN description TEXT NULL AFTER name,
  ADD COLUMN facilities TEXT NULL AFTER country,
  ADD COLUMN video_urls JSON NULL AFTER facilities;
--> statement-breakpoint
UPDATE packages
SET registration_requirements = 'Fotokopi KTP\nFotokopi Kartu Keluarga\nPaspor aktif sesuai ketentuan paket\nPas foto 4x6\nSehat jasmani dan rohani'
WHERE registration_requirements IS NULL OR TRIM(registration_requirements) = '';
--> statement-breakpoint
UPDATE packages
SET terms_conditions = 'Pendaftaran dan penguncian seat berlaku setelah data serta pembayaran DP dikonfirmasi\nPembayaran hanya dilakukan ke rekening resmi PT Sahabat Qolbu Cahaya Baitullah\nBiaya yang tidak tercantum dalam fasilitas paket menjadi tanggungan jamaah\nJadwal, hotel, dan maskapai dapat menyesuaikan kondisi operasional dengan pemberitahuan resmi\nDokumen perjalanan dan ketentuan kesehatan wajib dipenuhi sebelum keberangkatan'
WHERE terms_conditions IS NULL OR TRIM(terms_conditions) = '';
--> statement-breakpoint
UPDATE packages
SET registration_steps = 'Hubungi admin untuk mengecek seat, jadwal, dan pilihan kamar\nPilih paket serta komposisi kamar yang sesuai\nKirim data dan dokumen pendaftaran\nBayar DP melalui rekening resmi perusahaan\nKonfirmasi pembayaran kepada admin\nIkuti grup keberangkatan untuk persiapan lanjutan'
WHERE registration_steps IS NULL OR TRIM(registration_steps) = '';
--> statement-breakpoint
DELETE itinerary
FROM package_itinerary itinerary
LEFT JOIN packages package_row ON package_row.id = itinerary.package_id
WHERE package_row.id IS NULL;
--> statement-breakpoint
DELETE duplicate_row
FROM package_itinerary duplicate_row
INNER JOIN package_itinerary retained_row
  ON retained_row.package_id = duplicate_row.package_id
  AND retained_row.day_number = duplicate_row.day_number
  AND retained_row.id < duplicate_row.id;
--> statement-breakpoint
CREATE UNIQUE INDEX package_itinerary_package_day_unique
  ON package_itinerary(package_id, day_number);
--> statement-breakpoint
ALTER TABLE package_itinerary
  ADD CONSTRAINT package_itinerary_package_fk
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;

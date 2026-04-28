DROP INDEX `user_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `package_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `agen_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `mahram_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `status_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `booking_number_idx` ON `jamaah_data`;--> statement-breakpoint
DROP INDEX `jamaah_idx` ON `jamaah_payments`;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `user_id` int;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `package_id` int;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `date_of_booking` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `nik` varchar(20);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `birth_date` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `gender` varchar(10);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `mahram_relation` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `note_paket` varchar(50) DEFAULT 'FULLSERVICE';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `room_type_makkah` varchar(20);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `room_type_madinah` varchar(20);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `harga_paket` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `harga_final` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `outstanding` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `status_payment` varchar(20) DEFAULT 'BELUM_BAYAR';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `registration_status` varchar(20) DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `payment_number` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `paid_by` varchar(255);--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `payment_date` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `amount` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `verified_at` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `province` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `postal_code` varchar(10);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `education` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `occupation` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_number` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_issue_date` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_expiry` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_issue_place` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `emergency_name` varchar(255);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `emergency_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `emergency_relation` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `foto_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `ktp_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `kk_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `buku_nikah_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `akta_lahir_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `vaksin_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `meningitis_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD CONSTRAINT `jamaah_data_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD CONSTRAINT `jamaah_data_package_id_packages_id_fk` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD CONSTRAINT `jamaah_data_agen_id_users_id_fk` FOREIGN KEY (`agen_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD CONSTRAINT `jamaah_payments_jamaah_id_jamaah_data_id_fk` FOREIGN KEY (`jamaah_id`) REFERENCES `jamaah_data`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD CONSTRAINT `jamaah_payments_bank_id_master_banks_id_fk` FOREIGN KEY (`bank_id`) REFERENCES `master_banks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD CONSTRAINT `jamaah_payments_verified_by_users_id_fk` FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `invoice_number`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `paspor_asli`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `passport_expiry`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `umur`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `phone`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `riwayat_sakit`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `permintaan_khusus`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `size_gamis`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `size_koko`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `size_outer`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `lainnya`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `keterangan`;
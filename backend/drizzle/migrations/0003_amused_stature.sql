CREATE TABLE `jamaah_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jamaah_id` int NOT NULL,
	`payment_number` int,
	`bank_id` int,
	`paid_by` varchar(100),
	`payment_date` date,
	`amount` decimal(15,2),
	`proof_url` varchar(500),
	`verified_by` int,
	`verified_at` timestamp,
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `jamaah_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP INDEX `jamaah_data_user_id_unique`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP INDEX `jamaah_data_nik_unique`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP INDEX `jamaah_data_passport_number_unique`;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `email` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `package_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `registration_status` enum('DRAFT','PENDING_DOCUMENT','PENDING_PAYMENT','CONFIRMED','CANCELLED') DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `is_profile_complete` boolean;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `nama_mitra` varchar(255);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `booking_number` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `date_of_booking` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `invoice_number` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `nama_paspor` varchar(255);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `paspor_asli` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `umur` int;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `riwayat_sakit` text;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `permintaan_khusus` text;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `size_gamis` enum('S','M','L','XL','XXL');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `size_koko` enum('S','M','L','XL','XXL');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `size_outer` enum('S','M','L','XL','XXL');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `note_paket` enum('FULLSERVICE','EXTREME','KONSORSIUM','B2B');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `room_type_makkah` enum('DOUBLE','TRIPLE','QUAD','QUINT');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `room_type_madinah` enum('DOUBLE','TRIPLE','QUAD','QUINT');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `harga_paket` decimal(15,2);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `potongan_fee_agen` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `potongan_poin_agen` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `potongan_cashback_kk` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `harga_final` decimal(15,2);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `total_payment` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `outstanding` decimal(15,2);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `status_payment` enum('BELUM_BAYAR','CICILAN','LUNAS') DEFAULT 'BELUM_BAYAR';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `lainnya` text;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `keterangan` text;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD CONSTRAINT `jamaah_data_booking_number_unique` UNIQUE(`booking_number`);--> statement-breakpoint
CREATE INDEX `jamaah_idx` ON `jamaah_payments` (`jamaah_id`);--> statement-breakpoint
CREATE INDEX `booking_number_idx` ON `jamaah_data` (`booking_number`);--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `full_name`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `whatsapp`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `province`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `city`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `district`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `postal_code`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `passport_number`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `passport_issue_place`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `marital_status`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `room_type`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `completed_at`;
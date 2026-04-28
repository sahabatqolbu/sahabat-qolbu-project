DROP TABLE `jamaah_documents`;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `booking_number` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `date_of_booking` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `note_paket` enum('FULLSERVICE','EXTREME','KONSORSIUM','B2B') DEFAULT 'FULLSERVICE';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `room_type_makkah` enum('DOUBLE','TRIPLE','QUAD','QUINT');--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `room_type_madinah` enum('DOUBLE','TRIPLE','QUAD','QUINT');--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `status_payment` enum('BELUM_BAYAR','CICILAN','LUNAS') DEFAULT 'BELUM_BAYAR';--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `birth_date` date;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `gender` enum('PRIA','WANITA');--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `mahram_relation` enum('SUAMI','ISTRI','AYAH','IBU','ANAK','SAUDARA_KANDUNG');--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `registration_status` enum('DRAFT','PENDING_DOCUMENT','PENDING_PAYMENT','VERIFIED','APPROVED','REJECTED') DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `marital_status` enum('BELUM_MENIKAH','MENIKAH','CERAI','DUDA_JANDA');--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `district` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `passport_number` varchar(50);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `passport_issue_date` date;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `passport_expiry` date;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `passport_issue_place` varchar(100);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `ijazah_url` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD CONSTRAINT `jamaah_data_mahram_id_jamaah_data_id_fk` FOREIGN KEY (`mahram_id`) REFERENCES `jamaah_data`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `jamaah_data` (`user_id`);--> statement-breakpoint
CREATE INDEX `booking_idx` ON `jamaah_data` (`booking_number`);--> statement-breakpoint
CREATE INDEX `nik_idx` ON `jamaah_data` (`nik`);--> statement-breakpoint
CREATE INDEX `passport_idx` ON `jamaah_data` (`passport_number`);--> statement-breakpoint
CREATE INDEX `mahram_idx` ON `jamaah_data` (`mahram_id`);--> statement-breakpoint
CREATE INDEX `package_idx` ON `jamaah_data` (`package_id`);--> statement-breakpoint
CREATE INDEX `status_payment_idx` ON `jamaah_data` (`status_payment`);--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `education`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `occupation`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `paspor_number`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `paspor_issue_date`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `paspor_expiry`;--> statement-breakpoint
ALTER TABLE `jamaah_data` DROP COLUMN `paspor_issue_place`;
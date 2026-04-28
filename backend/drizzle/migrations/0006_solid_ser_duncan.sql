CREATE TABLE `agen_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nama_ktp` varchar(255),
	`nama_panggilan` varchar(100),
	`nik` varchar(20),
	`tempat_lahir` varchar(100),
	`tanggal_lahir` date,
	`alamat` text,
	`provinsi` varchar(100),
	`kota` varchar(100),
	`kode_pos` varchar(10),
	`instagram` varchar(100),
	`tiktok` varchar(100),
	`level` enum('PRA_AGENT','BASIC_AGENT','SILVER_AGENT') DEFAULT 'PRA_AGENT',
	`referral_code` varchar(20),
	`recruited_by_id` int,
	`tujuan_bergabung` json,
	`ktp_url` varchar(500),
	`bukti_tf_url` varchar(500),
	`nama_rekening` varchar(255),
	`nomor_rekening` varchar(50),
	`nama_bank` varchar(100),
	`persyaratan_accepted` boolean DEFAULT false,
	`persyaratan_accepted_at` datetime,
	`status` enum('PENDING','PENDING_VERIFICATION','ACTIVE','SUSPENDED','REJECTED') DEFAULT 'PENDING',
	`verified_by_id` int,
	`verified_at` datetime,
	`rejection_reason` text,
	`is_profile_complete` boolean DEFAULT false,
	`total_jamaah` int DEFAULT 0,
	`total_komisi` decimal(15,2) DEFAULT '0',
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agen_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `agen_profiles_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `agen_profiles_referral_code_unique` UNIQUE(`referral_code`)
);
--> statement-breakpoint
CREATE TABLE `agen_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agen_id` int NOT NULL,
	`type` enum('REGISTRATION_FEE','KOMISI_JAMAAH','BONUS_REFERRAL','WITHDRAWAL') NOT NULL,
	`jamaah_id` int,
	`referred_agen_id` int,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500),
	`transaction_date` datetime DEFAULT CURRENT_TIMESTAMP,
	`proof_url` varchar(500),
	`status` enum('PENDING','VERIFIED','REJECTED','PAID') DEFAULT 'PENDING',
	`verified_by_id` int,
	`verified_at` datetime,
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agen_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_level_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_closing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_data_id` int NOT NULL,
	`jamaah_data_id` int NOT NULL,
	`period_id` int NOT NULL,
	`closing_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`amount` decimal(15,2),
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agent_closing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`full_name_ktp` varchar(255),
	`nickname` varchar(100),
	`birth_place` varchar(100),
	`birth_date` date,
	`nik` varchar(20),
	`address` text,
	`province` varchar(100),
	`city` varchar(100),
	`postal_code` varchar(10),
	`instagram` varchar(100),
	`facebook` varchar(100),
	`tiktok` varchar(100),
	`current_level_id` int,
	`current_star` int NOT NULL DEFAULT 0,
	`star_obtained_by` enum('PAYMENT','CLOSING'),
	`certificate_number` varchar(100),
	`certificate_file` varchar(500),
	`certificate_issue_date` datetime,
	`certificate_valid_from` datetime,
	`certificate_valid_until` datetime,
	`total_closing` int NOT NULL DEFAULT 0,
	`last_closing_at` datetime,
	`referral_code` varchar(50),
	`recruiter_code` varchar(50),
	`recruiter_name` varchar(255),
	`purposes` json,
	`custom_purpose` text,
	`ktp_photo` varchar(500),
	`payment_proof` varchar(500),
	`account_name` varchar(255),
	`account_number` varchar(50),
	`bank_name` varchar(100),
	`status` enum('DRAFT','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`is_complete` boolean NOT NULL DEFAULT false,
	`rejection_note` text,
	`agreed_requirements` json,
	`agreed_at` datetime,
	`submitted_at` datetime,
	`approved_at` datetime,
	`approved_by` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_data_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `agent_data_nik_unique` UNIQUE(`nik`),
	CONSTRAINT `agent_data_certificate_number_unique` UNIQUE(`certificate_number`),
	CONSTRAINT `agent_data_referral_code_unique` UNIQUE(`referral_code`)
);
--> statement-breakpoint
CREATE TABLE `agent_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`star` int NOT NULL,
	`price` decimal(15,2) NOT NULL DEFAULT '0',
	`min_closing` int,
	`max_period` int,
	`maintain_closing` int,
	`maintain_period` int,
	`downgrade_closing` int,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_levels_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `agent_levels_star_unique` UNIQUE(`star`)
);
--> statement-breakpoint
CREATE TABLE `agent_payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_data_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`target_star` int NOT NULL,
	`payment_date` datetime NOT NULL,
	`proof` varchar(500),
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_purposes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` varchar(100) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_purposes_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_purposes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `agent_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_star_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_data_id` int NOT NULL,
	`from_star` int NOT NULL,
	`to_star` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `agent_star_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('AGENT_REGISTERED','AGENT_SUBMITTED','AGENT_APPROVED','AGENT_REJECTED','JAMAAH_REGISTERED','JAMAAH_SUBMITTED','JAMAAH_APPROVED','PAYMENT_CREATED','PAYMENT_VERIFIED','BOOKING_CREATED','SYSTEM') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`reference_id` int,
	`reference_type` varchar(50),
	`is_read` boolean NOT NULL DEFAULT false,
	`read_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`duration` int NOT NULL DEFAULT 30,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `jamaah_payments` MODIFY COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `packages` MODIFY COLUMN `type` enum('FULL_SERVICE','EXTREME','SEMI_MANDIRI','FLEKSIBILITAS','KONSORSIUM','LA') NOT NULL DEFAULT 'FULL_SERVICE';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('ADMIN','FINANCE','STAFF','AGEN','JAMAAH') NOT NULL DEFAULT 'JAMAAH';--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `approved_at` timestamp;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `approved_by` int;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `rejected_at` timestamp;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `rejected_by` int;--> statement-breakpoint
ALTER TABLE `jamaah_data` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `agen_profiles` ADD CONSTRAINT `agen_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_profiles` ADD CONSTRAINT `agen_profiles_recruited_by_id_agen_profiles_id_fk` FOREIGN KEY (`recruited_by_id`) REFERENCES `agen_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_profiles` ADD CONSTRAINT `agen_profiles_verified_by_id_users_id_fk` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_transactions` ADD CONSTRAINT `agen_transactions_agen_id_agen_profiles_id_fk` FOREIGN KEY (`agen_id`) REFERENCES `agen_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_transactions` ADD CONSTRAINT `agen_transactions_jamaah_id_jamaah_data_id_fk` FOREIGN KEY (`jamaah_id`) REFERENCES `jamaah_data`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_transactions` ADD CONSTRAINT `agen_transactions_referred_agen_id_agen_profiles_id_fk` FOREIGN KEY (`referred_agen_id`) REFERENCES `agen_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agen_transactions` ADD CONSTRAINT `agen_transactions_verified_by_id_users_id_fk` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_benefits` ADD CONSTRAINT `agent_benefits_agent_level_id_agent_levels_id_fk` FOREIGN KEY (`agent_level_id`) REFERENCES `agent_levels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_closing_history` ADD CONSTRAINT `agent_closing_history_agent_data_id_agent_data_id_fk` FOREIGN KEY (`agent_data_id`) REFERENCES `agent_data`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_closing_history` ADD CONSTRAINT `agent_closing_history_jamaah_data_id_jamaah_data_id_fk` FOREIGN KEY (`jamaah_data_id`) REFERENCES `jamaah_data`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_closing_history` ADD CONSTRAINT `agent_closing_history_period_id_periods_id_fk` FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_data` ADD CONSTRAINT `agent_data_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_data` ADD CONSTRAINT `agent_data_current_level_id_agent_levels_id_fk` FOREIGN KEY (`current_level_id`) REFERENCES `agent_levels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_data` ADD CONSTRAINT `agent_data_approved_by_users_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_payment_transactions` ADD CONSTRAINT `agent_payment_transactions_agent_data_id_agent_data_id_fk` FOREIGN KEY (`agent_data_id`) REFERENCES `agent_data`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_star_history` ADD CONSTRAINT `agent_star_history_agent_data_id_agent_data_id_fk` FOREIGN KEY (`agent_data_id`) REFERENCES `agent_data`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `agen_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `referral_code_idx` ON `agen_profiles` (`referral_code`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agen_profiles` (`status`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `agen_profiles` (`level`);--> statement-breakpoint
CREATE INDEX `recruited_by_idx` ON `agen_profiles` (`recruited_by_id`);--> statement-breakpoint
CREATE INDEX `agen_idx` ON `agen_transactions` (`agen_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `agen_transactions` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agen_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `agent_benefits` (`agent_level_id`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_closing_history` (`agent_data_id`);--> statement-breakpoint
CREATE INDEX `period_idx` ON `agent_closing_history` (`period_id`);--> statement-breakpoint
CREATE INDEX `jamaah_idx` ON `agent_closing_history` (`jamaah_data_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `agent_data` (`user_id`);--> statement-breakpoint
CREATE INDEX `nik_idx` ON `agent_data` (`nik`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `agent_data` (`status`);--> statement-breakpoint
CREATE INDEX `star_idx` ON `agent_data` (`current_star`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `agent_levels` (`slug`);--> statement-breakpoint
CREATE INDEX `star_idx` ON `agent_levels` (`star`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_payment_transactions` (`agent_data_id`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `agent_purposes` (`slug`);--> statement-breakpoint
CREATE INDEX `agent_idx` ON `agent_star_history` (`agent_data_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `periods` (`start_date`,`end_date`);
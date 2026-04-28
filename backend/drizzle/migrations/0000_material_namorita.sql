CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`description` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_name` varchar(200) NOT NULL,
	`tagline` varchar(255),
	`logo` varchar(255),
	`address` text,
	`city` varchar(100),
	`province` varchar(100),
	`postal_code` varchar(10),
	`phone` varchar(20),
	`whatsapp` varchar(20),
	`email` varchar(100),
	`website` varchar(100),
	`instagram` varchar(100),
	`facebook` varchar(100),
	`youtube` varchar(100),
	`tiktok` varchar(100),
	`npwp` varchar(50),
	`ppiu` varchar(50),
	`iata` varchar(50),
	`description` text,
	`vision` text,
	`mission` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `company_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itikaf_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`program_id` int NOT NULL,
	`user_id` int NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`status` enum('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`payment_status` enum('UNPAID','PAID') NOT NULL DEFAULT 'UNPAID',
	`payment_proof` varchar(500),
	`registered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `itikaf_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itikaf_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`location` varchar(255) NOT NULL,
	`max_participants` int NOT NULL DEFAULT 50,
	`registered_count` int NOT NULL DEFAULT 0,
	`registration_fee` decimal(10,2) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `itikaf_programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jamaah_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`nik` varchar(16),
	`full_name` varchar(255) NOT NULL,
	`gender` enum('PRIA','WANITA') NOT NULL,
	`birth_place` varchar(100),
	`birth_date` date,
	`phone` varchar(20) NOT NULL,
	`whatsapp` varchar(20),
	`email` varchar(255),
	`address` text,
	`province` varchar(100),
	`city` varchar(100),
	`district` varchar(100),
	`postal_code` varchar(10),
	`passport_number` varchar(50),
	`passport_expiry` date,
	`passport_issue_place` varchar(100),
	`marital_status` enum('BELUM_MENIKAH','MENIKAH','CERAI','DUDA_JANDA'),
	`mahram_id` int,
	`mahram_relation` enum('SUAMI','ISTRI','AYAH','IBU','ANAK','SAUDARA'),
	`package_id` int,
	`room_type` enum('QUAD','TRIPLE','DOUBLE'),
	`agen_id` int,
	`registration_status` enum('DRAFT','PENDING_DOCUMENT','PENDING_PAYMENT','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`is_profile_complete` boolean NOT NULL DEFAULT false,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jamaah_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `jamaah_data_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `jamaah_data_nik_unique` UNIQUE(`nik`),
	CONSTRAINT `jamaah_data_passport_number_unique` UNIQUE(`passport_number`)
);
--> statement-breakpoint
CREATE TABLE `jamaah_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jamaah_id` int NOT NULL,
	`document_type_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int,
	`mime_type` varchar(100),
	`is_verified` boolean NOT NULL DEFAULT false,
	`verified_by` int,
	`verified_at` timestamp,
	`rejection_reason` text,
	`uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `jamaah_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_airlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`logo` varchar(500),
	`country` varchar(100),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_airlines_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_airlines_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `master_airports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_airports_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_airports_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `master_banks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank_name` varchar(100) NOT NULL,
	`account_number` varchar(50) NOT NULL,
	`account_name` varchar(100) NOT NULL,
	`branch` varchar(100),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `master_banks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`category` enum('IDENTITAS','TRAVEL','KESEHATAN','LAINNYA') NOT NULL,
	`file_format` varchar(50),
	`max_size_mb` int DEFAULT 5,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_hotels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` enum('MAKKAH','MADINAH') NOT NULL,
	`address` text,
	`star_rating` int,
	`distance_to_haram` int,
	`facilities` text,
	`image_url` varchar(500),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_hotels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('UMRAH','HAJI','UMRAH_PLUS') NOT NULL,
	`duration` int NOT NULL,
	`price_quad` decimal(12,2),
	`price_triple` decimal(12,2),
	`price_double` decimal(12,2),
	`commission_percentage` decimal(5,2) DEFAULT '5.00',
	`departure_date` date NOT NULL,
	`return_date` date NOT NULL,
	`airline_id` int NOT NULL,
	`hotel_makkah_id` int NOT NULL,
	`hotel_madinah_id` int,
	`total_seats` int NOT NULL DEFAULT 45,
	`booked_seats` int NOT NULL DEFAULT 0,
	`itinerary` text,
	`facilities` text,
	`terms` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `payment_installments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` int NOT NULL,
	`installment_number` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`due_date` date NOT NULL,
	`paid_amount` decimal(12,2) DEFAULT '0.00',
	`paid_at` timestamp,
	`status` enum('PENDING','PAID','OVERDUE') NOT NULL DEFAULT 'PENDING',
	`payment_proof` varchar(500),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_installments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jamaah_id` int NOT NULL,
	`package_id` int NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`total_amount` decimal(12,2) NOT NULL,
	`paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
	`remaining_amount` decimal(12,2) NOT NULL,
	`commission_amount` decimal(12,2) DEFAULT '0.00',
	`commission_status` enum('PENDING','APPROVED','PAID') DEFAULT 'PENDING',
	`commission_paid_at` timestamp,
	`payment_method` enum('BANK_TRANSFER','CASH','VIRTUAL_ACCOUNT','QRIS'),
	`payment_proof` varchar(500),
	`status` enum('PENDING','PARTIAL','PAID','VERIFIED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
	`verified_by` int,
	`verified_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','FINANCE','AGEN','JAMAAH') NOT NULL DEFAULT 'JAMAAH',
	`full_name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`otp` varchar(6),
	`otp_expiry` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_email_verified` boolean NOT NULL DEFAULT false,
	`last_login` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `program_idx` ON `itikaf_participants` (`program_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `itikaf_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `jamaah_data` (`user_id`);--> statement-breakpoint
CREATE INDEX `package_idx` ON `jamaah_data` (`package_id`);--> statement-breakpoint
CREATE INDEX `agen_idx` ON `jamaah_data` (`agen_id`);--> statement-breakpoint
CREATE INDEX `mahram_idx` ON `jamaah_data` (`mahram_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `jamaah_data` (`registration_status`);--> statement-breakpoint
CREATE INDEX `jamaah_idx` ON `jamaah_documents` (`jamaah_id`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `master_hotels` (`city`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `packages` (`type`);--> statement-breakpoint
CREATE INDEX `departure_idx` ON `packages` (`departure_date`);--> statement-breakpoint
CREATE INDEX `transaction_idx` ON `payment_installments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `jamaah_idx` ON `transactions` (`jamaah_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `transactions` (`status`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `transactions` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);
CREATE TABLE `package_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`package_id` int NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`caption` varchar(255),
	`sort_order` int DEFAULT 0,
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `package_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `package_itinerary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`package_id` int NOT NULL,
	`day_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`activities` text,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `package_itinerary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `company_profile` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `company_profile` MODIFY COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `itikaf_programs` MODIFY COLUMN `registration_fee` decimal(12,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `gender` enum('PRIA','WANITA');--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `jamaah_data` MODIFY COLUMN `room_type` enum('QUAD','TRIPLE','DOUBLE','QUINT');--> statement-breakpoint
ALTER TABLE `master_banks` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `master_banks` MODIFY COLUMN `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `packages` MODIFY COLUMN `type` enum('REGULER','VIP','VVIP') NOT NULL DEFAULT 'REGULER';--> statement-breakpoint
ALTER TABLE `packages` MODIFY COLUMN `airline_id` int;--> statement-breakpoint
ALTER TABLE `packages` MODIFY COLUMN `hotel_makkah_id` int;--> statement-breakpoint
ALTER TABLE `payment_installments` MODIFY COLUMN `amount` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_installments` MODIFY COLUMN `paid_amount` decimal(15,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `total_amount` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `remaining_amount` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `commission_amount` decimal(15,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `packages` ADD `description` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `price` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `packages` ADD `discount_price` decimal(15,2);--> statement-breakpoint
ALTER TABLE `packages` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `itinerary_pdf` varchar(500);--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_status` enum('PLANNING','CONFIRMED') DEFAULT 'PLANNING';--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_issued_date` date;--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin1_amount` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin1_date` date;--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin1_status` enum('UNPAID','PAID') DEFAULT 'UNPAID';--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin2_amount` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin2_date` date;--> statement-breakpoint
ALTER TABLE `packages` ADD `airline_termin2_status` enum('UNPAID','PAID') DEFAULT 'UNPAID';--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_makkah_status` enum('PLANNING','CONFIRMED') DEFAULT 'PLANNING';--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_makkah_double` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_makkah_triple` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_makkah_quad` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_makkah_quint` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_madinah_status` enum('PLANNING','CONFIRMED') DEFAULT 'PLANNING';--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_madinah_double` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_madinah_triple` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_madinah_quad` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `hotel_madinah_quint` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `packages` ADD `departure_airport_id` int;--> statement-breakpoint
CREATE INDEX `package_idx` ON `package_images` (`package_id`);--> statement-breakpoint
CREATE INDEX `package_idx` ON `package_itinerary` (`package_id`);--> statement-breakpoint
CREATE INDEX `day_idx` ON `package_itinerary` (`day_number`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `packages` (`code`);--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `price_quad`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `price_triple`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `price_double`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `commission_percentage`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `booked_seats`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `itinerary`;--> statement-breakpoint
ALTER TABLE `packages` DROP COLUMN `terms`;
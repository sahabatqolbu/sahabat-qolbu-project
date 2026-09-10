CREATE TABLE `package_schedule_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`month` varchar(7) NOT NULL,
	`subtitle` varchar(255),
	`note` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `package_schedule_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `package_schedule_list_month_idx` ON `package_schedule_lists` (`month`);
--> statement-breakpoint
CREATE INDEX `package_schedule_list_publication_idx` ON `package_schedule_lists` (`is_active`,`is_published`);
--> statement-breakpoint
CREATE TABLE `package_schedule_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`list_id` int NOT NULL,
	`departure_date` date NOT NULL,
	`duration` int,
	`airline_id` int NOT NULL,
	`arrival_airport_id` int NOT NULL,
	`return_airport_id` int NOT NULL,
	`hotel_makkah_label` varchar(255) NOT NULL,
	`hotel_madinah_label` varchar(255) NOT NULL,
	`hotel_makkah_id` int,
	`hotel_madinah_id` int,
	`price_quad` decimal(15,2) NOT NULL,
	`price_triple` decimal(15,2) NOT NULL,
	`price_double` decimal(15,2) NOT NULL,
	`note` varchar(255),
	`status` enum('CHECK_SEAT','SOLD_OUT','CLOSED') NOT NULL DEFAULT 'CHECK_SEAT',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `package_schedule_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_schedule_item_unique_idx` UNIQUE(`list_id`,`departure_date`,`airline_id`),
	CONSTRAINT `package_schedule_items_list_id_fk` FOREIGN KEY (`list_id`) REFERENCES `package_schedule_lists`(`id`) ON DELETE cascade,
	CONSTRAINT `package_schedule_items_airline_id_fk` FOREIGN KEY (`airline_id`) REFERENCES `master_airlines`(`id`),
	CONSTRAINT `package_schedule_items_arrival_airport_id_fk` FOREIGN KEY (`arrival_airport_id`) REFERENCES `master_airports`(`id`),
	CONSTRAINT `package_schedule_items_return_airport_id_fk` FOREIGN KEY (`return_airport_id`) REFERENCES `master_airports`(`id`),
	CONSTRAINT `package_schedule_items_hotel_makkah_id_fk` FOREIGN KEY (`hotel_makkah_id`) REFERENCES `master_hotels`(`id`),
	CONSTRAINT `package_schedule_items_hotel_madinah_id_fk` FOREIGN KEY (`hotel_madinah_id`) REFERENCES `master_hotels`(`id`)
);
--> statement-breakpoint
CREATE INDEX `package_schedule_item_list_idx` ON `package_schedule_items` (`list_id`);
--> statement-breakpoint
CREATE INDEX `package_schedule_item_departure_idx` ON `package_schedule_items` (`departure_date`);
--> statement-breakpoint
CREATE INDEX `package_schedule_item_airline_idx` ON `package_schedule_items` (`airline_id`);

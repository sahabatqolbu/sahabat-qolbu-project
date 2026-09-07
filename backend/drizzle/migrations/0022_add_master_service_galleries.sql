CREATE TABLE `master_hotel_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotel_id` int NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`caption` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `master_hotel_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_hotel_images_hotel_id_master_hotels_id_fk` FOREIGN KEY (`hotel_id`) REFERENCES `master_hotels`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `master_hotel_image_hotel_idx` ON `master_hotel_images` (`hotel_id`);
--> statement-breakpoint
CREATE TABLE `master_airline_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`airline_id` int NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`caption` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `master_airline_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_airline_images_airline_id_master_airlines_id_fk` FOREIGN KEY (`airline_id`) REFERENCES `master_airlines`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `master_airline_image_airline_idx` ON `master_airline_images` (`airline_id`);

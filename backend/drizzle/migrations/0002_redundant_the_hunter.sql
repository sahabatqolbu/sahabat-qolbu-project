CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('UMRAH','HAJI','PAYMENT','GENERAL') DEFAULT 'GENERAL',
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`description` text,
	`image_url` varchar(500) NOT NULL,
	`category` enum('KEBERANGKATAN','HOTEL','MASJID','KEGIATAN','LAINNYA') DEFAULT 'LAINNYA',
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `gallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(100),
	`photo` varchar(500),
	`rating` int DEFAULT 5,
	`message` text NOT NULL,
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);

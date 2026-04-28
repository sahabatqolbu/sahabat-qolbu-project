CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255),
	`type` enum('PACKAGE','ITINERARY','DEADLINE','MANASIK','MEETING','EVENT','ANNOUNCEMENT','OTHER') NOT NULL DEFAULT 'EVENT',
	`start_date` date NOT NULL,
	`end_date` date,
	`start_time` varchar(10),
	`end_time` varchar(10),
	`is_all_day` boolean DEFAULT true,
	`day_number` int,
	`city` enum('JAKARTA','MADINAH','MAKKAH','JEDDAH','OTHER'),
	`package_id` int,
	`icon` varchar(10) DEFAULT '📅',
	`visibility` enum('ALL','ADMIN_AGEN','ADMIN_ONLY','PACKAGE_MEMBERS') DEFAULT 'ALL',
	`color` varchar(20) DEFAULT 'blue',
	`reminder_days` int,
	`reminder_sent` boolean DEFAULT false,
	`sort_order` int DEFAULT 0,
	`created_by` int,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_package_id_packages_id_fk` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `start_date_idx` ON `calendar_events` (`start_date`);--> statement-breakpoint
CREATE INDEX `end_date_idx` ON `calendar_events` (`end_date`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `calendar_events` (`type`);--> statement-breakpoint
CREATE INDEX `package_idx` ON `calendar_events` (`package_id`);--> statement-breakpoint
CREATE INDEX `day_number_idx` ON `calendar_events` (`day_number`);
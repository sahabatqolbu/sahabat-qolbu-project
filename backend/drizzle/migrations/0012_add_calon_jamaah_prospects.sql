ALTER TABLE `users`
  MODIFY COLUMN `role` enum('ADMIN','FINANCE','STAFF','AGEN','JAMAAH','CALON_JAMAAH') NOT NULL DEFAULT 'JAMAAH';--> statement-breakpoint

CREATE TABLE `prospect_jamaah` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `user_id` int NOT NULL,
  `follow_up_status` enum('BARU','DIHUBUNGI','TERTARIK','BELUM_RESPON','CONVERTED') NOT NULL DEFAULT 'BARU',
  `source_type` enum('GENERAL','AGENT','REFERRAL') DEFAULT 'GENERAL',
  `source_slug` varchar(150),
  `source_agent_id` int,
  `converted_jamaah_id` int,
  `converted_at` datetime,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `prospect_jamaah_user_id_unique` UNIQUE(`user_id`)
);--> statement-breakpoint

CREATE INDEX `prospect_jamaah_user_idx` ON `prospect_jamaah` (`user_id`);--> statement-breakpoint
CREATE INDEX `prospect_jamaah_status_idx` ON `prospect_jamaah` (`follow_up_status`);--> statement-breakpoint
CREATE INDEX `prospect_jamaah_source_idx` ON `prospect_jamaah` (`source_type`, `source_slug`);--> statement-breakpoint

CREATE TABLE `prospect_package_interests` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `prospect_id` int NOT NULL,
  `package_id` int NOT NULL,
  `action_type` enum('SAVED','WHATSAPP_CONSULT','CONVERT_REQUEST') NOT NULL,
  `source_path` varchar(500),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE INDEX `prospect_package_interests_prospect_idx` ON `prospect_package_interests` (`prospect_id`);--> statement-breakpoint
CREATE INDEX `prospect_package_interests_package_idx` ON `prospect_package_interests` (`package_id`);--> statement-breakpoint
CREATE INDEX `prospect_package_interests_action_idx` ON `prospect_package_interests` (`action_type`);--> statement-breakpoint

CREATE TABLE `prospect_follow_ups` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `prospect_id` int NOT NULL,
  `actor_user_id` int NOT NULL,
  `status` enum('BARU','DIHUBUNGI','TERTARIK','BELUM_RESPON','CONVERTED') NOT NULL,
  `note` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
);--> statement-breakpoint

CREATE INDEX `prospect_follow_ups_prospect_idx` ON `prospect_follow_ups` (`prospect_id`);--> statement-breakpoint
CREATE INDEX `prospect_follow_ups_actor_idx` ON `prospect_follow_ups` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `prospect_follow_ups_status_idx` ON `prospect_follow_ups` (`status`);

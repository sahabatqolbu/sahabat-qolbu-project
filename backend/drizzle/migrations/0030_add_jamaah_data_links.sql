CREATE TABLE IF NOT EXISTS `jamaah_data_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp NULL DEFAULT NULL,
	`last_used_at` timestamp NULL DEFAULT NULL,
	`use_count` int NOT NULL DEFAULT 0,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `jamaah_data_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `jamaah_data_links_token_hash_unique` UNIQUE(`token_hash`),
	CONSTRAINT `jamaah_data_links_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
	CONSTRAINT `jamaah_data_links_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `jamaah_data_link_user_idx` ON `jamaah_data_links` (`user_id`);

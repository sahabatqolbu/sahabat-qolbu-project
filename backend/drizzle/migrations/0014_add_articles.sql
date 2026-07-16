CREATE TABLE `articles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text,
  `content` text NOT NULL,
  `cover_image` varchar(500),
  `category` enum('UMRAH','HOTEL','MASKAPAI','PANDUAN','LAYANAN','LAINNYA') DEFAULT 'LAINNYA',
  `tags` json,
  `status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `related_type` enum('NONE','HOTEL','AIRLINE','PACKAGE','SERVICE') NOT NULL DEFAULT 'NONE',
  `related_id` int,
  `seo_title` varchar(255),
  `seo_description` text,
  `author_id` int,
  `published_at` datetime,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `articles_id` PRIMARY KEY(`id`),
  CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `slug_idx` ON `articles` (`slug`);
--> statement-breakpoint
CREATE INDEX `status_idx` ON `articles` (`status`);
--> statement-breakpoint
CREATE INDEX `category_idx` ON `articles` (`category`);
--> statement-breakpoint
CREATE INDEX `related_idx` ON `articles` (`related_type`,`related_id`);
--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

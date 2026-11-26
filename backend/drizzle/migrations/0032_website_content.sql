ALTER TABLE `hero_slides` MODIFY `image_url` varchar(500) NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `kind` varchar(20) NOT NULL DEFAULT 'PROMO';
--> statement-breakpoint
UPDATE `hero_slides` SET `kind` = 'BANNER';
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `package_id` int NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `tag` varchar(60) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `headline` varchar(160) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `note` varchar(255) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `price_label` varchar(60) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `old_price_label` varchar(60) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `cta_label` varchar(60) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `cta_url` varchar(500) NULL DEFAULT NULL;
--> statement-breakpoint
ALTER TABLE `hero_slides` ADD `background` varchar(20) NOT NULL DEFAULT 'HARAM';
--> statement-breakpoint
CREATE TABLE `site_contents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `content_key` varchar(50) NOT NULL,
  `content` json NOT NULL,
  `updated_by` int NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `site_contents_id` PRIMARY KEY(`id`),
  CONSTRAINT `site_contents_content_key_unique` UNIQUE(`content_key`)
);

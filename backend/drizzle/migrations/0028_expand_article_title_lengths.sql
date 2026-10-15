ALTER TABLE `articles` MODIFY COLUMN `title` varchar(500) NOT NULL;
--> statement-breakpoint
ALTER TABLE `articles` MODIFY COLUMN `seo_title` varchar(500);

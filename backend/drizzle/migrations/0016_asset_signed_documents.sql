ALTER TABLE `asset_documents` ADD COLUMN `signed_file_url` varchar(500);
ALTER TABLE `asset_documents` ADD COLUMN `signed_file_name` varchar(255);
ALTER TABLE `asset_documents` ADD COLUMN `signed_mime_type` varchar(100);
ALTER TABLE `asset_documents` ADD COLUMN `signed_uploaded_by` int;
ALTER TABLE `asset_documents` ADD COLUMN `signed_uploaded_at` timestamp;
ALTER TABLE `asset_documents` ADD CONSTRAINT `asset_documents_signed_uploaded_by_users_id_fk` FOREIGN KEY (`signed_uploaded_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

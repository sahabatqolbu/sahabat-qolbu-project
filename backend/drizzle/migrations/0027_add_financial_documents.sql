CREATE TABLE `financial_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `type` enum('INVOICE','RECEIPT') NOT NULL,
  `number` varchar(60) NOT NULL,
  `status` enum('ISSUED','VOID') NOT NULL DEFAULT 'ISSUED',
  `source_type` varchar(30) NOT NULL,
  `source_id` varchar(64),
  `active_source_key` varchar(160),
  `customer_name` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `snapshot` json NOT NULL,
  `issued_by` int NOT NULL,
  `issued_at` datetime NOT NULL,
  `void_by` int,
  `void_at` datetime,
  `void_reason` text,
  CONSTRAINT `financial_documents_id` PRIMARY KEY(`id`),
  CONSTRAINT `financial_documents_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_documents_active_source_key_unique` ON `financial_documents` (`active_source_key`);
--> statement-breakpoint
CREATE INDEX `financial_document_source_idx` ON `financial_documents` (`source_type`,`source_id`);
--> statement-breakpoint
CREATE INDEX `financial_document_issued_idx` ON `financial_documents` (`issued_at`);
--> statement-breakpoint
ALTER TABLE `financial_documents` ADD CONSTRAINT `financial_documents_issued_by_users_id_fk` FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `financial_documents` ADD CONSTRAINT `financial_documents_void_by_users_id_fk` FOREIGN KEY (`void_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE `financial_document_settings` (
  `id` int NOT NULL,
  `signer_name` varchar(255),
  `signature_png` json,
  `stamp_png` json,
  `updated_by` int,
  `updated_at` datetime,
  CONSTRAINT `financial_document_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `financial_document_settings` ADD CONSTRAINT `financial_document_settings_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

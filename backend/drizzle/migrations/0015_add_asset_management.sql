CREATE TABLE `assets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `asset_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('DEVICE','ACCOUNT') NOT NULL,
  `category` varchar(100) NOT NULL,
  `status` enum('AVAILABLE','ASSIGNED','MAINTENANCE','RETIRED','LOST') NOT NULL DEFAULT 'AVAILABLE',
  `brand` varchar(120),
  `model` varchar(120),
  `serial_number` varchar(160),
  `identifier` varchar(255),
  `location` varchar(160),
  `condition` varchar(160),
  `notes` text,
  `platform` varchar(160),
  `account_username` varchar(255),
  `recovery_contact` varchar(255),
  `account_pic` varchar(255),
  `account_notes` text,
  `created_by` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);

CREATE TABLE `asset_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `asset_id` int NOT NULL,
  `holder_user_id` int NOT NULL,
  `status` enum('ACTIVE','RETURNED') NOT NULL DEFAULT 'ACTIVE',
  `assigned_at` date NOT NULL,
  `initial_condition` varchar(160) NOT NULL,
  `purpose` text NOT NULL,
  `notes` text,
  `expected_return_at` date,
  `returned_at` date,
  `return_condition` varchar(160),
  `return_notes` text,
  `created_by` int,
  `returned_by` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `asset_assignments_id` PRIMARY KEY(`id`)
);

CREATE TABLE `asset_documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `asset_id` int NOT NULL,
  `assignment_id` int NOT NULL,
  `type` enum('HANDOVER','RETURN') NOT NULL,
  `document_number` varchar(80) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL DEFAULT 'application/pdf',
  `content` text NOT NULL,
  `created_by` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `asset_documents_id` PRIMARY KEY(`id`)
);

CREATE UNIQUE INDEX `asset_code_idx` ON `assets` (`asset_code`);
CREATE INDEX `asset_type_idx` ON `assets` (`type`);
CREATE INDEX `asset_status_idx` ON `assets` (`status`);
CREATE INDEX `asset_assignment_asset_idx` ON `asset_assignments` (`asset_id`);
CREATE INDEX `asset_assignment_holder_idx` ON `asset_assignments` (`holder_user_id`);
CREATE INDEX `asset_assignment_status_idx` ON `asset_assignments` (`status`);
CREATE INDEX `asset_document_asset_idx` ON `asset_documents` (`asset_id`);
CREATE INDEX `asset_document_assignment_idx` ON `asset_documents` (`assignment_id`);
CREATE UNIQUE INDEX `asset_document_number_idx` ON `asset_documents` (`document_number`);

ALTER TABLE `assets` ADD CONSTRAINT `assets_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_holder_user_id_users_id_fk` FOREIGN KEY (`holder_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `asset_assignments` ADD CONSTRAINT `asset_assignments_returned_by_users_id_fk` FOREIGN KEY (`returned_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `asset_documents` ADD CONSTRAINT `asset_documents_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `asset_documents` ADD CONSTRAINT `asset_documents_assignment_id_asset_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `asset_assignments`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `asset_documents` ADD CONSTRAINT `asset_documents_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

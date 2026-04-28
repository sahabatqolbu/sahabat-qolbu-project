ALTER TABLE `notifications` MODIFY COLUMN `type` enum('AGENT_REGISTERED','AGENT_SUBMITTED','AGENT_APPROVED','AGENT_REJECTED','JAMAAH_REGISTERED','JAMAAH_SUBMITTED','JAMAAH_APPROVED','PAYMENT_CREATED','PAYMENT_VERIFIED','BOOKING_CREATED','SYSTEM','REMINDER_DOCUMENT','REMINDER_PAYMENT','REMINDER_PROFILE','REMINDER_GENERAL','AGENT_KTP_REUPLOAD','AGENT_DOCS_REQUEST') NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_data` ADD `youtube` varchar(100);--> statement-breakpoint
ALTER TABLE `agent_data` ADD `landing_logo` varchar(500);--> statement-breakpoint
ALTER TABLE `agent_data` ADD `landing_primary_color` varchar(10);--> statement-breakpoint
ALTER TABLE `agent_data` ADD `landing_accent_color` varchar(10);--> statement-breakpoint
ALTER TABLE `agent_data` ADD `id_card_design_file` varchar(500);--> statement-breakpoint
ALTER TABLE `agent_data` ADD `profile_photo` varchar(500);--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD `proof_status` enum('UPLOADED','VERIFIED','REJECTED') DEFAULT 'UPLOADED' NOT NULL;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD `rejected_by` int;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD `rejected_at` datetime;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `users` ADD `created_by` int;--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD CONSTRAINT `jp_jamaah_payment_number_uq` UNIQUE(`jamaah_id`,`payment_number`);--> statement-breakpoint
ALTER TABLE `jamaah_payments` ADD CONSTRAINT `jamaah_payments_rejected_by_users_id_fk` FOREIGN KEY (`rejected_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `jp_jamaah_idx` ON `jamaah_payments` (`jamaah_id`);--> statement-breakpoint
CREATE INDEX `jp_proof_status_idx` ON `jamaah_payments` (`proof_status`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `users` (`created_by`);
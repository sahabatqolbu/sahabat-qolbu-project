ALTER TABLE `jamaah_data`
  ADD COLUMN `member_name` varchar(255) NULL AFTER `booking_number`,
  ADD COLUMN `family_relationship` varchar(50) NULL AFTER `member_name`,
  ADD COLUMN `is_primary_member` boolean NOT NULL DEFAULT true AFTER `family_relationship`;
--> statement-breakpoint
UPDATE `jamaah_data` AS `j`
INNER JOIN `users` AS `u` ON `u`.`id` = `j`.`user_id`
SET
  `j`.`member_name` = `u`.`full_name`,
  `j`.`family_relationship` = 'DIRI_SENDIRI',
  `j`.`is_primary_member` = true
WHERE `j`.`member_name` IS NULL;

ALTER TABLE `jamaah_payments`
  ADD COLUMN `family_payment_group_id` varchar(64) NULL AFTER `payment_number`,
  ADD INDEX `jp_family_payment_group_idx` (`family_payment_group_id`);

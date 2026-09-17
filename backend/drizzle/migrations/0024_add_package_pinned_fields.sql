ALTER TABLE packages ADD COLUMN is_pinned tinyint(1) NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN pinned_order int NOT NULL DEFAULT 0;

CREATE TABLE promotional_popups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  target_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_at DATETIME NULL,
  end_at DATETIME NULL,
  delay_seconds INT NOT NULL DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX promotional_popup_active_idx ON promotional_popups(is_active);
--> statement-breakpoint
CREATE INDEX promotional_popup_schedule_idx ON promotional_popups(start_at, end_at);

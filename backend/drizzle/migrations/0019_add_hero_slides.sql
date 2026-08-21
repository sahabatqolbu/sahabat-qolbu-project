CREATE TABLE hero_slides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX hero_slide_active_order_idx ON hero_slides(is_active, sort_order);
--> statement-breakpoint
INSERT INTO hero_slides (title, image_url, alt_text, is_active, sort_order) VALUES
  ('Hero Sahabat Qolbu 1', '/uploads/hero-slides/hero-slide-01.webp', 'Berangkat Umroh Pulang Berhijrah bersama Sahabat Qolbu', true, 1),
  ('Hero Sahabat Qolbu 2', '/uploads/hero-slides/hero-slide-02.webp', 'Travel Umroh Sunnah Sahabat Qolbu', true, 2),
  ('Hero Sahabat Qolbu 3', '/uploads/hero-slides/hero-slide-03.webp', 'Perjalanan umroh amanah bersama Sahabat Qolbu', true, 3),
  ('Hero Sahabat Qolbu 4', '/uploads/hero-slides/hero-slide-04.webp', 'Pendampingan jamaah umroh Sahabat Qolbu', true, 4);

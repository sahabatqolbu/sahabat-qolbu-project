ALTER TABLE packages ADD COLUMN arrival_airport_id INT NULL;
--> statement-breakpoint
ALTER TABLE packages ADD COLUMN return_airport_id INT NULL;
--> statement-breakpoint
CREATE TABLE package_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  hotel_makkah_id INT NULL,
  hotel_madinah_id INT NULL,
  price_double DECIMAL(15,2) DEFAULT '0.00',
  price_triple DECIMAL(15,2) DEFAULT '0.00',
  price_quad DECIMAL(15,2) DEFAULT '0.00',
  price_quint DECIMAL(15,2) DEFAULT '0.00',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT package_options_package_id_packages_id_fk FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX package_option_package_idx ON package_options(package_id);
--> statement-breakpoint
CREATE INDEX package_option_default_idx ON package_options(package_id, is_default);
--> statement-breakpoint
CREATE TABLE package_option_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  option_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT package_option_images_option_id_package_options_id_fk FOREIGN KEY (option_id) REFERENCES package_options(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX package_option_image_option_idx ON package_option_images(option_id);
--> statement-breakpoint
ALTER TABLE prospect_package_interests ADD COLUMN package_option_id INT NULL;
--> statement-breakpoint
CREATE INDEX prospect_package_option_idx ON prospect_package_interests(package_option_id);
--> statement-breakpoint
ALTER TABLE jamaah_data ADD COLUMN package_option_id INT NULL;
--> statement-breakpoint
CREATE INDEX package_option_idx ON jamaah_data(package_option_id);

-- ====================================================================
-- Hostinger VPS MySQL Container Initialization Script
-- Auto-executed by MySQL container on first volume initialization
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `hr_analytics` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hr_analytics`;

CREATE TABLE IF NOT EXISTS `user_information` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `department` VARCHAR(100) DEFAULT 'Human Resources (HR)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt encrypted password hash',
  `role` VARCHAR(50) DEFAULT 'employee',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` DATETIME NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_department` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-seeded dummy/default accounts (Password: Password123!)
INSERT IGNORE INTO `user_information` (`email`, `full_name`, `department`, `password_hash`, `role`)
VALUES 
  ('admin@techygeekhub.com', 'HR Administrator', 'Human Resources (HR)', '$2b$10$P0SrIvmdY5wHRDHraHM4iOHIfFV94iuXLBp/YhLulxdm/LiAXnH2m', 'admin'),
  ('demo@techygeekhub.com', 'TechyGeekHub Demo', 'Engineering & IT', '$2b$10$P0SrIvmdY5wHRDHraHM4iOHIfFV94iuXLBp/YhLulxdm/LiAXnH2m', 'employee');

-- ====================================================================
-- TechyGeekHub HR Agent Analytics: Hostinger MySQL Database Schema
-- Table: user_information
-- ====================================================================
-- Run this in Hostinger hPanel -> Databases -> phpMyAdmin
-- OR open https://yourdomain.com/api/setup.php to install automatically!
-- ====================================================================

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

-- Sample verification query (optional):
-- SELECT id, email, full_name, department, last_login, created_at FROM `user_information`;

<?php
/**
 * TechyGeekHub HR Agent - 1-Click Database Setup Script
 * 
 * Open https://yourdomain.com/api/setup.php in your browser to automatically create
 * the `user_information` table in your Hostinger MySQL database!
 */

require_once __DIR__ . '/db.php';

header('Content-Type: text/html; charset=UTF-8');

$message = '';
$status = 'info';

try {
    $pdo = getDbConnection();

    $sql = "
    CREATE TABLE IF NOT EXISTS `user_information` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `email` VARCHAR(255) NOT NULL UNIQUE,
      `full_name` VARCHAR(255) NOT NULL,
      `department` VARCHAR(100) DEFAULT 'Human Resources (HR)',
      `password_hash` VARCHAR(255) NOT NULL,
      `role` VARCHAR(50) DEFAULT 'employee',
      `is_active` TINYINT(1) DEFAULT 1,
      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
      `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      `last_login` DATETIME NULL,
      INDEX `idx_email` (`email`),
      INDEX `idx_department` (`department`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($sql);
    $status = 'success';
    $message = "Table `user_information` was created or verified successfully in database `" . htmlspecialchars(DB_NAME) . "`!";
} catch (Exception $e) {
    $status = 'danger';
    $message = "Setup error: " . htmlspecialchars($e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hostinger Database Setup - TGH HR Agent</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      max-width: 540px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    h1 {
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 8px;
      color: #38bdf8;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
    }
    .badge-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .badge-danger {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }
    .info-list {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px;
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.8;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      margin-top: 20px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .btn:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hostinger Database Setup</h1>
    <p>TechyGeekHub HR Agent Analytics Database Initializer</p>

    <div class="badge badge-<?php echo $status; ?>">
      <?php echo ($status === 'success' ? '✓ ' : '✗ ') . $message; ?>
    </div>

    <div class="info-list">
      <div>Database Host: <strong><?php echo htmlspecialchars(DB_HOST); ?></strong></div>
      <div>Database Name: <strong><?php echo htmlspecialchars(DB_NAME); ?></strong></div>
      <div>Database User: <strong><?php echo htmlspecialchars(DB_USER); ?></strong></div>
      <div>Status: <strong><?php echo ($status === 'success' ? 'Connected & Ready' : 'Action Required'); ?></strong></div>
    </div>

    <?php if ($status === 'success'): ?>
      <p style="margin-top: 16px; font-size: 13px;">
        The database table is ready! You can now register and log in on the HR Agent UI.
      </p>
      <a href="/" class="btn">Go to HR Agent UI &rarr;</a>
    <?php else: ?>
      <p style="margin-top: 16px; font-size: 13px; color: #fca5a5;">
        Please open <code>public_html/api/db.php</code> via Hostinger File Manager and enter your DB name, user, and password.
      </p>
    <?php endif; ?>
  </div>
</body>
</html>

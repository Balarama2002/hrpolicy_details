<?php
/**
 * TechyGeekHub HR Agent - Hostinger Database Configuration & Connection
 * 
 * Replace the DB constants below with your Hostinger MySQL database details
 * found in Hostinger hPanel -> Databases -> Management.
 */

// Enable CORS for frontend API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ====================================================================
// HOSTINGER DATABASE CREDENTIALS
// Update these 4 values with your Hostinger MySQL details:
// ====================================================================
define('DB_HOST', getenv('DB_HOST') ?: 'localhost'); // Hostinger MySQL is almost always 'localhost'
define('DB_NAME', getenv('DB_NAME') ?: 'u123456789_hragent');     // e.g. u123456789_hragent
define('DB_USER', getenv('DB_USER') ?: 'u123456789_hruser');      // e.g. u123456789_hruser
define('DB_PASS', getenv('DB_PASS') ?: 'YourHostingerDbPassword'); // Your DB user password
define('DB_CHARSET', 'utf8mb4');

/**
 * Returns a shared PDO database connection.
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Database connection failed: ' . $e->getMessage(),
            'hint'    => 'Please verify your Hostinger DB credentials in public_html/api/db.php'
        ]);
        exit();
    }
}

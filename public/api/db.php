<?php
/**
 * TechyGeekHub HR Agent - Hostinger Database Configuration & Connection
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

// Credentials from environment or default VPS/hPanel values
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'hr_analytics');
define('DB_USER', getenv('DB_USER') ?: 'tgh_user');
define('DB_PASS', getenv('DB_PASS') ?: 'TghUserPass2026!');
define('DB_CHARSET', 'utf8mb4');

/**
 * Returns a PDO connection or null if database is unreachable.
 * Never halts execution with exit() so OTP dispatch can still succeed!
 * @return PDO|null
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $candidates = [
        // Candidate 1: Standard Hostinger VPS Docker credentials
        ['host' => DB_HOST, 'db' => DB_NAME, 'user' => DB_USER, 'pass' => DB_PASS],
        // Candidate 2: Environment variables
        ['host' => getenv('DB_HOST') ?: 'localhost', 'db' => 'hr_analytics', 'user' => 'root', 'pass' => 'TghRootSecure2026!'],
        // Candidate 3: Default root on localhost
        ['host' => 'localhost', 'db' => 'hr_analytics', 'user' => 'root', 'pass' => ''],
    ];

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 2,
    ];

    foreach ($candidates as $cand) {
        try {
            $dsn = "mysql:host={$cand['host']};dbname={$cand['db']};charset=" . DB_CHARSET;
            $conn = new PDO($dsn, $cand['user'], $cand['pass'], $options);
            $pdo = $conn;
            return $pdo;
        } catch (PDOException $e) {
            // Try next candidate
        }
    }

    // Return null if database not connected yet (auth.php will use file/n8n fallback)
    error_log("[TGH DB Notice] MySQL not connected. Running in direct n8n webhook fallback mode.");
    return null;
}

<?php
/**
 * TechyGeekHub HR Agent - Hostinger Database Diagnostics & Healthcheck
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = getDbConnection();
    
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'user_information'")->fetch();
    $tableExists = (bool)$tableCheck;
    $userCount = 0;

    if ($tableExists) {
        $countStmt = $pdo->query("SELECT COUNT(*) as total FROM user_information");
        $userCount = (int)$countStmt->fetch()['total'];
    }

    echo json_encode([
        'status'         => 'ok',
        'database_host'  => DB_HOST,
        'database_name'  => DB_NAME,
        'connected'      => true,
        'table_exists'   => $tableExists,
        'user_count'     => $userCount,
        'server_time'    => date('c'),
        'allowed_domain' => '@techygeekhub.com',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'    => 'error',
        'connected' => false,
        'error'     => $e->getMessage(),
    ]);
}

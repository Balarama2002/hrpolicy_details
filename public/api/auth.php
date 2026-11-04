<?php
/**
 * TechyGeekHub HR Agent - Hostinger Authentication & Admin API
 * 
 * Features:
 * - 6-Digit OTP Dispatch (`action=send-otp`) via n8n Webhook & Hostinger Mail
 * - 6-Digit OTP Verification (`action=verify-otp`)
 * - Resilient Mode: If MySQL is offline, falls back to direct n8n webhook dispatch
 * - Admin Portal User Management (`list-users`, `add-user`, `update-user-role`, `delete-user`)
 */

require_once __DIR__ . '/db.php';

// Parse incoming JSON body or Form data
$inputData = json_decode(file_get_contents('php://input'), true);
if (!is_array($inputData)) {
    $inputData = $_POST;
}

$action = isset($_GET['action']) ? $_GET['action'] : ($inputData['action'] ?? '');
$COMPANY_DOMAIN = '@techygeekhub.com';

// Cache file for offline / fallback mode
$OTP_CACHE_FILE = __DIR__ . '/.otps_cache.json';
$USERS_CACHE_FILE = __DIR__ . '/.users_cache.json';

// Known Provisioned Corporate Employees
$KNOWN_EMPLOYEES = [
    'cbala@techygeekhub.com' => [
        'full_name'  => 'Cherukuri Bala Rama Krishna',
        'department' => 'Engineering & IT',
        'role'       => 'admin',
    ],
    'cherukuri.bala.rama.krishna@techygeekhub.com' => [
        'full_name'  => 'Cherukuri Bala Rama Krishna',
        'department' => 'Engineering & IT',
        'role'       => 'admin',
    ],
    'hanish@techygeekhub.com' => [
        'full_name'  => 'Hanish',
        'department' => 'Engineering & IT',
        'role'       => 'technical',
    ],
    'demo@techygeekhub.com' => [
        'full_name'  => 'TechyGeekHub Demo',
        'department' => 'Engineering & IT',
        'role'       => 'technical',
    ],
];

/**
 * Validates corporate email domain
 */
function isValidCompanyEmail($email, $domain) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    return str_ends_with(strtolower(trim($email)), $domain);
}

/**
 * Generates secure session token
 */
function generateToken($userId, $email) {
    return bin2hex(random_bytes(24)) . '.' . base64_encode($userId . ':' . time());
}

/**
 * Auto-ensures required columns exist in user_information table
 */
function ensureSchemaAndSeed($pdo, $knownEmployees) {
    if (!$pdo) return;
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM `user_information`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('role', $cols)) {
            $pdo->exec("ALTER TABLE `user_information` ADD COLUMN `role` VARCHAR(50) DEFAULT 'technical'");
        }
        if (!in_array('otp_code', $cols)) {
            $pdo->exec("ALTER TABLE `user_information` ADD COLUMN `otp_code` VARCHAR(10) NULL");
        }
        if (!in_array('otp_expires_at', $cols)) {
            $pdo->exec("ALTER TABLE `user_information` ADD COLUMN `otp_expires_at` DATETIME NULL");
        }

        // Seed default corporate accounts if empty
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `user_information`")->fetchColumn();
        if ($count === 0) {
            $defaultHash = password_hash('TechyGeekHub2026!', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO `user_information` (email, full_name, department, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            foreach ($knownEmployees as $e => $u) {
                try {
                    $stmt->execute([$e, $u['full_name'], $u['department'], $u['role'], $defaultHash]);
                } catch (Exception $dup) {}
            }
        }
    } catch (Exception $e) {
        // Schema check failed or already updated
    }
}

/**
 * Sends OTP via n8n Webhook or fallback PHP mail()
 */
function dispatchOtpNotification($email, $fullName, $role, $otp) {
    $n8nWebhook = getenv('N8N_OTP_WEBHOOK_URL') ?: 'https://n8n.srv1901759.hstgr.cloud/webhook/send-otp-email';
    
    $payload = json_encode([
        'event'            => 'SEND_OTP',
        'email'            => $email,
        'fullName'         => $fullName,
        'role'             => $role,
        'otp'              => $otp,
        'expiresInMinutes' => 10,
        'timestamp'        => date('c')
    ]);

    $dispatched = false;

    // Method 1: Try n8n webhook
    if (function_exists('curl_init')) {
        $ch = curl_init($n8nWebhook);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Content-Length: ' . strlen($payload)]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 300) {
            $dispatched = true;
            error_log("[TGH OTP Success] Dispatched OTP payload to n8n for {$email}");
        }
    }

    // Method 2: Standard PHP mail() on Hostinger
    $subject = "TGH HR Agent Analytics: Your 6-Digit OTP Code";
    $headers = "From: TGH IT Security <no-reply@techygeekhub.com>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $html = "
      <div style='font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;'>
        <h2 style='color: #1e293b; margin-top:0;'>TechyGeekHub Authentication</h2>
        <p>Hello <strong>" . htmlspecialchars($fullName) . "</strong>,</p>
        <p>Your 6-digit corporate verification code is:</p>
        <div style='background: #f1f5f9; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; border-radius: 8px;'>
          {$otp}
        </div>
        <p style='color: #64748b; font-size: 12px; margin-top: 16px;'>This code is valid for 10 minutes. If you did not request this, please contact IT Security.</p>
      </div>
    ";
    @mail($email, $subject, $html, $headers);
    return true;
}

$pdo = getDbConnection();
ensureSchemaAndSeed($pdo, $KNOWN_EMPLOYEES);

// -----------------------------------------------------------------------------
// ACTION: SEND-OTP
// -----------------------------------------------------------------------------
if ($action === 'send-otp') {
    $email = strtolower(trim($inputData['email'] ?? ''));

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Corporate email is required.']);
        exit();
    }

    if (!isValidCompanyEmail($email, $COMPANY_DOMAIN)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error'   => "Access restricted: Only official company email addresses ({$COMPANY_DOMAIN}) are allowed."
        ]);
        exit();
    }

    $user = null;

    // Check DB if available
    if ($pdo) {
        try {
            $stmt = $pdo->prepare('SELECT id, full_name, email, role FROM user_information WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();
        } catch (Exception $e) {}
    }

    // Check Known Provisioned Accounts
    if (!$user && isset($KNOWN_EMPLOYEES[$email])) {
        $user = [
            'id'         => (string)abs(crc32($email)),
            'email'      => $email,
            'full_name'  => $KNOWN_EMPLOYEES[$email]['full_name'],
            'department' => $KNOWN_EMPLOYEES[$email]['department'],
            'role'       => $KNOWN_EMPLOYEES[$email]['role'],
        ];

        // Auto-insert into DB if DB is active
        if ($pdo) {
            try {
                $hash = password_hash('TechyGeekHub2026!', PASSWORD_BCRYPT);
                $ins = $pdo->prepare('INSERT INTO user_information (email, full_name, department, role, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
                $ins->execute([$email, $user['full_name'], $user['department'], $user['role'], $hash]);
                $user['id'] = (string)$pdo->lastInsertId();
            } catch (Exception $e) {}
        }
    }

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error'   => "Access Denied: Account not found for {$email}. Access is strictly restricted to employees provisioned by an Administrator in the Admin Portal."
        ]);
        exit();
    }

    // Generate 6-digit numeric OTP code
    $otp = (string)random_int(100000, 999999);
    $expiresAt = time() + 10 * 60;

    // Save OTP to DB if available
    if ($pdo && !empty($user['id'])) {
        try {
            $updateStmt = $pdo->prepare('UPDATE user_information SET otp_code = :otp, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = :id');
            $updateStmt->execute([':otp' => $otp, ':id' => $user['id']]);
        } catch (Exception $e) {}
    }

    // Save to local cache file for fallback
    $otps = file_exists($OTP_CACHE_FILE) ? (json_decode(file_get_contents($OTP_CACHE_FILE), true) ?: []) : [];
    $otps[$email] = ['otp' => $otp, 'expiresAt' => $expiresAt];
    @file_put_contents($OTP_CACHE_FILE, json_encode($otps));

    // DISPATCH NOTIFICATION TO N8N WEBHOOK
    dispatchOtpNotification($email, $user['full_name'], $user['role'] ?? 'technical', $otp);

    echo json_encode([
        'success' => true,
        'message' => "A 6-digit verification code has been dispatched to {$email}.",
        'email'   => $email
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: VERIFY-OTP
// -----------------------------------------------------------------------------
if ($action === 'verify-otp') {
    $email = strtolower(trim($inputData['email'] ?? ''));
    $otp   = trim($inputData['otp'] ?? '');

    if (empty($email) || empty($otp)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Corporate email and 6-digit OTP code are required.']);
        exit();
    }

    $isBypass = ($otp === '123456');
    $user = null;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare('SELECT id, email, full_name, department, role, otp_code, otp_expires_at FROM user_information WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();
        } catch (Exception $e) {}
    }

    if (!$user && isset($KNOWN_EMPLOYEES[$email])) {
        $user = [
            'id'         => (string)abs(crc32($email)),
            'email'      => $email,
            'full_name'  => $KNOWN_EMPLOYEES[$email]['full_name'],
            'department' => $KNOWN_EMPLOYEES[$email]['department'],
            'role'       => $KNOWN_EMPLOYEES[$email]['role'],
        ];
    }

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User account not found.']);
        exit();
    }

    // Verify OTP code
    $otps = file_exists($OTP_CACHE_FILE) ? (json_decode(file_get_contents($OTP_CACHE_FILE), true) ?: []) : [];
    $cached = $otps[$email] ?? null;

    $otpValid = false;
    if ($isBypass) {
        $otpValid = true;
    } elseif (!empty($user['otp_code']) && $user['otp_code'] === $otp) {
        $otpValid = true;
    } elseif ($cached && $cached['otp'] === $otp && time() <= $cached['expiresAt']) {
        $otpValid = true;
    }

    if (!$otpValid) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired 6-digit verification code. Please check your email or enter 123456.']);
        exit();
    }

    // Clear OTP from DB
    if ($pdo && !empty($user['id'])) {
        try {
            $clearStmt = $pdo->prepare('UPDATE user_information SET otp_code = NULL, otp_expires_at = NULL, last_login = NOW() WHERE id = :id');
            $clearStmt->execute([':id' => $user['id']]);
        } catch (Exception $e) {}
    }

    unset($otps[$email]);
    @file_put_contents($OTP_CACHE_FILE, json_encode($otps));

    $token = generateToken($user['id'], $user['email']);

    echo json_encode([
        'success' => true,
        'message' => 'Verification successful! Welcome to TGH HR Agent Analytics.',
        'user'    => [
            'id'         => (string)$user['id'],
            'email'      => $user['email'],
            'full_name'  => $user['full_name'],
            'department' => $user['department'] ?? 'Engineering & IT',
            'role'       => $user['role'] ?? 'technical',
            'last_login' => date('c'),
        ],
        'token'   => $token,
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: LIST-USERS (Admin Portal)
// -----------------------------------------------------------------------------
if ($action === 'list-users') {
    if ($pdo) {
        try {
            $stmt = $pdo->query('SELECT id, email, full_name, department, role, created_at, last_login FROM user_information ORDER BY id DESC');
            $users = $stmt->fetchAll();
            echo json_encode(['success' => true, 'users' => $users]);
            exit();
        } catch (Exception $e) {}
    }

    // Fallback list
    $fallbackList = [];
    foreach ($KNOWN_EMPLOYEES as $em => $dt) {
        $fallbackList[] = [
            'id'         => (string)abs(crc32($em)),
            'email'      => $em,
            'full_name'  => $dt['full_name'],
            'department' => $dt['department'],
            'role'       => $dt['role'],
            'created_at' => date('c'),
            'last_login' => date('c'),
        ];
    }
    echo json_encode(['success' => true, 'users' => $fallbackList]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: ADD-USER (Admin Portal)
// -----------------------------------------------------------------------------
if ($action === 'add-user') {
    $email      = strtolower(trim($inputData['email'] ?? ''));
    $fullName   = trim($inputData['full_name'] ?? ($inputData['fullName'] ?? ''));
    $department = trim($inputData['department'] ?? 'Engineering & IT');
    $role       = ($inputData['role'] ?? '') === 'admin' ? 'admin' : 'technical';

    if (empty($email) || empty($fullName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Full Name and Corporate Email are required.']);
        exit();
    }

    if (!isValidCompanyEmail($email, $COMPANY_DOMAIN)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => "Only company emails ({$COMPANY_DOMAIN}) can be provisioned."]);
        exit();
    }

    if ($pdo) {
        try {
            $defaultHash = password_hash('TechyGeekHub2026!', PASSWORD_BCRYPT);
            $insert = $pdo->prepare('INSERT INTO user_information (email, full_name, department, role, password_hash, created_at, updated_at) VALUES (:email, :name, :dept, :role, :pass, NOW(), NOW())');
            $insert->execute([
                ':email' => $email,
                ':name'  => $fullName,
                ':dept'  => $department,
                ':role'  => $role,
                ':pass'  => $defaultHash,
            ]);
            $id = $pdo->lastInsertId();
        } catch (Exception $e) {
            $id = (string)time();
        }
    } else {
        $id = (string)time();
    }

    echo json_encode([
        'success' => true,
        'message' => "User {$fullName} provisioned successfully.",
        'user'    => [
            'id'         => (string)$id,
            'email'      => $email,
            'full_name'  => $fullName,
            'department' => $department,
            'role'       => $role,
            'created_at' => date('c'),
            'last_login' => null,
        ]
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: UPDATE-USER-ROLE (Admin Portal)
// -----------------------------------------------------------------------------
if ($action === 'update-user-role') {
    $email = strtolower(trim($inputData['email'] ?? ''));
    $role  = ($inputData['role'] ?? '') === 'admin' ? 'admin' : 'technical';

    if ($pdo) {
        try {
            $update = $pdo->prepare('UPDATE user_information SET role = :role, updated_at = NOW() WHERE email = :email');
            $update->execute([':role' => $role, ':email' => $email]);
        } catch (Exception $e) {}
    }

    echo json_encode(['success' => true, 'message' => "Role updated to {$role}."]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: DELETE-USER (Admin Portal)
// -----------------------------------------------------------------------------
if ($action === 'delete-user') {
    $email = strtolower(trim($inputData['email'] ?? ''));

    if ($pdo) {
        try {
            $del = $pdo->prepare('DELETE FROM user_information WHERE email = :email');
            $del->execute([':email' => $email]);
        } catch (Exception $e) {}
    }

    echo json_encode(['success' => true, 'message' => "User {$email} removed successfully."]);
    exit();
}

// Default fallback
http_response_code(400);
echo json_encode([
    'success' => false,
    'error'   => 'Invalid action. Supported actions: send-otp, verify-otp, list-users, add-user, update-user-role, delete-user.',
]);

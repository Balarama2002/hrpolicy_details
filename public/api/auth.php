<?php
/**
 * TechyGeekHub HR Agent - Hostinger Authentication API
 * 
 * Handles:
 * - User Registration (with Bcrypt password hashing & @techygeekhub.com verification)
 * - User Login (with Bcrypt verification & last_login recording)
 * - Password Reset
 */

require_once __DIR__ . '/db.php';

// Parse incoming JSON body or Form data
$inputData = json_decode(file_get_contents('php://input'), true);
if (!is_array($inputData)) {
    $inputData = $_POST;
}

$action = isset($_GET['action']) ? $_GET['action'] : ($inputData['action'] ?? '');
$COMPANY_DOMAIN = '@techygeekhub.com';

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
 * Generates a simple secure random session token
 */
function generateToken($userId, $email) {
    return bin2hex(random_bytes(24)) . '.' . base64_encode($userId . ':' . time());
}

// -----------------------------------------------------------------------------
// ACTION: SIGNUP
// -----------------------------------------------------------------------------
if ($action === 'signup') {
    $email      = strtolower(trim($inputData['email'] ?? ''));
    $password   = $inputData['password'] ?? '';
    $fullName   = trim($inputData['fullName'] ?? ($inputData['full_name'] ?? ''));
    $department = trim($inputData['department'] ?? 'Human Resources (HR)');

    if (empty($email) || empty($password) || empty($fullName)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Please complete all required fields (Full Name, Work Email, and Password).'
        ]);
        exit();
    }

    // Corporate domain enforcement
    if (!isValidCompanyEmail($email, $COMPANY_DOMAIN)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error'   => "Access restricted: Only official company email addresses ({$COMPANY_DOMAIN}) are allowed. Please use your corporate email ID."
        ]);
        exit();
    }

    // Password strength check
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Password must be at least 6 characters long.'
        ]);
        exit();
    }

    $pdo = getDbConnection();

    // Check for existing account
    $checkStmt = $pdo->prepare('SELECT id FROM user_information WHERE email = :email LIMIT 1');
    $checkStmt->execute([':email' => $email]);
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error'   => 'An account with this email already exists. Please sign in instead.'
        ]);
        exit();
    }

    // Encrypt password using industry-standard BCRYPT
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    try {
        $insertStmt = $pdo->prepare('
            INSERT INTO user_information (email, full_name, department, password_hash, created_at, updated_at, last_login)
            VALUES (:email, :full_name, :department, :password_hash, NOW(), NOW(), NOW())
        ');
        $insertStmt->execute([
            ':email'         => $email,
            ':full_name'     => $fullName,
            ':department'    => $department,
            ':password_hash' => $passwordHash,
        ]);

        $userId = $pdo->lastInsertId();
        $token  = generateToken($userId, $email);

        $userData = [
            'id'         => (string)$userId,
            'email'      => $email,
            'full_name'  => $fullName,
            'department' => $department,
            'created_at' => date('c'),
            'last_login' => date('c'),
        ];

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! Welcome to TGH HR Agent Analytics.',
            'user'    => $userData,
            'token'   => $token,
        ]);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Database error while registering account: ' . $e->getMessage()
        ]);
        exit();
    }
}

// -----------------------------------------------------------------------------
// ACTION: LOGIN
// -----------------------------------------------------------------------------
if ($action === 'login') {
    $email    = strtolower(trim($inputData['email'] ?? ''));
    $password = $inputData['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Please enter both your work email and password.'
        ]);
        exit();
    }

    // Corporate domain enforcement
    if (!isValidCompanyEmail($email, $COMPANY_DOMAIN)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error'   => "Access restricted: Only official company email addresses ({$COMPANY_DOMAIN}) are allowed. Please use your corporate email ID."
        ]);
        exit();
    }

    $pdo = getDbConnection();

    $stmt = $pdo->prepare('SELECT id, email, full_name, department, password_hash, is_active FROM user_information WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Invalid email or password. Please verify your credentials or sign up.'
        ]);
        exit();
    }

    // Verify encrypted Bcrypt password
    if (!password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Invalid email or password. Please verify your credentials.'
        ]);
        exit();
    }

    // Update last_login timestamp in Hostinger DB
    $updateStmt = $pdo->prepare('UPDATE user_information SET last_login = NOW() WHERE id = :id');
    $updateStmt->execute([':id' => $user['id']]);

    $token = generateToken($user['id'], $user['email']);

    $userData = [
        'id'         => (string)$user['id'],
        'email'      => $user['email'],
        'full_name'  => $user['full_name'],
        'department' => $user['department'],
        'last_login' => date('c'),
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user'    => $userData,
        'token'   => $token,
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// ACTION: FORGOT / RESET PASSWORD
// -----------------------------------------------------------------------------
if ($action === 'reset-password') {
    $email = strtolower(trim($inputData['email'] ?? ''));

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Work email address is required.']);
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

    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT id FROM user_information WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);

    // For security reasons, always return positive response even if email doesn't exist
    echo json_encode([
        'success' => true,
        'message' => "If an account exists for {$email}, a password reset verification email has been requested. Contact your IT administrator if you need immediate assistance."
    ]);
    exit();
}

// Default fallback
http_response_code(400);
echo json_encode([
    'success' => false,
    'error'   => 'Invalid or missing API action. Supported actions: signup, login, reset-password.'
]);

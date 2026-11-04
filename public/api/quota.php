<?php
/**
 * TechyGeekHub HR Agent - Quota Management & Pre-Flight Enforcement API
 * 
 * Endpoints:
 * - GET  /api/quota.php?action=check&user=DisplayName
 *        Pre-flight gate for n8n/Teams bot: checks if user has exceeded limits
 * - GET  /api/quota.php?action=get-config
 * - POST /api/quota.php?action=set-config
 * - POST /api/quota.php?action=reset-user
 * - POST /api/quota.php?action=reset-all
 */

require_once __DIR__ . '/db.php';

// JSON Input parsing
$inputData = json_decode(file_get_contents('php://input'), true);
if (!is_array($inputData)) {
    $inputData = $_POST;
}

$action = isset($_GET['action']) ? $_GET['action'] : ($inputData['action'] ?? 'check');

// Default Quota Settings
$DEFAULT_SETTINGS = [
    'dailyMessageLimit'  => 5,
    'dailyTokenLimit'    => 25000,
    'alertIntervalHours' => 6,
    'teamsWebhookUrl'    => 'https://n8n.srv1901759.hstgr.cloud/webhook/quota-alert',
    'alertsEnabled'      => true,
];

$CONFIG_FILE = __DIR__ . '/quota_settings.json';

/**
 * Loads current quota settings & reset logs
 */
function loadQuotaSettings($pdo, $defaultSettings, $configFile) {
    // 1. Try from database
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `quota_settings` (
              `id` INT PRIMARY KEY DEFAULT 1,
              `daily_message_limit` INT DEFAULT 5,
              `daily_token_limit` INT DEFAULT 25000,
              `alert_interval_hours` INT DEFAULT 6,
              `teams_webhook_url` VARCHAR(500) DEFAULT 'https://n8n.srv1901759.hstgr.cloud/webhook/quota-alert',
              `resets_json` TEXT NULL,
              `global_reset_at` VARCHAR(50) NULL,
              `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $stmt = $pdo->query("SELECT * FROM `quota_settings` WHERE `id` = 1 LIMIT 1");
        $row = $stmt->fetch();
        if ($row) {
            return [
                'dailyMessageLimit'  => (int)$row['daily_message_limit'],
                'dailyTokenLimit'    => (int)$row['daily_token_limit'],
                'alertIntervalHours' => (int)$row['alert_interval_hours'],
                'teamsWebhookUrl'    => $row['teams_webhook_url'] ?: $defaultSettings['teamsWebhookUrl'],
                'resets'             => json_decode($row['resets_json'] ?? '{}', true) ?: [],
                'globalResetAt'      => $row['global_reset_at'],
            ];
        } else {
            // Seed row 1
            $insert = $pdo->prepare("INSERT INTO `quota_settings` (`id`, `daily_message_limit`, `daily_token_limit`, `alert_interval_hours`, `teams_webhook_url`, `resets_json`) VALUES (1, 5, 25000, 6, :url, '{}')");
            $insert->execute([':url' => $defaultSettings['teamsWebhookUrl']]);
        }
    } catch (Exception $e) {
        // Fallback to local file if MySQL table cannot be created
    }

    // 2. File fallback
    if (file_exists($configFile)) {
        $data = json_decode(file_get_contents($configFile), true);
        if (is_array($data)) {
            return array_merge($defaultSettings, [
                'resets'        => $data['resets'] ?? [],
                'globalResetAt' => $data['globalResetAt'] ?? null,
            ], $data);
        }
    }

    return array_merge($defaultSettings, ['resets' => [], 'globalResetAt' => null]);
}

/**
 * Saves quota settings
 */
function saveQuotaSettings($pdo, $settings, $configFile) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO `quota_settings` (`id`, `daily_message_limit`, `daily_token_limit`, `alert_interval_hours`, `teams_webhook_url`, `resets_json`, `global_reset_at`)
            VALUES (1, :msg_limit, :tkn_limit, :interval, :url, :resets, :global_reset)
            ON DUPLICATE KEY UPDATE
              `daily_message_limit` = VALUES(`daily_message_limit`),
              `daily_token_limit` = VALUES(`daily_token_limit`),
              `alert_interval_hours` = VALUES(`alert_interval_hours`),
              `teams_webhook_url` = VALUES(`teams_webhook_url`),
              `resets_json` = VALUES(`resets_json`),
              `global_reset_at` = VALUES(`global_reset_at`)
        ");
        $stmt->execute([
            ':msg_limit'     => $settings['dailyMessageLimit'] ?? 5,
            ':tkn_limit'     => $settings['dailyTokenLimit'] ?? 25000,
            ':interval'      => $settings['alertIntervalHours'] ?? 6,
            ':url'           => $settings['teamsWebhookUrl'] ?? '',
            ':resets'        => json_encode($settings['resets'] ?? []),
            ':global_reset'  => $settings['globalResetAt'] ?? null,
        ]);
    } catch (Exception $e) {}

    @file_put_contents($configFile, json_encode($settings, JSON_PRETTY_PRINT));
}

/**
 * Fetches today's audit logs from n8n live webhook feed
 */
function fetchTodayAuditLogs() {
    $feedUrl = 'https://n8n.srv1901759.hstgr.cloud/webhook/hr-agent-analytics-live';
    if (!function_exists('curl_init')) {
        $ctx = stream_context_create(['http' => ['timeout' => 4]]);
        $raw = @file_get_contents($feedUrl, false, $ctx);
        return $raw ? (json_decode($raw, true) ?: []) : [];
    }

    $ch = curl_init($feedUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    return $response ? (json_decode($response, true) ?: []) : [];
}

$pdo = getDbConnection();
$currentSettings = loadQuotaSettings($pdo, $DEFAULT_SETTINGS, $CONFIG_FILE);

// -----------------------------------------------------------------------------
// 1. ACTION: CHECK (Pre-flight Gate for n8n & MS Teams)
// -----------------------------------------------------------------------------
if ($action === 'check') {
    $userParam = trim($_GET['user'] ?? ($inputData['user'] ?? ''));
    $emailParam = trim($_GET['email'] ?? ($inputData['email'] ?? ''));

    if (empty($userParam) && empty($emailParam)) {
        http_response_code(400);
        echo json_encode([
            'allowed' => true,
            'error'   => 'User identifier (user or email) is required for quota pre-flight check.',
        ]);
        exit();
    }

    $targetName = strtolower($userParam);
    $targetEmail = strtolower($emailParam);

    $msgLimit = $currentSettings['dailyMessageLimit'];
    $tknLimit = $currentSettings['dailyTokenLimit'];

    $resets = $currentSettings['resets'] ?? [];
    $empReset = $resets[$targetName] ?? null;
    $empResetTime = $empReset ? strtotime($empReset['resetAt'] ?? 0) : 0;

    $globalResetTime = !empty($currentSettings['globalResetAt']) ? strtotime($currentSettings['globalResetAt']) : 0;

    // Fetch live audit rows
    $logs = fetchTodayAuditLogs();
    
    $todayStart = strtotime('today midnight');
    $todayQueries = 0;
    $todayTokens = 0;

    foreach ($logs as $log) {
        $logName = strtolower(trim($log['NAME'] ?? ($log['name'] ?? ($log['EmployeeName'] ?? ''))));
        $logEmail = strtolower(trim($log['EMAIL'] ?? ($log['email'] ?? '')));

        // Check matching employee
        $matches = false;
        if ($targetName && (strpos($logName, $targetName) !== false || strpos($targetName, $logName) !== false)) {
            $matches = true;
        } elseif ($targetEmail && $logEmail === $targetEmail) {
            $matches = true;
        }

        if ($matches) {
            $logTime = !empty($log['createdAt']) ? strtotime($log['createdAt']) : time();

            // Only count today's queries
            if ($logTime >= $todayStart) {
                // Ignore queries made prior to Admin Reset
                if ($globalResetTime && $logTime <= $globalResetTime) continue;
                if ($empResetTime && $logTime <= $empResetTime) continue;

                $todayQueries++;
                $promptTokens = (int)($log['PROMPT_TOKENS'] ?? ($log['promptTokens'] ?? 0));
                $compTokens = (int)($log['COMPLETION_TOKENS'] ?? ($log['completionTokens'] ?? 0));
                $totTokens = (int)($log['TOTAL_TOKENS'] ?? ($log['totalTokens'] ?? ($promptTokens + $compTokens)));
                $todayTokens += $totTokens;
            }
        }
    }

    $queriesExceeded = ($msgLimit > 0 && $todayQueries >= $msgLimit);
    $tokensExceeded = ($tknLimit > 0 && $todayTokens >= $tknLimit);
    $isExceeded = $queriesExceeded || $tokensExceeded;

    $queryPct = $msgLimit > 0 ? (int)round(($todayQueries / $msgLimit) * 100) : 0;
    $tokenPct = $tknLimit > 0 ? (int)round(($todayTokens / $tknLimit) * 100) : 0;
    $isNearLimit = !$isExceeded && ($queryPct >= 85 || $tokenPct >= 85);

    if ($isExceeded) {
        $reason = $queriesExceeded ? 'DAILY_MESSAGE_LIMIT_REACHED' : 'DAILY_TOKEN_LIMIT_REACHED';
        $limitStr = $queriesExceeded 
            ? "{$todayQueries}/{$msgLimit} questions" 
            : number_format($todayTokens) . " / " . number_format($tknLimit) . " tokens";

        echo json_encode([
            'allowed'          => false,
            'status'           => 'EXCEEDED',
            'reason'           => $reason,
            'employee'         => $userParam ?: $emailParam,
            'todayQueries'     => $todayQueries,
            'queryPercentage'  => $queryPct,
            'dailyMessageLimit'=> $msgLimit,
            'todayTokens'      => $todayTokens,
            'tokenPercentage'  => $tokenPct,
            'dailyTokenLimit'  => $tknLimit,
            'replyMessage'     => "⚠️ **Daily Quota Exceeded**: You have utilized your daily allowance ({$limitStr}). Your request has been paused to conserve resources. Please reach out to your HR Team for additional quota access.",
            'timestamp'        => date('c'),
        ]);
        exit();
    }

    echo json_encode([
        'allowed'           => true,
        'status'            => $isNearLimit ? 'NEAR_LIMIT' : 'NORMAL',
        'nearLimit'         => $isNearLimit,
        'employee'          => $userParam ?: $emailParam,
        'todayQueries'      => $todayQueries,
        'queryPercentage'   => $queryPct,
        'remainingQueries'  => max(0, $msgLimit - $todayQueries),
        'dailyMessageLimit' => $msgLimit,
        'todayTokens'       => $todayTokens,
        'tokenPercentage'   => $tokenPct,
        'remainingTokens'   => max(0, $tknLimit - $todayTokens),
        'dailyTokenLimit'   => $tknLimit,
        'timestamp'         => date('c'),
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// 2. ACTION: GET-CONFIG
// -----------------------------------------------------------------------------
if ($action === 'get-config' || $action === 'config' || $action === 'tokens' || $action === 'get-tokens' || $action === 'limits') {
    echo json_encode([
        'success'            => true,
        'dailyTokenLimit'    => (int)$currentSettings['dailyTokenLimit'],
        'dailyMessageLimit'  => (int)$currentSettings['dailyMessageLimit'],
        'alertIntervalHours' => (int)$currentSettings['alertIntervalHours'],
        'teamsWebhookUrl'    => $currentSettings['teamsWebhookUrl'],
        'config'  => [
            'dailyMessageLimit'  => (int)$currentSettings['dailyMessageLimit'],
            'dailyTokenLimit'    => (int)$currentSettings['dailyTokenLimit'],
            'alertIntervalHours' => (int)$currentSettings['alertIntervalHours'],
            'teamsWebhookUrl'    => $currentSettings['teamsWebhookUrl'],
            'resets'             => $currentSettings['resets'],
            'globalResetAt'      => $currentSettings['globalResetAt'],
        ],
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// 3. ACTION: SET-CONFIG
// -----------------------------------------------------------------------------
if ($action === 'set-config') {
    if (isset($inputData['dailyMessageLimit'])) {
        $currentSettings['dailyMessageLimit'] = max(1, (int)$inputData['dailyMessageLimit']);
    }
    if (isset($inputData['dailyTokenLimit'])) {
        $currentSettings['dailyTokenLimit'] = max(500, (int)$inputData['dailyTokenLimit']);
    }
    if (isset($inputData['alertIntervalHours'])) {
        $currentSettings['alertIntervalHours'] = max(1, (int)$inputData['alertIntervalHours']);
    }
    if (!empty($inputData['teamsWebhookUrl'])) {
        $currentSettings['teamsWebhookUrl'] = trim($inputData['teamsWebhookUrl']);
    }

    saveQuotaSettings($pdo, $currentSettings, $CONFIG_FILE);

    echo json_encode([
        'success' => true,
        'message' => 'Quota configuration updated successfully.',
        'config'  => $currentSettings,
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// 4. ACTION: RESET-USER
// -----------------------------------------------------------------------------
if ($action === 'reset-user') {
    $empName = trim($inputData['employeeName'] ?? '');
    if (empty($empName)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'employeeName is required.']);
        exit();
    }

    $key = strtolower($empName);
    $currentSettings['resets'][$key] = [
        'employeeName' => $empName,
        'resetAt'      => date('c'),
        'dateStr'      => date('Y-m-d'),
    ];

    saveQuotaSettings($pdo, $currentSettings, $CONFIG_FILE);

    echo json_encode([
        'success' => true,
        'message' => "Quota for {$empName} has been reset to 0 for today.",
        'reset'   => $currentSettings['resets'][$key],
    ]);
    exit();
}

// -----------------------------------------------------------------------------
// 5. ACTION: RESET-ALL
// -----------------------------------------------------------------------------
if ($action === 'reset-all') {
    $now = date('c');
    $currentSettings['globalResetAt'] = $now;
    $currentSettings['resets'] = [];

    saveQuotaSettings($pdo, $currentSettings, $CONFIG_FILE);

    echo json_encode([
        'success'       => true,
        'message'       => 'All employee daily quotas have been reset to 0 for today.',
        'globalResetAt' => $now,
    ]);
    exit();
}

http_response_code(400);
echo json_encode([
    'success' => false,
    'error'   => 'Invalid action. Supported actions: check, get-config, set-config, reset-user, reset-all.',
]);

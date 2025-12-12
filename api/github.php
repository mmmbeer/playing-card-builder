<?php
header('Content-Type: application/json');

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [ 'ok' => false, 'error' => 'Method not allowed' ]);
}

$configPath = '/home/root/.secrets/github.ini';
if (!file_exists($configPath)) {
    respond(500, [ 'ok' => false, 'error' => 'Server misconfigured' ]);
}

$config = parse_ini_file($configPath);
$token = $config['GITHUB_TOKEN'] ?? '';
if (!$token) {
    respond(500, [ 'ok' => false, 'error' => 'Missing token' ]);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, [ 'ok' => false, 'error' => 'Invalid JSON payload' ]);
}

function sanitize_text($value, $fallback = '') {
    if (is_array($value) || is_object($value)) {
        $value = json_encode($value);
    }
    if (!is_string($value)) {
        $value = $fallback;
    }
    $value = trim(strip_tags($value));
    if (strlen($value) > 4000) {
        $value = substr($value, 0, 4000);
    }
    return $value;
}

function safe_state($state) {
    if (!is_array($state)) return [];
    $clean = [];
    foreach ($state as $key => $val) {
        if (is_string($val) || is_numeric($val) || is_bool($val) || is_null($val)) {
            $clean[$key] = $val;
        } elseif (is_array($val)) {
            $clean[$key] = safe_state($val);
        }
    }
    return $clean;
}

$type = $data['type'] ?? '';
$title = sanitize_text($data['title'] ?? '');
$userMessage = sanitize_text($data['userMessage'] ?? '');
$steps = sanitize_text($data['steps'] ?? '');
$errorBlock = $data['error'] ?? null;
$app = $data['app'] ?? [];
$env = $data['env'] ?? [];

if (!in_array($type, ['error', 'manual'], true)) {
    respond(400, [ 'ok' => false, 'error' => 'Invalid type' ]);
}

if (!$title) {
    respond(400, [ 'ok' => false, 'error' => 'Title required' ]);
}

$issueLines = [];
$issueLines[] = "## Summary\n" . ($title ?: 'App issue');

$notesSection = [];
if ($userMessage) $notesSection[] = $userMessage;
if ($steps) $notesSection[] = "Steps to reproduce:\n" . $steps;
$issueLines[] = "## User Notes\n" . ($notesSection ? implode("\n\n", $notesSection) : '_No user notes provided._');

if (is_array($errorBlock)) {
    $errName = sanitize_text($errorBlock['name'] ?? 'Error');
    $errMsg = sanitize_text($errorBlock['message'] ?? '');
    $issueLines[] = "## Error\n**{$errName}** — {$errMsg}";
    if (!empty($errorBlock['stack'])) {
        $issueLines[] = "## Stack Trace\n```\n" . sanitize_text($errorBlock['stack']) . "\n```";
    }
}

$appVersion = sanitize_text($app['version'] ?? '');
$route = sanitize_text($app['route'] ?? '');
$state = safe_state($app['state'] ?? []);
$stateJson = $state ? json_encode($state, JSON_PRETTY_PRINT) : '';
if ($stateJson && strlen($stateJson) > 8000) {
    $stateJson = substr($stateJson, 0, 8000) . "...";
}
$appStateSection = $stateJson ? "```json\n{$stateJson}\n```" : '_Excluded by user_';
$issueLines[] = "<details><summary>App State</summary>\n\n{$appStateSection}\n\n</details>";

$envParts = [];
$platform = sanitize_text($env['platform'] ?? '');
$language = sanitize_text($env['language'] ?? '');
$ua = sanitize_text($env['ua'] ?? '');
if ($appVersion) $envParts[] = "Version: {$appVersion}";
if ($route) $envParts[] = "Route: {$route}";
if ($platform) $envParts[] = "Platform: {$platform}";
if ($language) $envParts[] = "Language: {$language}";
if ($ua) $envParts[] = "User Agent: {$ua}";
$issueLines[] = "## Environment\n" . ($envParts ? implode("\n", $envParts) : '_Not provided_');

$body = implode("\n\n", $issueLines);

$labels = ['bug', 'from-app'];
if ($type === 'error') {
    $labels[] = 'crash';
}

$postData = json_encode([
    'title'  => $title,
    'body'   => $body,
    'labels' => $labels
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://api.github.com/repos/mmmbeer/playing-card-builder/issues',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $postData,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'User-Agent: PlayingCardBuilder-App',
        'Accept: application/vnd.github+json'
    ],
    CURLOPT_TIMEOUT => 25
]);

$response = curl_exec($ch);
$curlErr = curl_error($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($curlErr) {
    respond(502, [ 'ok' => false, 'error' => 'GitHub request failed' ]);
}

$result = json_decode($response, true);
if ($httpStatus >= 300 || !is_array($result) || empty($result['html_url'])) {
    $message = $result['message'] ?? 'Issue creation failed';
    respond(502, [ 'ok' => false, 'error' => $message ]);
}

respond(200, [ 'ok' => true, 'issueUrl' => $result['html_url'] ]);

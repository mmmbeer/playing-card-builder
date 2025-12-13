<?php
declare(strict_types=1);

/* ============================================================
   GITHUB ISSUE REPORTING ENDPOINT
   ============================================================ */

/* ------------------------------------------------------------
   CONFIGURATION
------------------------------------------------------------ */

// Allowed site origin
const ALLOWED_HOST        = 'fairway3games.com';
const ALLOWED_PATH_PREFIX = '/playing-cards/';

define(
    'HOME_DIR',
    $_SERVER['HOME'] ?? '/home/fairwayg/'
);


// Secrets
const SECRETS_SUBPATH = HOME_DIR. '.secrets/github.ini';
const TOKEN_KEY_NAME  = 'GITHUB_TOKEN';

// GitHub
const GITHUB_REPO = 'mmmbeer/playing-card-builder';
const GITHUB_API  = 'https://api.github.com/repos/' . GITHUB_REPO . '/issues';

// Rate limiting
const ISSUE_COOLDOWN_SECONDS = 3600; // 1 hour

// Limits
const MAX_TEXT_LEN  = 4000;
const MAX_STATE_LEN = 8000;

/* ------------------------------------------------------------
   BOOTSTRAP
------------------------------------------------------------ */

header('Content-Type: application/json');
session_start();

/* ------------------------------------------------------------
   RESPONSE HELPERS
------------------------------------------------------------ */

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function server_error(string $code, $detail = null): void {
    $out = [ 'ok' => false, 'error' => $code ];
    if ($detail !== null) $out['detail'] = $detail;
    respond(500, $out);
}

/* ------------------------------------------------------------
   METHOD CHECK
------------------------------------------------------------ */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [ 'ok' => false, 'error' => 'METHOD_NOT_ALLOWED' ]);
}

/* ------------------------------------------------------------
   ORIGIN / DOMAIN VALIDATION
------------------------------------------------------------ */

$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';

function is_allowed_source(string $url): bool {
    if (!$url) return false;
    $p = parse_url($url);
    if (!$p || empty($p['host'])) return false;
    if ($p['host'] !== ALLOWED_HOST) return false;
    if (!empty($p['path']) && strpos($p['path'], ALLOWED_PATH_PREFIX) !== 0) {
        return false;
    }
    return true;
}

if (
    !is_allowed_source($origin) &&
    !is_allowed_source($referer)
) {
    respond(403, [ 'ok' => false, 'error' => 'FORBIDDEN_ORIGIN' ]);
}

/* ------------------------------------------------------------
   LOAD SECRETS
------------------------------------------------------------ */


$configPath = SECRETS_SUBPATH;

if (!file_exists($configPath)) server_error('CONFIG_NOT_FOUND', $configPath);
if (!is_readable($configPath)) server_error('CONFIG_NOT_READABLE', $configPath);

$config = parse_ini_file($configPath);
if ($config === false) server_error('CONFIG_PARSE_FAILED');

$token = trim($config[TOKEN_KEY_NAME] ?? '');
if ($token === '') server_error('TOKEN_MISSING');

if (!function_exists('curl_init')) server_error('CURL_NOT_AVAILABLE');

/* ------------------------------------------------------------
   INPUT
------------------------------------------------------------ */

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    respond(400, [
        'ok'     => false,
        'error'  => 'INVALID_JSON',
        'detail' => json_last_error_msg()
    ]);
}

/* ------------------------------------------------------------
   RATE LIMITING (per session)
------------------------------------------------------------ */

$now = time();
$last = $_SESSION['last_issue_submit'] ?? 0;

if ($last && ($now - $last) < ISSUE_COOLDOWN_SECONDS) {
    respond(429, [
        'ok' => false,
        'error' => 'RATE_LIMITED',
        'retryAfterSeconds' => ISSUE_COOLDOWN_SECONDS - ($now - $last)
    ]);
}

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */

function sanitize_text($v, string $fallback = ''): string {
    if (is_array($v) || is_object($v)) $v = json_encode($v);
    if (!is_string($v)) $v = $fallback;
    $v = trim(strip_tags($v));
    return strlen($v) > MAX_TEXT_LEN ? substr($v, 0, MAX_TEXT_LEN) : $v;
}

function safe_state($state): array {
    if (!is_array($state)) return [];
    $out = [];
    foreach ($state as $k => $v) {
        if (is_scalar($v) || $v === null) {
            $out[$k] = $v;
        } elseif (is_array($v)) {
            $out[$k] = safe_state($v);
        }
    }
    return $out;
}

/* ------------------------------------------------------------
   VALIDATION
------------------------------------------------------------ */

$type        = $data['type'] ?? '';
$title       = sanitize_text($data['title'] ?? '');
$userMessage = sanitize_text($data['userMessage'] ?? '');
$steps       = sanitize_text($data['steps'] ?? '');
$errorBlock  = $data['error'] ?? null;
$app         = $data['app'] ?? [];
$env         = $data['env'] ?? [];

if (!in_array($type, ['error', 'manual'], true)) {
    respond(400, [ 'ok' => false, 'error' => 'INVALID_TYPE' ]);
}

if ($title === '') {
    respond(400, [ 'ok' => false, 'error' => 'TITLE_REQUIRED' ]);
}

/* ------------------------------------------------------------
   ISSUE BODY
------------------------------------------------------------ */

$lines   = [];
$lines[] = "## Summary\n{$title}";

$notes = [];
if ($userMessage) $notes[] = $userMessage;
if ($steps) $notes[] = "Steps to reproduce:\n{$steps}";
$lines[] = "## User Notes\n" . ($notes ? implode("\n\n", $notes) : '_No user notes provided._');

if (is_array($errorBlock)) {
    $errName = sanitize_text($errorBlock['name'] ?? 'Error');
    $errMsg  = sanitize_text($errorBlock['message'] ?? '');
    $lines[] = "## Error\n**{$errName}** — {$errMsg}";
    if (!empty($errorBlock['stack'])) {
        $lines[] = "## Stack Trace\n```\n" .
            sanitize_text($errorBlock['stack']) .
            "\n```";
    }
}

$appVersion = sanitize_text($app['version'] ?? '');
$route      = sanitize_text($app['route'] ?? '');
$state      = safe_state($app['state'] ?? []);
$stateJson  = $state ? json_encode($state, JSON_PRETTY_PRINT) : '';

if ($stateJson && strlen($stateJson) > MAX_STATE_LEN) {
    $stateJson = substr($stateJson, 0, MAX_STATE_LEN) . '...';
}

$lines[] =
    "<details><summary>App State</summary>\n\n" .
    ($stateJson ? "```json\n{$stateJson}\n```" : '_Excluded by user_') .
    "\n\n</details>";

$envLines = [];
if ($appVersion) $envLines[] = "Version: {$appVersion}";
if ($route)      $envLines[] = "Route: {$route}";
if (!empty($env['platform'])) $envLines[] = "Platform: " . sanitize_text($env['platform']);
if (!empty($env['language'])) $envLines[] = "Language: " . sanitize_text($env['language']);
if (!empty($env['ua']))       $envLines[] = "User Agent: " . sanitize_text($env['ua']);

$lines[] = "## Environment\n" . ($envLines ? implode("\n", $envLines) : '_Not provided_');

$body = implode("\n\n", $lines);

/* ------------------------------------------------------------
   GITHUB REQUEST
------------------------------------------------------------ */

$labels = ['bug', 'from-app'];
if ($type === 'error') $labels[] = 'crash';

$postData = json_encode([
    'title'  => $title,
    'body'   => $body,
    'labels' => $labels
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => GITHUB_API,
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

$response   = curl_exec($ch);
$curlErr    = curl_error($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($curlErr) {
    respond(502, [
        'ok'     => false,
        'error'  => 'GITHUB_CURL_ERROR',
        'detail' => $curlErr
    ]);
}

$result = json_decode($response, true);

if ($httpStatus >= 300) {
    respond(502, [
        'ok'     => false,
        'error'  => 'GITHUB_HTTP_ERROR',
        'status' => $httpStatus,
        'detail' => $result['message'] ?? 'Unknown GitHub error',
        'errors' => $result['errors'] ?? null
    ]);
}

if (!is_array($result) || empty($result['html_url'])) {
    respond(502, [
        'ok'     => false,
        'error'  => 'GITHUB_INVALID_RESPONSE',
        'detail' => $response
    ]);
}

/* ------------------------------------------------------------
   SUCCESS
------------------------------------------------------------ */

$_SESSION['last_issue_submit'] = $now;

respond(200, [
    'ok'       => true,
    'issueUrl' => $result['html_url']
]);

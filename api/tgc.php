<?php
header("Content-Type: text/html; charset=utf-8");

/*
|--------------------------------------------------------------------------
| LOAD TGC API KEY
|--------------------------------------------------------------------------
| Using existing DEVELOPER_ID and DEVELOPER_KEY config keys
| These map cleanly to TGC's expected:
|   api_key_id
|   private_key
|--------------------------------------------------------------------------
*/

$config = parse_ini_file("/home/fairwayg/.secrets/tgc.ini");

// DO NOT change these unless your ini changes
$API_KEY_ID  = $config["DEVELOPER_ID"];
$PRIVATE_KEY = $config["DEVELOPER_KEY"];


/*
|--------------------------------------------------------------------------
| HELPER: POST to TGC
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GENERIC TGC REQUEST (supports GET/POST/PUT/DELETE)
|--------------------------------------------------------------------------
*/
function tgc_request($method, $url, $fields = []) {
    $method = strtoupper($method ?: 'GET');

    $ch = curl_init();

    if ($method === 'GET' || $method === 'DELETE') {
        if (!empty($fields)) {
            $qs = http_build_query($fields);
            $url .= (strpos($url, '?') === false ? '?' : '&') . $qs;
        }
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
        } else {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
    ]);

    $response = curl_exec($ch);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ["error" => ["message" => $err]];
    }

    $json = json_decode($response, true);

    if (!$json) {
        return [
            "error" => [
                "message" => "Invalid JSON from TGC",
                "raw"     => $response
            ]
        ];
    }

    return $json;
}


function tgc_post($url, $fields) {
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($fields),
        CURLOPT_TIMEOUT        => 20,
    ]);

    $response = curl_exec($ch);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($err) {
        return ["error" => ["message" => $err]];
    }

    $json = json_decode($response, true);

    if (!$json) {
        return [
            "error" => [
                "message" => "Invalid JSON from TGC",
                "raw"     => $response
            ]
        ];
    }

    return $json;
}


/*
|--------------------------------------------------------------------------
| 1. START SSO
|--------------------------------------------------------------------------
*/

function start_sso($apiKeyId) {

    $postback = urlencode(
        "https://fairway3games.com/playing-cards/api/tgc.php?action=sso_return"
    );

    $permissions = [
        "view_my_account",
        "view_my_games",
        "edit_my_games",
        "view_my_files",
        "edit_my_files"
    ];

    $permStr = "";
    foreach ($permissions as $p) {
        $permStr .= "&permission=" . urlencode($p);
    }

    $url = "https://www.thegamecrafter.com/sso"
         . "?api_key_id={$apiKeyId}{$permStr}&postback_uri={$postback}";

    header("Location: $url");
    exit;
}


/*
|--------------------------------------------------------------------------
| 2. SSO RETURN HANDLER
|--------------------------------------------------------------------------
*/

function handle_sso_return($apiKeyId, $privateKey) {

    $ssoId = $_GET["sso_id"] ?? null;

    if (!$ssoId) {
        echo "Missing sso_id";
        exit;
    }

    // Correct TGC SSO session exchange
    $resp = tgc_post(
        "https://www.thegamecrafter.com/api/session/sso/$ssoId",
        [
            "api_key_id"  => $apiKeyId,
            "private_key" => $privateKey
        ]
    );

    file_put_contents(
        "/home/fairwayg/tgc_debug.log",
        "SSO RESPONSE:\n" . json_encode($resp, JSON_PRETTY_PRINT) . "\n\n",
        FILE_APPEND
    );

    if (!isset($resp["result"])) {
        echo "<pre>Invalid SSO Response:\n" . print_r($resp, true) . "</pre>";
        exit;
    }

    $sessionId = $resp["result"]["id"]      ?? "";
    $userId    = $resp["result"]["user_id"] ?? "";
?>
<html><body>
<script>
    if (window.opener) {
        window.opener.postMessage({
            type: "tgc-auth",
            session_id: "<?= $sessionId ?>",
            user_id: "<?= $userId ?>"
        }, "*");
    }
    window.close();
</script>
You may close this window.
</body></html>
<?php
    exit;
}


/*
|--------------------------------------------------------------------------
| 3. PROXY: Browser → PHP → TGC API
|--------------------------------------------------------------------------
*/

function proxy_api_request($apiKeyId, $privateKey) {

    // Read JSON body (for POST from browser)
    $rawBody   = file_get_contents("php://input");
    $inputData = $rawBody ? json_decode($rawBody, true) : [];

    // Allow path to come from body or query string (for backwards compat)
    $pathFromBody = is_array($inputData) && isset($inputData["path"])
        ? $inputData["path"]
        : null;
    $pathFromGet  = $_GET["path"] ?? null;
    $path         = $pathFromBody ?: $pathFromGet ?: "";

    // Determine HTTP method to use *toward TGC*:
    // - Prefer explicit "method" field in JSON body
    // - Fallback to the browser's HTTP method (GET/POST/...)
    $browserMethod = $_SERVER["REQUEST_METHOD"] ?? "GET";
    $tgcMethod     = isset($inputData["method"])
        ? strtoupper($inputData["method"])
        : strtoupper($browserMethod);

    // Base auth payload for TGC
    $baseFields = [
        "api_key_id"  => $apiKeyId,
        "private_key" => $privateKey,
    ];

    // Build request fields
    $queryFields = [];
    $bodyFields  = [];

    if ($tgcMethod === "GET" || $tgcMethod === "DELETE") {
        // Collect query params from both URL and JSON "query" field
        $queryFields = $_GET;
        unset($queryFields["action"], $queryFields["path"]);

        if (is_array($inputData) && isset($inputData["query"]) && is_array($inputData["query"])) {
            $queryFields = array_merge($queryFields, $inputData["query"]);
        }

        $fieldsForRequest = array_merge($baseFields, $queryFields);
    } else {
        // For POST/PUT/etc, treat whole JSON body (or "data" field) as payload
        if (is_array($inputData) && isset($inputData["data"]) && is_array($inputData["data"])) {
            $bodyFields = $inputData["data"];
        } elseif (is_array($inputData)) {
            $bodyFields = $inputData;
        } else {
            $bodyFields = [];
        }

        unset($bodyFields["path"], $bodyFields["method"], $bodyFields["query"]);

        $fieldsForRequest = array_merge($baseFields, $bodyFields);
    }

    $url = "https://www.thegamecrafter.com/api/" . ltrim($path, "/");

    $response = tgc_request($tgcMethod, $url, $fieldsForRequest);

    header("Content-Type: application/json");
    echo json_encode($response);
    exit;
}

/*
|--------------------------------------------------------------------------
| ROUTER
|--------------------------------------------------------------------------
*/

$action = $_GET["action"] ?? null;

switch ($action) {

    case "sso_start":
        start_sso($API_KEY_ID);
        break;

    case "sso_return":
        handle_sso_return($API_KEY_ID, $PRIVATE_KEY);
        break;

    default:
        proxy_api_request($API_KEY_ID, $PRIVATE_KEY);
        break;
}

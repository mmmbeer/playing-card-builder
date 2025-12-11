<?php
header("Content-Type: text/html; charset=utf-8");

/*
|--------------------------------------------------------------------------
| LOAD TGC API KEYS
|--------------------------------------------------------------------------
*/

$config = parse_ini_file("/home/fairwayg/.secrets/tgc.ini");

$API_KEY_ID  = $config["DEVELOPER_ID"];
$PRIVATE_KEY = $config["DEVELOPER_KEY"];


/*
|--------------------------------------------------------------------------
| GENERIC TGC REQUEST HELPERS
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
| SSO: START
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
| SSO: RETURN HANDLER
|--------------------------------------------------------------------------
*/

function handle_sso_return($apiKeyId, $privateKey) {
    $ssoId = $_GET["sso_id"] ?? null;

    if (!$ssoId) {
        echo "Missing sso_id";
        exit;
    }

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
| NEW: CARD UPLOAD HANDLER
|--------------------------------------------------------------------------
*/

function handle_card_upload($apiKeyId, $privateKey) {

    if (!isset($_FILES["file"])) {
        echo json_encode(["error" => ["message" => "No file uploaded"]]);
        exit;
    }

    $sessionId   = $_POST["session_id"]   ?? "";
    $designerId  = $_POST["designer_id"]  ?? "";
    $deckId      = $_POST["deck_id"]      ?? "";
    $cardSuit    = $_POST["card_suit"]    ?? "";
    $cardRank    = $_POST["card_rank"]    ?? "";

    $fileTmp = $_FILES["file"]["tmp_name"];
    $fileName = $_FILES["file"]["name"];

    /*
    |----------------------------------------------------------------------
    | STEP 1: Upload Image to TGC (/api/file)
    |----------------------------------------------------------------------
    */
    $url = "https://www.thegamecrafter.com/api/file";

    $postFields = [
        "api_key_id"  => $apiKeyId,
        "private_key" => $privateKey,
        "session_id"  => $sessionId,
        "designer_id" => $designerId,
        "name"        => $fileName,
        "file"        => new CURLFile($fileTmp, "image/png", $fileName)
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 40,
    ]);

    $uploadResp = curl_exec($ch);
    $uploadErr  = curl_error($ch);
    curl_close($ch);

    if ($uploadErr) {
        echo json_encode(["error" => ["message" => $uploadErr]]);
        exit;
    }

    $uploadJson = json_decode($uploadResp, true);

    if (!$uploadJson || !isset($uploadJson["result"]["id"])) {
        echo json_encode([
            "error" => [
                "message" => "Bad file upload response",
                "raw" => $uploadResp
            ]
        ]);
        exit;
    }

    $fileId = $uploadJson["result"]["id"];


    /*
    |----------------------------------------------------------------------
    | STEP 2: Create/Update Card (/api/card)
    |----------------------------------------------------------------------
    */
    $cardName = strtoupper($cardRank) . " of " . ucfirst($cardSuit);

    $url = "https://www.thegamecrafter.com/api/card";

    $cardFields = [
        "api_key_id"        => $apiKeyId,
        "private_key"       => $privateKey,
        "session_id"        => $sessionId,
        "deck_id"           => $deckId,
        "name"              => $cardName,
        "quantity"          => 1,
        "face_id"           => $fileId,
        "has_proofed_face"  => 1
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($cardFields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20
    ]);

    $cardResp = curl_exec($ch);
    $cardErr  = curl_error($ch);
    curl_close($ch);

    if ($cardErr) {
        echo json_encode(["error" => ["message" => $cardErr]]);
        exit;
    }

    echo $cardResp;
    exit;
}


/*
|--------------------------------------------------------------------------
| PROXY FOR NORMAL JSON REQUESTS (Browser → PHP → TGC)
|--------------------------------------------------------------------------
*/

function proxy_api_request($apiKeyId, $privateKey) {
    $rawBody   = file_get_contents("php://input");
    $inputData = $rawBody ? json_decode($rawBody, true) : [];

    $pathFromBody = $inputData["path"] ?? null;
    $pathFromGet  = $_GET["path"] ?? null;
    $path         = $pathFromBody ?: $pathFromGet ?: "";

    $browserMethod = $_SERVER["REQUEST_METHOD"] ?? "GET";
    $tgcMethod     = isset($inputData["method"])
        ? strtoupper($inputData["method"])
        : strtoupper($browserMethod);

    $base = [
        "api_key_id"  => $apiKeyId,
        "private_key" => $privateKey
    ];

    if ($tgcMethod === "GET" || $tgcMethod === "DELETE") {
        $queryFields = $_GET;
        unset($queryFields["action"], $queryFields["path"]);

        if (isset($inputData["query"]) && is_array($inputData["query"])) {
            $queryFields = array_merge($queryFields, $inputData["query"]);
        }

        $fields = array_merge($base, $queryFields);
    } else {
        if (isset($inputData["data"]) && is_array($inputData["data"])) {
            $bodyFields = $inputData["data"];
        } elseif (is_array($inputData)) {
            $bodyFields = $inputData;
        } else {
            $bodyFields = [];
        }

        unset($bodyFields["path"], $bodyFields["method"], $bodyFields["query"]);

        $fields = array_merge($base, $bodyFields);
    }

    $url = "https://www.thegamecrafter.com/api/" . ltrim($path, "/");

    $response = tgc_request($tgcMethod, $url, $fields);

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

    case "upload_card":
        handle_card_upload($API_KEY_ID, $PRIVATE_KEY);
        break;

    default:
        proxy_api_request($API_KEY_ID, $PRIVATE_KEY);
        break;
}

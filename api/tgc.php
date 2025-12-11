<?php
header("Content-Type: text/html; charset=utf-8");

/*
|--------------------------------------------------------------------------
| LOAD SECRETS
|--------------------------------------------------------------------------
*/
$config = parse_ini_file("/home/fairwayg/.secrets/tgc.ini");
$API_KEY_ID  = $config["DEVELOPER_ID"];
$PRIVATE_KEY = $config["DEVELOPER_KEY"];


/*
|--------------------------------------------------------------------------
| GENERIC HTTP HELPERS FOR TGC
|--------------------------------------------------------------------------
*/
function tgc_request($method, $url, $fields = []) {
    $method = strtoupper($method);
    $ch = curl_init();

    if ($method === "GET" || $method === "DELETE") {
        if (!empty($fields)) {
            $qs = http_build_query($fields);
            $url .= (strpos($url, "?") === false ? "?" : "&") . $qs;
        }
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
        if ($method === "POST") {
            curl_setopt($ch, CURLOPT_POST, true);
        } else {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }
    }

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 40,
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
| SSO — START LOGIN
|--------------------------------------------------------------------------
*/
function start_sso($apiKeyId) {
    $postback = urlencode("https://fairway3games.com/playing-cards/api/tgc.php?action=sso_return");

    $perms = [
        "view_my_account",
        "view_my_games",
        "edit_my_games",
        "view_my_files",
        "edit_my_files"
    ];

    $permStr = "";
    foreach ($perms as $p) {
        $permStr .= "&permission=" . urlencode($p);
    }

    $url = "https://www.thegamecrafter.com/sso"
         . "?api_key_id={$apiKeyId}{$permStr}&postback_uri={$postback}";

    header("Location: $url");
    exit;
}



/*
|--------------------------------------------------------------------------
| SSO — RETURN HANDLER
|--------------------------------------------------------------------------
*/
function handle_sso_return($apiKeyId, $privateKey) {
    $ssoId = $_GET["sso_id"] ?? null;
    if (!$ssoId) {
        echo "Missing sso_id";
        exit;
    }

    $resp = tgc_request("POST",
        "https://www.thegamecrafter.com/api/session/sso/$ssoId",
        [
            "api_key_id"  => $apiKeyId,
            "private_key" => $privateKey
        ]
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
| CARD UPLOAD / REPLACE / UPDATE HANDLER
|--------------------------------------------------------------------------
| This handles:
|   ✔ Upload PNG to TGC (/api/file)
|   ✔ Create new card
|   ✔ Replace existing card
|   ✔ Create copy w/ UUID
|--------------------------------------------------------------------------
*/
function handle_card_upload($apiKeyId, $privateKey) {

    /* ---------------------------------------------------------
       BASIC INPUT VALIDATION
    --------------------------------------------------------- */
    if (!isset($_FILES["file"])) {
        echo json_encode(["error" => ["message" => "No file uploaded"]]);
        exit;
    }

    $sessionId     = $_POST["session_id"]      ?? "";
    $designerId    = $_POST["designer_id"]     ?? "";
    $deckId        = $_POST["deck_id"]         ?? "";
    $rank          = $_POST["card_rank"]       ?? "";
    $suit          = $_POST["card_suit"]       ?? "";
    $collisionMode = $_POST["collision_mode"]  ?? "replace"; // NEW
    $userId        = $_POST["user_id"]         ?? "";

    if (!$userId) {
        echo json_encode(["error" => ["message" => "No user_id provided"]]);
        exit;
    }

    $cardName = strtoupper($rank) . " of " . ucfirst($suit);


    /* ---------------------------------------------------------
       STEP 0 — Ensure folder structure
    --------------------------------------------------------- */

    // Fetch deck to get name
    $deckInfo = tgc_request("GET",
        "https://www.thegamecrafter.com/api/deck/$deckId",
        [
            "api_key_id"  => $apiKeyId,
            "private_key" => $privateKey,
            "session_id"  => $sessionId
        ]
    );

    $deckName = $deckInfo["result"]["name"] ?? ("Deck-" . $deckId);

    // Fetch user's folders
    $folders = tgc_request("GET",
        "https://www.thegamecrafter.com/api/user/$userId/folders",
        [
            "api_key_id"  => $apiKeyId,
            "private_key" => $privateKey,
            "session_id"  => $sessionId
        ]
    );

    $folderItems = $folders["result"]["items"] ?? [];

    if (!$folderItems) {
        echo json_encode([
            "error" => [
                "message"  => "User has no folders",
                "response" => $folders
            ]
        ]);
        exit;
    }

    $rootFolderId = $folderItems[0]["id"];

    // Find/create "Playing Card Builder"
    $pcbFolderId = null;
    foreach ($folderItems as $f) {
        if (strcasecmp($f["name"], "Playing Card Builder") === 0) {
            $pcbFolderId = $f["id"];
            break;
        }
    }

    if (!$pcbFolderId) {
        $createPCB = tgc_request("POST",
            "https://www.thegamecrafter.com/api/folder",
            [
                "api_key_id"  => $apiKeyId,
                "private_key" => $privateKey,
                "session_id"  => $sessionId,
                "user_id"     => $userId,
                "parent_id"   => $rootFolderId,
                "name"        => "Playing Card Builder"
            ]
        );

        if (!isset($createPCB["result"]["id"])) {
            echo json_encode(["error" => ["message" => "Could not create PCB folder"]]);
            exit;
        }

        $pcbFolderId = $createPCB["result"]["id"];
    }

    // Find/create the deck folder
    $deckFolderName = "Deck - " . $deckName;
    $deckFolderId   = null;

    foreach ($folderItems as $f) {
        if (strcasecmp($f["name"], $deckFolderName) === 0) {
            $deckFolderId = $f["id"];
            break;
        }
    }

    if (!$deckFolderId) {
        $createDeckFolder = tgc_request("POST",
            "https://www.thegamecrafter.com/api/folder",
            [
                "api_key_id"  => $apiKeyId,
                "private_key" => $privateKey,
                "session_id"  => $sessionId,
                "user_id"     => $userId,
                "parent_id"   => $pcbFolderId,
                "name"        => $deckFolderName
            ]
        );

        if (!isset($createDeckFolder["result"]["id"])) {
            echo json_encode([
                "error" => [
                    "message"  => "Could not create Deck folder",
                    "response" => $createDeckFolder
                ]
            ]);
            exit;
        }

        $deckFolderId = $createDeckFolder["result"]["id"];
    }

    $folderId = $deckFolderId;


    /* ---------------------------------------------------------
       STEP 1 — Upload PNG file to TGC
    --------------------------------------------------------- */
    $fileTmp  = $_FILES["file"]["tmp_name"];
    $fileName = $_FILES["file"]["name"];

    $uploadPayload = [
        "api_key_id"  => $apiKeyId,
        "private_key" => $privateKey,
        "session_id"  => $sessionId,
        "folder_id"   => $folderId,
        "name"        => $fileName,
        "file"        => new CURLFile($fileTmp, "image/png", $fileName)
    ];

    $ch = curl_init("https://www.thegamecrafter.com/api/file");
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $uploadPayload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 40
    ]);

    $uploadResp = curl_exec($ch);
    curl_close($ch);

    $uploadJson = json_decode($uploadResp, true);

    if (!isset($uploadJson["result"]["id"])) {
        echo json_encode([
            "error" => [
                "message" => "Bad file upload response",
                "raw"     => $uploadResp
            ]
        ]);
        exit;
    }

    $fileId = $uploadJson["result"]["id"];


    /* ---------------------------------------------------------
       STEP 2 — Detect existing card
    --------------------------------------------------------- */
    $existing = tgc_request("GET",
        "https://www.thegamecrafter.com/api/card",
        [
            "api_key_id"  => $apiKeyId,
            "private_key" => $privateKey,
            "session_id"  => $sessionId,
            "deck_id"     => $deckId,
            "name"        => $cardName
        ]
    );

    $cardExists = isset($existing["result"][0]);
    $cardId     = $cardExists ? $existing["result"][0]["id"] : null;


    /* ---------------------------------------------------------
       COLLISION MODE LOGIC
    --------------------------------------------------------- */

    /** MODE: SKIP */
    if ($collisionMode === "skip") {
        echo json_encode([
            "skipped" => true,
            "name"    => $cardName
        ]);
        exit;
    }

    /** MODE: COPY — append UUID */
    if ($collisionMode === "copy") {
        $uuid = substr(bin2hex(random_bytes(2)), 0, 4);
        $cardName .= "_$uuid";
        $cardExists = false; // force creation
    }

    /** MODE: REPLACE — update card */
    if ($collisionMode === "replace" && $cardExists) {
        $update = tgc_request("PUT",
            "https://www.thegamecrafter.com/api/card/$cardId",
            [
                "api_key_id"       => $apiKeyId,
                "private_key"      => $privateKey,
                "session_id"       => $sessionId,
                "face_id"          => $fileId,
                "has_proofed_face" => 1
            ]
        );

        echo json_encode($update);
        exit;
    }


    /* ---------------------------------------------------------
       CREATE NEW CARD
    --------------------------------------------------------- */
    $create = tgc_request("POST",
        "https://www.thegamecrafter.com/api/card",
        [
            "api_key_id"       => $apiKeyId,
            "private_key"      => $privateKey,
            "session_id"       => $sessionId,
            "deck_id"          => $deckId,
            "name"             => $cardName,
            "quantity"         => 1,
            "face_id"          => $fileId,
            "has_proofed_face" => 1
        ]
    );

    echo json_encode($create);
    exit;
}




/*
|--------------------------------------------------------------------------
| PROXY FOR STANDARD API CALLS (JSON)
|--------------------------------------------------------------------------
*/
function proxy_api_request($apiKeyId, $privateKey) {
    $raw  = file_get_contents("php://input");
    $data = $raw ? json_decode($raw, true) : [];

    $path   = $data["path"] ?? ($_GET["path"] ?? "");
    $method = strtoupper($data["method"] ?? $_SERVER["REQUEST_METHOD"]);

    $base = [
        "api_key_id"  => $apiKeyId,
        "private_key" => $privateKey
    ];

    if ($method === "GET" || $method === "DELETE") {
        $fields = array_merge($base, $_GET, $data["query"] ?? []);
        unset($fields["action"], $fields["path"]);
    } else {
        $fields = array_merge($base, $data["data"] ?? $data);
        unset($fields["path"], $fields["method"], $fields["query"]);
    }

    $url = "https://www.thegamecrafter.com/api/" . ltrim($path, "/");

    $resp = tgc_request($method, $url, $fields);

    header("Content-Type: application/json");
    echo json_encode($resp);
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

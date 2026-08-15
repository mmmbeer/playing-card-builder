import { NextRequest, NextResponse } from "next/server";
import { resultItems, tgcRequest, tgcSecrets, tgcUpload } from "./tgc-service";
import { apiError as error, apiJson as json, assertSameOrigin, reasonMessage, reasonStatus, requestLength } from "../_shared/http";

export const dynamic = "force-dynamic";

const COOKIE = { session: "df_tgc_sid", user: "df_tgc_uid", state: "df_tgc_state" };
const ID_PATTERN = /^[A-Za-z0-9-]{8,80}$/;

function cleanName(value: unknown, label: string) {
  const text = String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!text || text.length > 100) throw new Error(`${label} must be between 1 and 100 characters.`);
  return text;
}

function cleanId(value: unknown, label: string) {
  const text = String(value || "");
  if (!ID_PATTERN.test(text)) throw new Error(`Invalid ${label}.`);
  return text;
}


function session(request: NextRequest) {
  const sessionId = request.cookies.get(COOKIE.session)?.value || "";
  const userId = request.cookies.get(COOKIE.user)?.value || "";
  if (!ID_PATTERN.test(sessionId) || !ID_PATTERN.test(userId)) throw new Error("Your The Game Crafter session has expired. Connect again.");
  return { sessionId, userId };
}

function popupResponse(origin: string, success: boolean, message = "") {
  const payload = JSON.stringify({ type: success ? "deckforged:tgc-authenticated" : "deckforged:tgc-error", message });
  const safeOrigin = JSON.stringify(origin);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Deck Forged connection</title><style>body{font:16px system-ui;background:#f6f3ec;color:#102038;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:460px;padding:32px;text-align:center}p{color:#617086;line-height:1.6}</style></head><body><main><h1>${success ? "Connected" : "Connection failed"}</h1><p>${success ? "Return to Deck Forged to continue." : "Close this window and try again."}</p></main><script>if(window.opener){window.opener.postMessage(${payload},${safeOrigin});}${success ? "window.close();" : ""}</script></body></html>`;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "status";
  const configured = Boolean(tgcSecrets().apiKeyId && tgcSecrets().privateKey);
  if (action === "status") {
    const authenticated = Boolean(request.cookies.get(COOKIE.session)?.value && request.cookies.get(COOKIE.user)?.value);
    return json({ configured, authenticated: configured && authenticated, message: configured ? undefined : "Add TGC_DEVELOPER_ID and TGC_DEVELOPER_KEY as private site environment variables." });
  }
  if (!configured) return error("The Game Crafter connection is not configured.", 503);

  if (action === "sso_start") {
    const state = crypto.randomUUID();
    const postback = new URL("/api/tgc", request.nextUrl.origin);
    postback.searchParams.set("action", "sso_return");
    postback.searchParams.set("state", state);
    const target = new URL("https://www.thegamecrafter.com/sso");
    target.searchParams.set("api_key_id", tgcSecrets().apiKeyId);
    for (const permission of ["view_my_account", "view_my_games", "edit_my_games", "view_my_files", "edit_my_files"]) target.searchParams.append("permission", permission);
    target.searchParams.set("postback_uri", postback.toString());
    const response = NextResponse.redirect(target);
    response.cookies.set(COOKIE.state, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/tgc", maxAge: 600 });
    return response;
  }

  if (action === "sso_return") {
    const origin = request.nextUrl.origin;
    const returnedState = request.nextUrl.searchParams.get("state") || "";
    const storedState = request.cookies.get(COOKIE.state)?.value || "";
    const ssoId = request.nextUrl.searchParams.get("sso_id") || "";
    if (!returnedState || returnedState !== storedState || !ID_PATTERN.test(ssoId)) return new NextResponse(popupResponse(origin, false, "Invalid sign-in response."), { status: 400, headers: { "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" } });
    try {
      const result = await tgcRequest("POST", `session/sso/${ssoId}`);
      const data = result.result as Record<string, unknown>;
      const sessionId = cleanId(data?.id, "session");
      const userId = cleanId(data?.user_id, "user");
      const response = new NextResponse(popupResponse(origin, true), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" } });
      response.cookies.set(COOKIE.session, sessionId, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/tgc", maxAge: 3600 });
      response.cookies.set(COOKIE.user, userId, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/tgc", maxAge: 3600 });
      response.cookies.delete(COOKIE.state);
      return response;
    } catch (reason) {
      return new NextResponse(popupResponse(origin, false, reason instanceof Error ? reason.message : "Connection failed."), { status: 502, headers: { "content-type": "text/html; charset=utf-8", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" } });
    }
  }
  return error("Unknown action.", 404);
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (!tgcSecrets().apiKeyId || !tgcSecrets().privateKey) return error("The Game Crafter connection is not configured.", 503);
    if (requestLength(request) > 10 * 1024 * 1024) return error("The request is too large.", 413);
    const contentType = request.headers.get("content-type") || "";

    if (contentType.startsWith("multipart/form-data")) {
      const { sessionId, userId } = session(request);
      const form = await request.formData();
      if (form.get("action") !== "upload_card") return error("Unknown upload action.");
      const file = form.get("file");
      if (!(file instanceof File) || file.type !== "image/png" || file.size < 100 || file.size > 8 * 1024 * 1024) return error("Upload a valid PNG file smaller than 8 MB.");
      const deckId = cleanId(form.get("deckId"), "deck");
      const rank = cleanName(form.get("rank"), "Rank");
      const suit = cleanName(form.get("suit"), "Suit");
      const collision = String(form.get("collision") || "replace");
      if (!["replace", "skip", "copy"].includes(collision)) return error("Invalid collision setting.");
      let cardName = `${rank.toUpperCase()} of ${suit.charAt(0).toUpperCase()}${suit.slice(1)}`;

      const existingResponse = await tgcRequest("GET", "card", { session_id: sessionId, deck_id: deckId, name: cardName });
      const existing = resultItems(existingResponse)[0];
      if (existing && collision === "skip") return json({ skipped: true, name: cardName });
      if (existing && collision === "copy") cardName = `${cardName} ${crypto.randomUUID().slice(0, 5)}`;

      const userResponse = await tgcRequest("GET", `user/${userId}`, { session_id: sessionId });
      const user = userResponse.result as Record<string, unknown>;
      const folderId = cleanId(user?.root_folder_id, "root folder");
      const uploaded = await tgcUpload({ session_id: sessionId, folder_id: folderId, name: file.name }, file);
      const fileId = cleanId((uploaded.result as Record<string, unknown>)?.id, "uploaded file");

      if (existing && collision === "replace") {
        const cardId = cleanId(existing.id, "card");
        const result = await tgcRequest("PUT", `card/${cardId}`, { session_id: sessionId, face_id: fileId, has_proofed_face: 0 });
        return json(result);
      }
      const result = await tgcRequest("POST", "card", { session_id: sessionId, deck_id: deckId, name: cardName, quantity: 1, face_id: fileId, has_proofed_face: 0 });
      return json(result);
    }

    const { sessionId, userId } = session(request);
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || "");
    if (action === "logout") {
      const response = json({ success: true });
      response.cookies.delete(COOKIE.session); response.cookies.delete(COOKIE.user);
      return response;
    }
    if (action === "designers") {
      const userResponse = await tgcRequest("GET", `user/${userId}`, { session_id: sessionId, _include_relationships: 1 });
      const user = userResponse.result as Record<string, unknown>;
      const defaultId = user?.default_designer_id ? cleanId(user.default_designer_id, "default designer") : "";
      let items: Array<Record<string, unknown>> = [];
      try { items = resultItems(await tgcRequest("GET", `user/${userId}/designers`, { session_id: sessionId, _items_per_page: 100 })); } catch { /* Some accounts expose only the default designer. */ }
      if (!items.length && defaultId) items = [{ id: defaultId, name: user?.display_name || user?.username || "Designer" }];
      return json({ items: items.map((item) => ({ id: cleanId(item.id, "designer"), name: cleanName(item.name || "Designer", "Designer name") })), defaultId });
    }
    if (action === "games") {
      const designerId = cleanId(body.designerId, "designer");
      const response = await tgcRequest("GET", `designer/${designerId}/games`, { session_id: sessionId, _items_per_page: 100 });
      return json({ items: resultItems(response).map((item) => ({ id: cleanId(item.id, "game"), name: cleanName(item.name, "Game name") })) });
    }
    if (action === "create_game") {
      const designerId = cleanId(body.designerId, "designer");
      const name = cleanName(body.name, "Game name");
      const response = await tgcRequest("POST", "game", { session_id: sessionId, designer_id: designerId, name });
      const item = response.result as Record<string, unknown>;
      return json({ item: { id: cleanId(item.id, "game"), name: cleanName(item.name || name, "Game name") } });
    }
    if (action === "decks") {
      const gameId = cleanId(body.gameId, "game");
      const response = await tgcRequest("GET", `game/${gameId}/decks`, { session_id: sessionId, _items_per_page: 100 });
      return json({ items: resultItems(response).map((item) => ({ id: cleanId(item.id, "deck"), name: cleanName(item.name, "Deck name") })) });
    }
    if (action === "existing_cards") {
      const deckId = cleanId(body.deckId, "deck");
      const response = await tgcRequest("GET", "card", { session_id: sessionId, deck_id: deckId, _items_per_page: 1000 });
      return json({ items: resultItems(response).map((item) => ({ id: cleanId(item.id, "card"), name: cleanName(item.name, "Card name") })) });
    }
    if (action === "create_deck") {
      const gameId = cleanId(body.gameId, "game");
      const name = cleanName(body.name, "Deck name");
      const response = await tgcRequest("POST", "deck", { session_id: sessionId, game_id: gameId, name, identity: "PokerDeck" });
      const item = response.result as Record<string, unknown>;
      return json({ item: { id: cleanId(item.id, "deck"), name: cleanName(item.name || name, "Deck name") } });
    }
    return error("Unknown action.", 404);
  } catch (reason) {
    const message = reasonMessage(reason, "The request could not be completed.");
    return error(message, /expired|session/i.test(message) ? 401 : reasonStatus(reason));
  }
}

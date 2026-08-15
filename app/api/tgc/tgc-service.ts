const TGC_BASE = "https://www.thegamecrafter.com/api";

export type TgcResponse = { result?: unknown; error?: { message?: string; code?: number } };

export function tgcSecrets() {
  return {
    apiKeyId: process.env.TGC_DEVELOPER_ID || "",
    privateKey: process.env.TGC_DEVELOPER_KEY || "",
  };
}

export function resultItems(response: TgcResponse): Array<Record<string, unknown>> {
  const root = response.result;
  if (Array.isArray(root)) return root as Array<Record<string, unknown>>;
  if (root && typeof root === "object") {
    const object = root as Record<string, unknown>;
    for (const key of ["items", "games", "decks", "designers", "cards"]) {
      if (Array.isArray(object[key])) return object[key] as Array<Record<string, unknown>>;
    }
  }
  return [];
}

async function parseTgcResponse(response: Response, unreadableMessage: string) {
  const text = await response.text();
  let parsed: TgcResponse;
  try {
    parsed = JSON.parse(text) as TgcResponse;
  } catch {
    throw new Error(unreadableMessage);
  }
  if (!response.ok || parsed.error) throw new Error(parsed.error?.message || `The Game Crafter request failed (${response.status}).`);
  return parsed;
}

export async function tgcRequest(method: string, path: string, fields: Record<string, string | number> = {}) {
  const { apiKeyId, privateKey } = tgcSecrets();
  const params = new URLSearchParams({ api_key_id: apiKeyId, private_key: privateKey });
  Object.entries(fields).forEach(([key, value]) => params.set(key, String(value)));
  const isRead = method === "GET" || method === "DELETE";
  const url = `${TGC_BASE}/${path.replace(/^\/+/, "")}${isRead ? `?${params}` : ""}`;
  const response = await fetch(url, {
    method,
    headers: isRead ? { accept: "application/json" } : { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body: isRead ? undefined : params,
    signal: AbortSignal.timeout(45_000),
  });
  return parseTgcResponse(response, "The Game Crafter returned an unreadable response.");
}

export async function tgcUpload(fields: Record<string, string>, file: File) {
  const { apiKeyId, privateKey } = tgcSecrets();
  const form = new FormData();
  form.set("api_key_id", apiKeyId);
  form.set("private_key", privateKey);
  Object.entries(fields).forEach(([key, value]) => form.set(key, value));
  form.set("file", file, file.name);
  const response = await fetch(`${TGC_BASE}/file`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  return parseTgcResponse(response, "The Game Crafter did not accept the card image.");
}

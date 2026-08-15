export class ApiError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  retries?: number;
  timeoutMs?: number;
};

function errorMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const body = value as Record<string, unknown>;
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object") {
    const nested = body.error as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
  }
  return fallback;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(response.ok ? "The server returned an unreadable response." : `Request failed (${response.status}).`, response.status);
  }
}

export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}, options: ApiOptions = {}): Promise<T> {
  const retries = Math.max(0, options.retries ?? 0);
  const method = (init.method || "GET").toUpperCase();
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, {
        credentials: "same-origin",
        ...init,
        signal: init.signal || AbortSignal.timeout(options.timeoutMs ?? 30_000),
      });
      const data = await parseResponse(response);
      if (!response.ok) throw new ApiError(errorMessage(data, `Request failed (${response.status}).`), response.status);
      return data as T;
    } catch (reason) {
      const retryable = method === "GET" && attempt < retries && (!(reason instanceof ApiError) || reason.status >= 500);
      if (!retryable) {
        if (reason instanceof Error) throw reason;
        throw new ApiError("The request could not be completed.");
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw new ApiError("The request could not be completed.");
}

export function postJson<T>(url: string, body: Record<string, unknown>, options?: ApiOptions) {
  return requestJson<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, options);
}

export function errorText(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

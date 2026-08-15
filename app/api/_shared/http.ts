import { NextRequest, NextResponse } from "next/server";

const API_HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export class HttpError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "HttpError";
  }
}

export function apiJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: API_HEADERS });
}

export function apiError(message: string, status = 400) {
  return apiJson({ error: { message } }, status);
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) throw new HttpError("The request origin could not be verified.", 403);
}

export function requestLength(request: NextRequest) {
  const value = Number(request.headers.get("content-length") || 0);
  return Number.isFinite(value) ? value : 0;
}

export function reasonMessage(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export function reasonStatus(reason: unknown, fallback = 400) {
  return reason instanceof HttpError ? reason.status : fallback;
}

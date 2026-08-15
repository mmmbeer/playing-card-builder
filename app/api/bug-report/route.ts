import { NextRequest } from "next/server";
import { getDb } from "@/db";
import { bugReports } from "@/db/schema";
import { apiError, apiJson, assertSameOrigin, reasonMessage, reasonStatus, requestLength } from "../_shared/http";

export const dynamic = "force-dynamic";

function clean(value: unknown, label: string, min: number, max: number) {
  const text = String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (text.length < min || text.length > max) throw new Error(`${label} must be between ${min} and ${max} characters.`);
  return text;
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (!(request.headers.get("content-type") || "").startsWith("application/json")) return apiError("Send the report as JSON.", 415);
    if (requestLength(request) > 64 * 1024) return apiError("The report is too large.", 413);
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return apiJson({ ok: true });
    const summary = clean(body.summary, "Summary", 6, 140);
    const happened = clean(body.happened, "What happened", 10, 3000);
    const steps = clean(body.steps, "Steps", 10, 3000);
    const details = body.details ? clean(body.details, "Technical details", 1, 2000) : null;
    let appState: string | null = null;
    if (body.appState) {
      appState = JSON.stringify(body.appState);
      if (appState.length > 40_000) throw new Error("The deck configuration is too large to attach.");
    }
    await getDb().insert(bugReports).values({ id: crypto.randomUUID(), createdAt: new Date(), summary, happened, steps, details, appState });
    return apiJson({ ok: true }, 201);
  } catch (reason) {
    return apiError(reasonMessage(reason, "The report could not be saved."), reasonStatus(reason));
  }
}

import { settings, activeRanks } from "./state.js";
import { isExporting } from "./save.js";

const APP_VERSION = document.querySelector("meta[name='app-version']")?.content || "unknown";

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.slice(0, 2000);
  if (value === null || typeof value === "undefined") return fallback;
  return String(value).slice(0, 2000);
}

function normalizeError(error) {
  if (!error) return null;
  const name = normalizeString(error.name || "Error");
  const message = normalizeString(error.message || error.toString() || "");
  const stack = normalizeString(error.stack || "");
  return { name, message, stack };
}

function captureAppState() {
  return {
    deckType: settings.deckIdentity || null,
    activeRanks: Array.isArray(activeRanks) ? [...activeRanks] : [],
    includeJokers: !!settings.includeJokers,
    jokerCount: Number.isFinite(settings.jokerCount) ? settings.jokerCount : null,
    iconPresetId: settings.iconPresetId || null,
    autosaveEnabled: true,
    exportInProgress: !!isExporting?.(),
    version: APP_VERSION
  };
}

function buildBasePayload(type, context = {}) {
  const payload = {
    type,
    title: normalizeString(context.title || ""),
    userMessage: normalizeString(context.userMessage || ""),
    steps: normalizeString(context.steps || ""),
    error: normalizeError(context.error),
    app: {
      version: APP_VERSION,
      route: window.location?.pathname || "",
      state: captureAppState()
    },
    env: {
      ua: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    }
  };

  if (!payload.error) delete payload.error;
  return payload;
}

export function reportError(error, context = {}) {
  return buildBasePayload("error", { ...context, error });
}

export function openManualReport() {
  return buildBasePayload("manual");
}

export async function submitReport(payload) {
  const response = await fetch("/api/github.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "Unknown error");
  }
  return data;
}

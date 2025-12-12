import { reportError, openManualReport, submitReport } from "./bugReporter.js";
import { initBugModal } from "./errors/modal.js";
import { showBugToast, hideBugToast } from "./errors/toast.js";

let modal;
const seenErrors = new Set();
let toastShown = false;

function normalizeKey(error) {
  if (!error) return "unknown";
  const name = error.name || "Error";
  const message = error.message || String(error);
  const stack = error.stack || "";
  return `${name}:${message}:${stack}`;
}

function isIgnorable(error) {
  const name = error?.name || "";
  const message = typeof error === "string" ? error : (error?.message || error?.reason || "");
  if (name === "AbortError") return true;
  if (typeof message === "string") {
    const lower = message.toLowerCase();
    if (lower.includes("abort")) return true;
    if (lower.includes("resizeobserver loop limit exceeded")) return true;
  }
  return false;
}

function handleError(eventError) {
  const errorObj = eventError || {};
  if (isIgnorable(errorObj)) return;
  const key = normalizeKey(errorObj);
  if (seenErrors.has(key)) return;
  seenErrors.add(key);

  const payload = reportError(errorObj, {
    title: errorObj?.message || "Unexpected error",
    error: eventError
  });
  triggerToast(payload);
}

function triggerToast(payload) {
  if (toastShown) return;
  toastShown = true;
  showBugToast(() => {
    hideBugToast();
    modal?.open(payload);
  });
}

function initManualButton() {
  const btn = document.getElementById("bugReportLauncher");
  if (!btn) return;
  btn.addEventListener("click", () => {
    hideBugToast();
    modal?.open(openManualReport());
  });
}

export function initErrorReporting() {
  modal = initBugModal(async payload => {
    return submitReport(payload);
  });

  window.addEventListener("error", event => {
    handleError(event.error || event);
  });

  window.addEventListener("unhandledrejection", event => {
    handleError(event.reason || event);
  });

  initManualButton();
}

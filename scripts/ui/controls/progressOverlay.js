let dom = null;

let state = {
  total: 0,
  current: 0,
  cancelled: false,
  onCancel: null,
  autoCloseTimer: null
};

export function initProgressOverlay() {
  dom = {
    overlay: document.getElementById("progressOverlay"),
    title: document.getElementById("progressOverlayTitle"),
    operation: document.getElementById("progressOperation"),
    current: document.getElementById("progressCurrent"),
    total: document.getElementById("progressTotal"),
    bar: document.getElementById("progressBarFill"),
    cancel: document.getElementById("progressCancel"),
    result: document.getElementById("progressResult")
  };

  if (!dom.overlay) {
    dom = null;
    return;
  }

  dom.cancel?.addEventListener("click", () => {
    state.cancelled = true;
    if (typeof state.onCancel === "function") {
      state.onCancel();
    }
  });

  hide();
}

export function showProgress({ total, title = "Processing…" }) {
  if (!dom) return;

  clearAutoClose();

  state.total = Number(total) || 0;
  state.current = 0;
  state.cancelled = false;

  dom.title.textContent = title;
  dom.operation.textContent = "";
  dom.current.textContent = 0;
  dom.total.textContent = state.total;
  dom.bar.style.width = "0%";

  dom.result.classList.add("hidden");
  dom.result.textContent = "";

  dom.overlay.classList.remove("hidden");
}

export function updateProgress(count) {
  if (!dom) return;

  state.current = Number(count) || 0;
  dom.current.textContent = state.current;

  const pct =
    state.total > 0
      ? Math.min(100, Math.round((state.current / state.total) * 100))
      : 0;

  dom.bar.style.width = pct + "%";
}

/* NEW: update operation text */
export function setProgressOperation(text) {
  if (!dom) return;
  dom.operation.textContent = text || "";
}

/* NEW: finish with success */
export function finishProgressSuccess(message, autoCloseMs = 1200) {
  if (!dom) return;

  dom.result.textContent = message || "Completed successfully.";
  dom.result.className = "progress-result success";
  dom.result.classList.remove("hidden");

  scheduleAutoClose(autoCloseMs);
}

/* NEW: finish with errors */
export function finishProgressError(errors) {
  if (!dom) return;

  const text = Array.isArray(errors)
    ? errors.join("\n")
    : String(errors || "One or more errors occurred.");

  dom.result.textContent = text;
  dom.result.className = "progress-result error";
  dom.result.classList.remove("hidden");
}

export function hideProgress() {
  hide();
}

export function onProgressCancel(fn) {
  state.onCancel = fn;
}

export function isProgressCancelled() {
  return state.cancelled;
}

/* ------------------------------------- */

function scheduleAutoClose(ms) {
  clearAutoClose();
  state.autoCloseTimer = setTimeout(hide, ms);
}

function clearAutoClose() {
  if (state.autoCloseTimer) {
    clearTimeout(state.autoCloseTimer);
    state.autoCloseTimer = null;
  }
}

function hide() {
  if (!dom) return;
  dom.overlay.classList.add("hidden");
  state.cancelled = false;
}

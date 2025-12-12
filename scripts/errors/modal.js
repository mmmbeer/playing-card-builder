const DEFAULT_TITLE = "Report an issue";

function getElements() {
  return {
    modal: document.getElementById("bugReportModal"),
    closeBtn: document.getElementById("closeBugModal"),
    form: document.getElementById("bugReportForm"),
    summaryInput: document.getElementById("bugSummary"),
    notesInput: document.getElementById("bugDetails"),
    stepsInput: document.getElementById("bugSteps"),
    includeStateCheckbox: document.getElementById("includeAppState"),
    techDetails: document.getElementById("bugTechnicalDetails"),
    submitBtn: document.getElementById("bugSubmit"),
    cancelBtn: document.getElementById("bugCancel"),
    statusRow: document.getElementById("bugStatus"),
    statusLink: document.getElementById("bugStatusLink"),
    fallbackLink: document.getElementById("bugFallbackLink")
  };
}

function stringifyDetails(payload) {
  const { error, app, env } = payload || {};
  const parts = [];
  if (error) {
    parts.push(`Error: ${error.name || "Error"}`);
    if (error.message) parts.push(`Message: ${error.message}`);
    if (error.stack) parts.push(`Stack:\n${error.stack}`);
  }
  if (app) {
    parts.push(`App version: ${app.version || ""}`);
    if (app.route) parts.push(`Route: ${app.route}`);
    if (app.state) parts.push(`State: ${JSON.stringify(app.state, null, 2)}`);
  }
  if (env) {
    parts.push(`Environment: ${env.platform || ""} | ${env.language || ""}`);
    if (env.ua) parts.push(`UA: ${env.ua}`);
  }
  return parts.join("\n\n");
}

function buildManualIssueLink(payload) {
  const title = encodeURIComponent(payload?.title || DEFAULT_TITLE);
  const body = [];
  if (payload?.userMessage) body.push(`User notes:\n${payload.userMessage}`);
  if (payload?.steps) body.push(`Steps:\n${payload.steps}`);
  if (payload?.error?.message) body.push(`Error: ${payload.error.message}`);
  if (payload?.error?.stack) body.push(`Stack:\n${payload.error.stack}`);
  if (payload?.app?.state) body.push(`State:\n${JSON.stringify(payload.app.state, null, 2)}`);
  if (payload?.env) body.push(`Env: ${payload.env.platform || ""} | ${payload.env.language || ""}`);
  const bodyStr = encodeURIComponent(body.join("\n\n"));
  return `https://github.com/mmmbeer/playing-card-builder/issues/new?title=${title}&body=${bodyStr}`;
}

export function initBugModal(onSubmit) {
  const els = getElements();
  if (!els.modal || !els.form) return null;

  let currentPayload = null;

  function refreshDetails(includeState = true) {
    if (!currentPayload) return;
    const payloadCopy = {
      ...currentPayload,
      app: currentPayload.app ? { ...currentPayload.app } : null
    };
    if (!includeState && payloadCopy.app) {
      delete payloadCopy.app.state;
    }
    els.techDetails.value = stringifyDetails(payloadCopy);
  }

  function close() {
    els.modal.classList.add("hidden");
    els.statusRow.textContent = "";
    els.statusRow.className = "modal-status";
    els.statusLink.innerHTML = "";
    els.fallbackLink.classList.add("hidden");
  }

  function open(payload) {
    currentPayload = payload || null;
    els.summaryInput.value = payload?.title || "";
    els.notesInput.value = payload?.userMessage || "";
    els.stepsInput.value = payload?.steps || "";
    els.includeStateCheckbox.checked = true;
    refreshDetails(true);
    els.fallbackLink.classList.add("hidden");
    els.statusRow.textContent = "";
    els.statusRow.className = "modal-status";
    els.statusLink.innerHTML = "";
    els.modal.classList.remove("hidden");
    els.summaryInput.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!currentPayload) return;

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = "Submitting…";
    els.statusRow.textContent = "";
    els.statusLink.innerHTML = "";

    const payload = { ...currentPayload };
    payload.title = els.summaryInput.value.trim();
    payload.userMessage = els.notesInput.value.trim();
    payload.steps = els.stepsInput.value.trim();

    if (!payload.title) {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = "Submit";
      els.statusRow.textContent = "Summary is required.";
      els.statusRow.classList.add("error");
      return;
    }

    if (!els.includeStateCheckbox.checked && payload.app) {
      delete payload.app.state;
    }

    try {
      const result = await onSubmit(payload);
      els.statusRow.textContent = "Thank you!";
      els.statusRow.classList.remove("error");
      els.statusRow.classList.add("success");
      if (result?.issueUrl) {
        els.statusLink.innerHTML = `<a href="${result.issueUrl}" target="_blank" rel="noopener">View issue</a>`;
      }
    } catch (err) {
      els.statusRow.textContent = err.message || "Failed to submit";
      els.statusRow.classList.add("error");
      els.fallbackLink.href = buildManualIssueLink(payload);
      els.fallbackLink.classList.remove("hidden");
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = "Submit";
    }
  }

  els.closeBtn?.addEventListener("click", close);
  els.cancelBtn?.addEventListener("click", event => {
    event.preventDefault();
    close();
  });
  els.form.addEventListener("submit", handleSubmit);
  els.modal.addEventListener("click", event => {
    if (event.target === els.modal) {
      close();
    }
  });

  els.includeStateCheckbox?.addEventListener("change", () => {
    refreshDetails(els.includeStateCheckbox.checked);
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.modal.classList.contains("hidden")) {
      close();
    }
  });

  return { open, close };
}

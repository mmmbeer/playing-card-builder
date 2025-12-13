const ESCAPE_KEY = "Escape";

function getElements() {
  return {
    launcher: document.getElementById("policiesLauncher"),
    modal: document.getElementById("policiesModal"),
    closeBtn: document.getElementById("closePoliciesModal"),
    issueLink: document.getElementById("issueReportLink")
  };
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.querySelector(".modal-content")?.focus({ preventScroll: true });
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
}

function wireEscape(modal) {
  if (!modal) return;
  window.addEventListener("keydown", event => {
    if (event.key === ESCAPE_KEY && !modal.classList.contains("hidden")) {
      closeModal(modal);
    }
  });
}

function wireBackdrop(modal) {
  if (!modal) return;
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
}

function wireIssueLink(issueLink) {
  if (!issueLink) return;
  issueLink.addEventListener("click", event => {
    event.preventDefault();
    const launcher = document.getElementById("bugReportLauncher");
    if (launcher) launcher.click();
  });
}

export function initPolicies() {
  const { launcher, modal, closeBtn, issueLink } = getElements();
  if (!launcher || !modal) return;

  launcher.addEventListener("click", () => openModal(modal));
  closeBtn?.addEventListener("click", () => closeModal(modal));

  wireBackdrop(modal);
  wireEscape(modal);
  wireIssueLink(issueLink);
}

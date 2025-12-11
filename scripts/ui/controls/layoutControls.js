// ui/controls/layoutControls.js
export function initLayoutControls(dom, settings, render) {
  dom.layoutButtons.addEventListener("click", evt => {
    const btn = evt.target.closest("button[data-layout]");
    if (!btn) return;

    settings.layout = btn.getAttribute("data-layout");

    dom.layoutButtons.querySelectorAll("button").forEach(b =>
      b.classList.toggle("active", b === btn)
    );

    render();
  });
}

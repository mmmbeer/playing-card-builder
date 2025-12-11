// ui/controls/guidelineControls.js
export function initGuidelineControls(dom, settings, render) {
  dom.showGuidelinesCheckbox.addEventListener("change", () => {
    settings.showGuidelines = dom.showGuidelinesCheckbox.checked;
    render();
  });
}

// ui/controls/mirrorControls.js
export function initMirrorControls(dom, getCard, render) {
  //
  // Individual card mirror toggle
  //
  dom.mirrorCardCheckbox.addEventListener("change", () => {
    const card = getCard();
    if (!card) return;

    card.mirrorCorners = dom.mirrorCardCheckbox.checked;
    render();
  });
}

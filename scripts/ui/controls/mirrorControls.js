// ui/controls/mirrorControls.js
export function initMirrorControls(dom, getCard, settings, render) {
  //
  // Individual card mirror toggle
  //
  dom.mirrorCardCheckbox.addEventListener("change", () => {
    const card = getCard();
    if (!card) return;

    card.mirrorCorners = dom.mirrorCardCheckbox.checked;
    render();
  });

  //
  // Default mirror toggle for new cards
  //
  dom.mirrorDefaultCheckbox.addEventListener("change", () => {
    settings.mirrorDefault = dom.mirrorDefaultCheckbox.checked;
    render();
  });
}

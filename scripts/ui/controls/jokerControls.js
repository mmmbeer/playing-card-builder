// ui/controls/jokerControls.js
export function initJokerControls(dom, settings, onChange) {
  function notify() {
    onChange?.();
  }

  dom.includeJokersCheckbox.addEventListener("change", () => {
    settings.includeJokers = dom.includeJokersCheckbox.checked;
    notify();
  });

  dom.jokerCountInput.addEventListener("input", () => {
    let n = Number(dom.jokerCountInput.value);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 8) n = 8;

    dom.jokerCountInput.value = n;
    settings.jokerCount = n;
    notify();
  });

  dom.jokerLabelInput.addEventListener("input", () => {
    settings.jokerLabel = dom.jokerLabelInput.value || "JOKER";
    notify();
  });

  dom.jokerWildCheckbox.addEventListener("change", () => {
    settings.jokerWild = dom.jokerWildCheckbox.checked;
    notify();
  });

  dom.jokerLabelOrientationSelect.addEventListener("change", () => {
    const value = dom.jokerLabelOrientationSelect.value === "vertical" ? "vertical" : "horizontal";
    settings.jokerLabelOrientation = value;
    notify();
  });

  dom.jokerFontSizeInput.addEventListener("input", () => {
    let size = Number(dom.jokerFontSizeInput.value);
    if (isNaN(size) || size < 24) size = 24;
    if (size > 160) size = 160;
    dom.jokerFontSizeInput.value = size;
    settings.jokerFontSize = size;
    notify();
  });

  dom.jokerSuitStyleSelect.addEventListener("change", () => {
    const allowed = new Set([
      "centerCircle",
      "centerSquare",
      "diamond",
      "belowLabelRow",
      "centerRowSplit",
      "centerColumn",
      "none"
    ]);
    const value = allowed.has(dom.jokerSuitStyleSelect.value)
      ? dom.jokerSuitStyleSelect.value
      : "centerCircle";
    settings.jokerSuitStyle = value;
    notify();
  });
}

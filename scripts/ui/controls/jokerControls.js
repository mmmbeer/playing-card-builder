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
}

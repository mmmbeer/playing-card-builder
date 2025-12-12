// ui/controls/deckSettingsControls.js
export function initDeckSettingsControls(dom, settings, refreshRanks, render) {
  //
  // Custom rank list
  //
  dom.customRanksInput.addEventListener("change", () => {
    settings.customRanksString = dom.customRanksInput.value;
    refreshRanks();
    render();
  });

  //
  // Show pips
  //
  dom.showPipsCheckbox.addEventListener("change", () => {
    settings.showPips = dom.showPipsCheckbox.checked;
    render();
  });

  //
  // Joker toggles
  //
  dom.includeJokersCheckbox.addEventListener("change", () => {
    settings.includeJokers = dom.includeJokersCheckbox.checked;
  });

  dom.jokerCountInput.addEventListener("input", () => {
    let n = Number(dom.jokerCountInput.value);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 8) n = 8;

    dom.jokerCountInput.value = n;
    settings.jokerCount = n;
  });

  dom.jokerLabelInput.addEventListener("input", () => {
    settings.jokerLabel = dom.jokerLabelInput.value || "JOKER";
  });

  dom.jokerWildCheckbox.addEventListener("change", () => {
    settings.jokerWild = dom.jokerWildCheckbox.checked;
  });
}

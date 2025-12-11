import { initDeck, updateActiveRanksFromSettings, settings } from "../../state.js";

export function initRankControls(dom, ctx, refreshRanks, sync, render) {

  // 1. Handle dropdown rank change
  dom.rankSelect.addEventListener("change", () => {
    ctx.currentRank = dom.rankSelect.value;
    sync();
    render();
  });

  // 2. Handle custom rank list change
  dom.customRanksInput.addEventListener("change", () => {

    // A. Update settings (this was missing)
    settings.customRanksString = dom.customRanksInput.value;

    // B. Recompute rank list
    updateActiveRanksFromSettings();  // updates activeRanks

    // C. Rebuild deck for new rank list
    initDeck();

    // D. Refresh UI dropdown
    refreshRanks();

    // E. Make sure selection is valid
    ctx.currentRank = dom.rankSelect.value;

    // F. Sync control panel + re-render
    sync();
    render();
  });
}

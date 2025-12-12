import { initDeck, updateActiveRanksFromSettings, settings } from "../../state.js";
import { JOKER_SUIT_ID, decodeRankValue } from "../navigation.js";

export function initRankControls(dom, ctx, refreshRanks, sync, render) {

  // 1. Handle dropdown rank change
  dom.rankSelect.addEventListener("change", () => {
    if (dom.suitSelect.value === JOKER_SUIT_ID) {
      ctx.currentRank = null;
      ctx.currentCopyIndex = 1;
    } else {
      const { rank, copyIndex } = decodeRankValue(dom.rankSelect.value);
      ctx.currentRank = rank;
      ctx.currentCopyIndex = copyIndex;
    }
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

// ui/controls/suitControls.js
export function initSuitControls(dom, ctx, render, sync, refreshRanks) {
  dom.suitSelect.addEventListener("change", () => {
    ctx.currentSuitId = dom.suitSelect.value;
    refreshRanks?.();
    sync();
    render();
  });
}

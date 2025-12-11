// ui/controls/suitControls.js
export function initSuitControls(dom, ctx, render, sync) {
  dom.suitSelect.addEventListener("change", () => {
    ctx.currentSuitId = dom.suitSelect.value;
    sync();
    render();
  });
}

// ui/controls/cornerOffsetControls.js
export function initCornerOffsetControls(dom, settings, render) {
  function bind(input, key) {
    input.addEventListener("input", () => {
      const v = Number(input.value);
      settings[key] = isNaN(v) ? 0 : v;
      render();
    });
  }

  bind(dom.rankOffsetXInput, "cornerRankOffsetX");
  bind(dom.rankOffsetYInput, "cornerRankOffsetY");
  bind(dom.suitOffsetXInput, "cornerSuitOffsetX");
  bind(dom.suitOffsetYInput, "cornerSuitOffsetY");
}

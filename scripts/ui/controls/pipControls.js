// ui/controls/pipControls.js
export function initPipControls(dom, settings, render) {
  function bindPercent(input, key) {
    input.addEventListener("input", () => {
      let v = Number(input.value);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(100, v));

      settings[key] = v / 100;
      input.value = v;

      render();
    });
  }

  bindPercent(dom.pipTopInput, "pipTop");
  bindPercent(dom.pipInnerTopInput, "pipInnerTop");
  bindPercent(dom.pipCenterInput, "pipCenter");
  bindPercent(dom.pipInnerBottomInput, "pipInnerBottom");
  bindPercent(dom.pipBottomInput, "pipBottom");
}

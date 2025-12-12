// ui/controls/pipControls.js
export function initPipControls(dom, settings, render) {
  function bindPercent(input, valueEl, key) {
    const update = raw => {
      let v = Number(raw);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(100, Math.round(v)));

      settings[key] = v / 100;
      input.value = v;
      if (valueEl) valueEl.textContent = v;

      render();
    };

    input.addEventListener("input", () => update(input.value));
    update(input.value);
  }

  bindPercent(dom.pipTopInput, dom.pipTopValue, "pipTop");
  bindPercent(dom.pipInnerTopInput, dom.pipInnerTopValue, "pipInnerTop");
  bindPercent(dom.pipCenterInput, dom.pipCenterValue, "pipCenter");
  bindPercent(dom.pipInnerBottomInput, dom.pipInnerBottomValue, "pipInnerBottom");
  bindPercent(dom.pipBottomInput, dom.pipBottomValue, "pipBottom");
}

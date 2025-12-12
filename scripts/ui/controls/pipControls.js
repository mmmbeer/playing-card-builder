// ui/controls/pipControls.js
import { DEFAULT_PIP_VERTICALS } from "../../config.js";

const SLIDER_KEYS = [
  "pipTop",
  "pipInnerTop",
  "pipCenter",
  "pipInnerBottom",
  "pipBottom"
];

const SHIFT_KEYS = ["pipTop", "pipInnerTop", "pipInnerBottom", "pipBottom"];

const clampPercent = value => Math.max(0, Math.min(100, Math.round(value)));

export function initPipControls(dom, settings, render) {
  const pipState = {
    pipTop: clampPercent(settings.pipTop * 100),
    pipInnerTop: clampPercent(settings.pipInnerTop * 100),
    pipCenter: clampPercent(settings.pipCenter * 100),
    pipInnerBottom: clampPercent(settings.pipInnerBottom * 100),
    pipBottom: clampPercent(settings.pipBottom * 100)
  };

  const linkState = {
    outer: false,
    inner: false,
    center: false
  };

  const mirrorAroundCenter = value => clampPercent(2 * pipState.pipCenter - value);

  const linkButtons = {
    outer: dom.linkPipOuterButton,
    inner: dom.linkPipInnerButton,
    center: dom.linkPipCenterButton
  };

  const updateLinkButton = (button, active) => {
    if (!button) return;
    button.classList.toggle("active", active);
  };

  const syncUI = (writeSettings = true) => {
    dom.pipTopInput.value = pipState.pipTop;
    dom.pipInnerTopInput.value = pipState.pipInnerTop;
    dom.pipCenterInput.value = pipState.pipCenter;
    dom.pipInnerBottomInput.value = pipState.pipInnerBottom;
    dom.pipBottomInput.value = pipState.pipBottom;

    if (dom.pipTopValue) dom.pipTopValue.textContent = pipState.pipTop;
    if (dom.pipInnerTopValue) dom.pipInnerTopValue.textContent = pipState.pipInnerTop;
    if (dom.pipCenterValue) dom.pipCenterValue.textContent = pipState.pipCenter;
    if (dom.pipInnerBottomValue) dom.pipInnerBottomValue.textContent = pipState.pipInnerBottom;
    if (dom.pipBottomValue) dom.pipBottomValue.textContent = pipState.pipBottom;

    if (writeSettings) {
      SLIDER_KEYS.forEach(key => {
        settings[key] = pipState[key] / 100;
      });

      render();
    }
  };

  const applyMirrors = () => {
    if (linkState.outer) {
      pipState.pipBottom = mirrorAroundCenter(pipState.pipTop);
    }

    if (linkState.inner) {
      pipState.pipInnerBottom = mirrorAroundCenter(pipState.pipInnerTop);
    }
  };

  const shiftAllBy = delta => {
    SHIFT_KEYS.forEach(key => {
      pipState[key] = clampPercent(pipState[key] + delta);
    });
    applyMirrors();
  };

  const handleChange = (key, rawValue) => {
    const next = clampPercent(rawValue);
    const prev = pipState[key];
    const delta = next - prev;

    pipState[key] = next;

    if (linkState.center && key === "pipCenter") {
      shiftAllBy(delta);
    }

    applyMirrors();
    syncUI();
  };

  const bindSlider = (input, key) => {
    if (!input) return;
    input.addEventListener("input", () => handleChange(key, input.value));
  };

  const resetPipState = () => {
    pipState.pipTop = clampPercent(DEFAULT_PIP_VERTICALS.top * 100);
    pipState.pipInnerTop = clampPercent(DEFAULT_PIP_VERTICALS.innerTop * 100);
    pipState.pipCenter = clampPercent(DEFAULT_PIP_VERTICALS.center * 100);
    pipState.pipInnerBottom = clampPercent(DEFAULT_PIP_VERTICALS.innerBottom * 100);
    pipState.pipBottom = clampPercent(DEFAULT_PIP_VERTICALS.bottom * 100);
    applyMirrors();
    syncUI();
  };

  const toggleLink = (key) => {
    linkState[key] = !linkState[key];
    updateLinkButton(linkButtons[key], linkState[key]);
    if (key !== "center") applyMirrors();
    syncUI();
  };

  bindSlider(dom.pipTopInput, "pipTop");
  bindSlider(dom.pipInnerTopInput, "pipInnerTop");
  bindSlider(dom.pipCenterInput, "pipCenter");
  bindSlider(dom.pipInnerBottomInput, "pipInnerBottom");
  bindSlider(dom.pipBottomInput, "pipBottom");

  dom.resetPipPositionsButton?.addEventListener("click", () => {
    linkState.outer = false;
    linkState.inner = false;
    linkState.center = false;
    updateLinkButton(linkButtons.outer, false);
    updateLinkButton(linkButtons.inner, false);
    updateLinkButton(linkButtons.center, false);
    resetPipState();
  });

  dom.linkPipOuterButton?.addEventListener("click", () => toggleLink("outer"));
  dom.linkPipInnerButton?.addEventListener("click", () => toggleLink("inner"));
  dom.linkPipCenterButton?.addEventListener("click", () => toggleLink("center"));

  window.addEventListener("refreshUIFromSettings", () => {
    pipState.pipTop = clampPercent(settings.pipTop * 100);
    pipState.pipInnerTop = clampPercent(settings.pipInnerTop * 100);
    pipState.pipCenter = clampPercent(settings.pipCenter * 100);
    pipState.pipInnerBottom = clampPercent(settings.pipInnerBottom * 100);
    pipState.pipBottom = clampPercent(settings.pipBottom * 100);
    applyMirrors();
    syncUI(false);
  });

  applyMirrors();
  syncUI();
}

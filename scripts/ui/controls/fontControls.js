// ui/controls/fontControls.js
import { markDirty } from "../../autosave.js";
import { bindColorPicker } from "./colorPicker.js";

export function initFontControls(dom, settings, render, openFontBrowser) {

  // Open font browser
  dom.fontFamilyWrapper.addEventListener("click", () => openFontBrowser(dom));

  // Font family selected (fontBrowser dispatches this event)
  document.addEventListener("fontFamilySelected", evt => {
    const family = evt.detail;

    settings.fontFamily = family;
	
	console.log(dom.fontFamilyInput);
	
    if (dom.fontFamilyInput) {
		dom.fontFamilyInput.textContent = family;
	}


    // Load Google font – uses global WebFont provided by index.html
    WebFont.load({
      google: { families: [family] },
      active: () => render()
    });

    markDirty();
  });
  
  // Font size
  dom.fontSizeInput.addEventListener("input", () => {
    const v = Number(dom.fontSizeInput.value);
    if (v > 0) settings.fontSize = v;
    markDirty();
    render();
  });

  // Font weight
  dom.fontWeightSelect.addEventListener("change", () => {
    settings.fontWeight = dom.fontWeightSelect.value;
    markDirty();
    render();
  });

  const syncColorGroups = () => {
    const mode = settings.fontColorMode || "single";
    if (dom.fontColorModeSelect) dom.fontColorModeSelect.value = mode;
    if (dom.fontSingleGroup) dom.fontSingleGroup.classList.toggle("hidden", mode !== "single");
    if (dom.fontBiColorGroup) dom.fontBiColorGroup.classList.toggle("hidden", mode !== "bi");
    if (dom.fontPerSuitGroup) dom.fontPerSuitGroup.classList.toggle("hidden", mode !== "perSuit");
  };

  if (dom.fontColorModeSelect) {
    dom.fontColorModeSelect.addEventListener("change", () => {
      settings.fontColorMode = dom.fontColorModeSelect.value;
      syncColorGroups();
      render();
    });
  }

  const onBeforeSample = () => render();

  bindColorPicker({
    input: dom.fontColorInput,
    button: dom.fontColorEyedropper,
    onChange: value => {
      settings.fontColor = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorBlackInput,
    button: dom.fontColorBlackEyedropper,
    onChange: value => {
      settings.fontColorBlack = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorRedInput,
    button: dom.fontColorRedEyedropper,
    onChange: value => {
      settings.fontColorRed = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorSpadesInput,
    button: dom.fontColorSpadesEyedropper,
    onChange: value => {
      settings.fontColorSpades = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorHeartsInput,
    button: dom.fontColorHeartsEyedropper,
    onChange: value => {
      settings.fontColorHearts = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorClubsInput,
    button: dom.fontColorClubsEyedropper,
    onChange: value => {
      settings.fontColorClubs = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.fontColorDiamondsInput,
    button: dom.fontColorDiamondsEyedropper,
    onChange: value => {
      settings.fontColorDiamonds = value;
      render();
    },
    onBeforeSample
  });

  // Opacity
  dom.fontOpacityInput.addEventListener("input", () => {
    settings.fontOpacity = Number(dom.fontOpacityInput.value);
    markDirty();
    render();
  });

  // Overlay type
  dom.overlayTypeSelect.addEventListener("change", () => {
    settings.overlayType = dom.overlayTypeSelect.value;
    markDirty();
    render();
  });

  dom.overlayOpacityInput.addEventListener("input", () => {
    settings.overlayOpacity = Number(dom.overlayOpacityInput.value);
    markDirty();
    render();
  });

  dom.overlayBlurInput.addEventListener("input", () => {
    settings.overlayBlur = Number(dom.overlayBlurInput.value);
    markDirty();
    render();
  });

  dom.shadowOffsetXInput.addEventListener("input", () => {
    settings.shadowOffsetX = Number(dom.shadowOffsetXInput.value);
    markDirty();
    render();
  });

  dom.shadowOffsetYInput.addEventListener("input", () => {
    settings.shadowOffsetY = Number(dom.shadowOffsetYInput.value);
    markDirty();
    render();
  });

  // Outline toggle
  dom.outlineCheckbox.addEventListener("change", () => {
    settings.outline = dom.outlineCheckbox.checked;
    markDirty();
    render();
  });

  // Outline width
  dom.outlineWidthInput.addEventListener("input", () => {
    settings.outlineWidth = Number(dom.outlineWidthInput.value);
    markDirty();
    render();
  });

  // Outline color
  dom.outlineColorInput.addEventListener("input", () => {
    settings.outlineColor = dom.outlineColorInput.value;
    markDirty();
    render();
  });

  dom.outlinePositionSelect.addEventListener("change", () => {
    settings.outlinePosition = dom.outlinePositionSelect.value;
    markDirty();
    render();
  });

  syncColorGroups();
}

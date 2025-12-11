// ui/controls/fontControls.js
import { markDirty } from "../../autosave.js";

export function initFontControls(dom, settings, render, openFontBrowser) {

  // Open font browser
  dom.fontFamilyWrapper.addEventListener("click", openFontBrowser);

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

  // Color
  dom.fontColorInput.addEventListener("input", () => {
    settings.fontColor = dom.fontColorInput.value;
    markDirty();
    render();
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
}

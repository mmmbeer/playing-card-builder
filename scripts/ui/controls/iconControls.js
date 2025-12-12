// ui/controls/iconControls.js
import { markDirty } from "../../autosave.js";
import { bindColorPicker } from "./colorPicker.js";
import { loadPreset } from "../presets.js"; // we expose this in presets.js
import { saveImageFromSource } from "../../indexedDB.js";

export function initIconControls(dom, settings, render) {

  /* ================================================================
     BUILT-IN PRESET SELECTION
     ================================================================ */
  dom.iconPresetSelect.addEventListener("change", async () => {
    const presetId = dom.iconPresetSelect.value;

    // User selected a built-in preset
    if (presetId && presetId !== "custom") {
      settings.iconPresetId = presetId;
      settings.customIconImageId = null;       // clear custom image

      // Load the preset sheet into an Image object
      const sheet = await loadPreset(presetId);
      settings.iconSheet = sheet;

      markDirty();
      render();
      return;
    }

    // User selected "custom" (but hasn't uploaded yet)
    if (presetId === "custom") {
      settings.iconPresetId = null;
      // Wait for upload event to provide custom sheet
      markDirty();
    }
  });


  /* ================================================================
     CUSTOM UPLOAD (2×2 sprite sheet)
     ================================================================ */
  dom.iconSheetInput.addEventListener("change", evt => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    // Switch dropdown to "custom" mode
    dom.iconPresetSelect.value = "custom";
    settings.iconPresetId = null;

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);

      // Set as active sheet
      settings.iconSheet = img;
      const imageId = await saveImageFromSource(img, "suit", settings.customIconImageId || null);
      settings.customIconImageId = imageId;
      
      markDirty();
      render();
    };

    img.src = url;
  });


  /* ================================================================
     ICON COLOR
     ================================================================ */
  const syncColorGroups = () => {
    const mode = settings.iconColorMode || "standard";
    if (dom.iconColorModeSelect) dom.iconColorModeSelect.value = mode;
    const hideColors = mode === "standard";
    if (dom.iconSingleGroup) dom.iconSingleGroup.classList.toggle("hidden", hideColors || mode !== "single");
    if (dom.iconBiColorGroup) dom.iconBiColorGroup.classList.toggle("hidden", hideColors || mode !== "bi");
    if (dom.iconPerSuitGroup) dom.iconPerSuitGroup.classList.toggle("hidden", hideColors || mode !== "perSuit");
  };

  if (dom.iconColorModeSelect) {
    dom.iconColorModeSelect.addEventListener("change", () => {
      settings.iconColorMode = dom.iconColorModeSelect.value;
      syncColorGroups();
      render();
    });
  }

  const onBeforeSample = () => render();

  bindColorPicker({
    input: dom.iconColorInput,
    button: dom.iconColorEyedropper,
    onChange: value => {
      settings.iconColor = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorBlackInput,
    button: dom.iconColorBlackEyedropper,
    onChange: value => {
      settings.iconColorBlack = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorRedInput,
    button: dom.iconColorRedEyedropper,
    onChange: value => {
      settings.iconColorRed = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorSpadesInput,
    button: dom.iconColorSpadesEyedropper,
    onChange: value => {
      settings.iconColorSpades = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorHeartsInput,
    button: dom.iconColorHeartsEyedropper,
    onChange: value => {
      settings.iconColorHearts = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorClubsInput,
    button: dom.iconColorClubsEyedropper,
    onChange: value => {
      settings.iconColorClubs = value;
      render();
    },
    onBeforeSample
  });

  bindColorPicker({
    input: dom.iconColorDiamondsInput,
    button: dom.iconColorDiamondsEyedropper,
    onChange: value => {
      settings.iconColorDiamonds = value;
      render();
    },
    onBeforeSample
  });

  syncColorGroups();

  /* ================================================================
     ICON OPACITY
     ================================================================ */
  dom.iconOpacityInput.addEventListener("input", () => {
    settings.iconOpacity = Number(dom.iconOpacityInput.value);
    markDirty();
    render();
  });

  /* ================================================================
     ICON SCALE
     ================================================================ */
  dom.iconScaleInput.addEventListener("input", () => {
    settings.iconScale = Number(dom.iconScaleInput.value);
    markDirty();
    render();
  });

  dom.iconOverlayTypeSelect.addEventListener("change", () => {
    settings.iconOverlayType = dom.iconOverlayTypeSelect.value;
    markDirty();
    render();
  });

  dom.iconOverlayOpacityInput.addEventListener("input", () => {
    settings.iconOverlayOpacity = Number(dom.iconOverlayOpacityInput.value);
    markDirty();
    render();
  });

  dom.iconOverlayBlurInput.addEventListener("input", () => {
    settings.iconOverlayBlur = Number(dom.iconOverlayBlurInput.value);
    markDirty();
    render();
  });

  dom.iconShadowOffsetXInput.addEventListener("input", () => {
    settings.iconShadowOffsetX = Number(dom.iconShadowOffsetXInput.value);
    markDirty();
    render();
  });

  dom.iconShadowOffsetYInput.addEventListener("input", () => {
    settings.iconShadowOffsetY = Number(dom.iconShadowOffsetYInput.value);
    markDirty();
    render();
  });

  dom.iconOutlineCheckbox.addEventListener("change", () => {
    settings.iconOutline = dom.iconOutlineCheckbox.checked;
    markDirty();
    render();
  });

  dom.iconOutlineWidthInput.addEventListener("input", () => {
    settings.iconOutlineWidth = Number(dom.iconOutlineWidthInput.value);
    markDirty();
    render();
  });

  dom.iconOutlinePositionSelect.addEventListener("change", () => {
    settings.iconOutlinePosition = dom.iconOutlinePositionSelect.value;
    markDirty();
    render();
  });

  dom.iconOutlineColorInput.addEventListener("input", () => {
    settings.iconOutlineColor = dom.iconOutlineColorInput.value;
    markDirty();
    render();
  });
}

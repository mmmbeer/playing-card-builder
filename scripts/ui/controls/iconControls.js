// ui/controls/iconControls.js
import { markDirty } from "../../autosave.js";
import { loadPreset } from "../presets.js"; // we expose this in presets.js

export function initIconControls(dom, settings, render) {

  /* ================================================================
     BUILT-IN PRESET SELECTION
     ================================================================ */
  dom.iconPresetSelect.addEventListener("change", async () => {
    const presetId = dom.iconPresetSelect.value;

    // User selected a built-in preset
    if (presetId && presetId !== "custom") {
      settings.iconPresetId = presetId;
      settings.customIconDataURL = null;       // clear custom image

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

      // Save as DataURL so custom sheet restores later
      const customURL = await convertImageToDataURL(img);
      settings.customIconDataURL = customURL;

      markDirty();
      render();
    };

    img.src = url;
  });


  /* ================================================================
     ICON COLOR
     ================================================================ */
  dom.iconColorInput.addEventListener("input", () => {
    settings.iconColor = dom.iconColorInput.value;
    markDirty();
    render();
  });

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
}



/* ================================================================
   UTILITY: convert Image → DataURL for autosave
   ================================================================ */
async function convertImageToDataURL(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL("image/png");
}

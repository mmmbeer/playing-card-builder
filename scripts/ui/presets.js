// ui/presets.js
import { ICON_PRESETS } from "../config.js";
import { deck } from "../state.js";
import { markDirty } from "../autosave.js";

/* ================================================================
   MODULE-LEVEL ASYNC PRESET LOADER
   ================================================================ */
export async function loadPreset(id) {
  const preset = ICON_PRESETS.find(p => p.id === id);
  if (!preset) return null;

  const img = new Image();
  img.src = preset.file;

  await img.decode();   // ensure fully loaded

  return img;           // caller assigns to settings.iconSheet
}


/* ================================================================
   INIT ICON PRESETS
   ================================================================ */
export function initIconPresets(dom, settings, render) {

  /* ----------------------------
     BUILD PRESET SELECT OPTIONS
     ---------------------------- */
  dom.iconPresetSelect.innerHTML = "";

  ICON_PRESETS.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    dom.iconPresetSelect.appendChild(opt);
  });

  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Custom upload…";
  dom.iconPresetSelect.appendChild(customOpt);


  /* ----------------------------
     SAFE RENDER
     ---------------------------- */
  function safeRender() {
    const suit = dom.suitSelect?.value;
    const rank = dom.rankSelect?.value;

    if (!suit || !rank) return;
    if (!deck[suit] || !deck[suit][rank]) return;

    const ctx = dom.canvas.getContext("2d");
    render(ctx, suit, rank);
  }


  /* ----------------------------
     PRESET SELECTION HANDLER
     ---------------------------- */
  dom.iconPresetSelect.addEventListener("change", async () => {
    const val = dom.iconPresetSelect.value;

    // Built-in preset selected
    if (val !== "custom") {
      settings.iconPresetId = val;
      settings.customIconDataURL = null;

      const img = await loadPreset(val);
      if (img) {
        settings.iconSheet = img;
        markDirty();
        safeRender();
      }
      return;
    }

    // Custom chosen (upload will supply sheet)
    settings.iconPresetId = null;
    markDirty();
  });


  /* ----------------------------
     INITIAL RESTORE BEHAVIOR
     ---------------------------- */

  // 1) Custom upload restored
  if (settings.customIconDataURL) {
    dom.iconPresetSelect.value = "custom";
    // Icon sheet restored elsewhere (initUI -> restoreIconSheet)
    return;
  }

  // 2) Built-in preset restored
  if (settings.iconPresetId && settings.iconPresetId !== "custom") {
    dom.iconPresetSelect.value = settings.iconPresetId;

    loadPreset(settings.iconPresetId).then(img => {
      if (img) {
        settings.iconSheet = img;
        safeRender();
      }
    });

    return;
  }

  // 3) No restore info → load first preset
  if (ICON_PRESETS.length > 0) {
    const first = ICON_PRESETS[0].id;
    dom.iconPresetSelect.value = first;

    loadPreset(first).then(img => {
      if (img) {
        settings.iconSheet = img;
        safeRender();
      }
    });
  }
}

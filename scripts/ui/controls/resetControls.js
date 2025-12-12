import { ICON_PRESETS } from "../../config.js";
import { resetAllState } from "../../autosave.js";
import { resetSettingsToDefaults } from "../../state.js";
import { loadPreset } from "../presets.js";

const FONT_KEYS = [
  "fontFamily",
  "fontWeight",
  "fontSize",
  "fontColorMode",
  "fontColor",
  "fontColorRed",
  "fontColorBlack",
  "fontColorSpades",
  "fontColorHearts",
  "fontColorClubs",
  "fontColorDiamonds",
  "fontOpacity",
  "overlayType",
  "outline",
  "outlineWidth",
  "outlineColor",
  "abilityTextColor",
  "abilityTextOpacity"
];

const PIP_KEYS = [
  "pipTop",
  "pipInnerTop",
  "pipCenter",
  "pipInnerBottom",
  "pipBottom",
  "pipLeft",
  "pipRight",
  "pipCenterX",
  "showPips",
  "safeZoneInset",
  "layout",
  "mirrorDefault"
];

const CORNER_KEYS = [
  "cornerRankOffsetX",
  "cornerRankOffsetY",
  "cornerSuitOffsetX",
  "cornerSuitOffsetY"
];

const ICON_KEYS = [
  "iconColorMode",
  "iconColor",
  "iconColorRed",
  "iconColorBlack",
  "iconColorSpades",
  "iconColorHearts",
  "iconColorClubs",
  "iconColorDiamonds",
  "iconOpacity",
  "iconScale",
  "iconSheet",
  "iconPresetId",
  "customIconImageId"
];

const ABILITY_KEYS = [
  "abilityPlacement",
  "abilityMirror",
  "abilityAlignment",
  "abilityWidthPercent",
  "abilityHeightMode",
  "abilityFixedHeight",
  "abilityOverflow",
  "abilityBackground",
  "abilityBackgroundOpacity",
  "abilityHeaderFontFamily",
  "abilityHeaderFontWeight",
  "abilityHeaderFontSize",
  "abilityBodyFontFamily",
  "abilityBodyFontWeight",
  "abilityBodyFontSize",
  "abilityTextColor",
  "abilityTextOpacity"
];

async function applyDefaultIconPreset(settings) {
  const firstPreset = ICON_PRESETS[0];
  if (!firstPreset) return;
  const img = await loadPreset(firstPreset.id);
  if (img) {
    settings.iconPresetId = firstPreset.id;
    settings.customIconImageId = null;
    settings.iconSheet = img;
  }
}

export function initResetControls(dom, settings, { render, sync, refreshRanks }) {
  const safeRender = typeof render === "function" ? render : () => {};
  const safeSync = typeof sync === "function" ? sync : () => {};
  const safeRefreshRanks = typeof refreshRanks === "function" ? refreshRanks : () => {};
  const refreshUI = () => window.dispatchEvent(new CustomEvent("refreshUIFromSettings"));

  dom.resetFontsButton?.addEventListener("click", () => {
    resetSettingsToDefaults(FONT_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.resetPipsButton?.addEventListener("click", () => {
    resetSettingsToDefaults(PIP_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.resetCornersButton?.addEventListener("click", () => {
    resetSettingsToDefaults(CORNER_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.resetIconsButton?.addEventListener("click", async () => {
    resetSettingsToDefaults(ICON_KEYS);
    await applyDefaultIconPreset(settings);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.resetAbilityButton?.addEventListener("click", () => {
    resetSettingsToDefaults(ABILITY_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.fullResetButton?.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Factory reset will clear autosaves and uploaded images. Continue?"
    );
    if (!confirmed) return;

    await resetAllState();
    await applyDefaultIconPreset(settings);
    safeRefreshRanks(false);
    safeSync();
    safeRender();
    refreshUI();
  });
}

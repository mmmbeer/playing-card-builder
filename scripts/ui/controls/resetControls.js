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

  const safeShowFullResetModal = () => dom.fullResetModal?.classList.remove("hidden");
  const safeHideFullResetModal = () => dom.fullResetModal?.classList.add("hidden");

  const bindReset = (button, handler) => {
    if (!button) return;
    button.addEventListener("click", event => {
      event.stopPropagation();
      handler();
    });
  };

  bindReset(dom.resetFontsButton, () => {
    resetSettingsToDefaults(FONT_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  bindReset(dom.resetPipsButton, () => {
    resetSettingsToDefaults(PIP_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  bindReset(dom.resetCornersButton, () => {
    resetSettingsToDefaults(CORNER_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  bindReset(dom.resetIconsButton, async () => {
    resetSettingsToDefaults(ICON_KEYS);
    await applyDefaultIconPreset(settings);
    safeSync();
    safeRender();
    refreshUI();
  });

  bindReset(dom.resetAbilityButton, () => {
    resetSettingsToDefaults(ABILITY_KEYS);
    safeSync();
    safeRender();
    refreshUI();
  });

  dom.fullResetButton?.addEventListener("click", event => {
    event.stopPropagation();
    safeShowFullResetModal();
  });

  dom.cancelFullResetButton?.addEventListener("click", event => {
    event.stopPropagation();
    safeHideFullResetModal();
  });

  dom.fullResetModal?.addEventListener("click", event => {
    if (event.target === dom.fullResetModal) {
      safeHideFullResetModal();
    }
  });

  dom.confirmFullResetButton?.addEventListener("click", async event => {
    event.stopPropagation();
    try {
      await resetAllState();
      await applyDefaultIconPreset(settings);
      safeRefreshRanks(false);
      safeSync();
      safeRender();
      refreshUI();
    } finally {
      safeHideFullResetModal();
    }
  });
}

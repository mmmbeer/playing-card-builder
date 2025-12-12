// ui/index.js




import { dom } from "./domRefs.js";
import { syncControls } from "./sync.js";
import { initCanvasDrag } from "./canvasInteractions.js";
import { initIconPresets, loadPreset } from "./presets.js";

import { initSuitControls } from "./controls/suitControls.js";
import { initRankControls } from "./controls/rankControls.js";
import { initLayoutControls } from "./controls/layoutControls.js";
import { initFontControls } from "./controls/fontControls.js";
import { initIconControls } from "./controls/iconControls.js";
import { initFaceControls } from "./controls/faceControls.js";
import { initPipControls } from "./controls/pipControls.js";
import { initGuidelineControls } from "./controls/guidelineControls.js";
import { initJokerControls } from "./controls/jokerControls.js";
import { initMirrorControls } from "./controls/mirrorControls.js";
import { initCornerOffsetControls } from "./controls/cornerOffsetControls.js";
import { initDownloadControls } from "./controls/downloadControls.js";
import { initNavControls } from "./controls/navControls.js";
import {
  JOKER_SUIT_ID,
  decodeRankValue,
  encodeRankValue,
  enumerateRankSlots
} from "./navigation.js";

import { initProgressControls } from "./controls/progressControls.js";
import { initProgressOverlay } from "./controls/progressOverlay.js";
import { initAbilityControls } from "./controls/abilityControls.js";
import { initBackgroundControls } from "./controls/backgroundControls.js";




import {
  settings,
  activeRanks,
  initDeck,
  updateActiveRanksFromSettings,
  getCurrentCard,
  ensureJokerCards,
  getJokerCard
} from "../state.js";

import {
  renderCardForPreview,
  renderJokerCard
} from "../drawing.js";

import { openFontBrowser, initFontBrowser } from "../fonts.js";

import { exportFullDeck } from "../save.js";
import { openBulkModal, initBulkLoader } from "../bulk.js";

import { CARD_WIDTH, CARD_HEIGHT, BLEED, SAFE_WIDTH, SAFE_HEIGHT, SUITS } from "../config.js";
import { registerSamplingCanvas } from "./colorSampler.js";


// ---------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ---------------------------------------------------------------------
export async function initUI() {
	// Repair domRefs for elements that were null at module-load time
    dom.fontFamilyInput = document.getElementById("fontFamilyInput");


  //
  // ---------- INITIALIZATION ----------
  //
  initDeck();
  initBulkLoader();
  updateActiveRanksFromSettings();
  initProgressOverlay();
  registerSamplingCanvas(dom.canvas);

  if (!dom.suitSelect.value) dom.suitSelect.value = settings.lastSuitId ?? (SUITS[0]?.id || "");



  //
  // 1. Hydrate UI BEFORE any controls or presets initialize
  //
  hydrateUIFromSettings();


  //
  // 2. Restore saved icon sheet (custom or preset)
  //
  await restoreIconSheet();


  //
  // 3. Update canvas metadata
  //
  updateCanvasMetadata();




  //
  // ---------- CONTROL GROUPS ----------
  // NOW it is safe to initialize all controls because
  // hydration + preset restoration has already populated UI
  //

  initSuitControls(dom, stateCtx(), renderSelectedCard, doSync, () => refreshRankDropdown(false));
  initRankControls(dom, stateCtx(), refreshRankDropdown, doSync, renderSelectedCard);
  initLayoutControls(dom, settings, renderSelectedCard);
  initBackgroundControls(dom, settings, renderSelectedCard);

  // Font controls MUST be initialized AFTER hydration
  dom.fontFamilyInput = document.getElementById("fontFamilyInput");

  initFontControls(dom, settings, renderSelectedCard, openFontBrowser);

    initIconControls(dom, settings, renderSelectedCard);
  initPipControls(dom, settings, renderSelectedCard);
  initGuidelineControls(dom, settings, renderSelectedCard);
  initJokerControls(dom, settings, handleJokerSettingsChange);
  initMirrorControls(dom, getCurrent, settings, renderSelectedCard);
  initCornerOffsetControls(dom, settings, renderSelectedCard);
  initAbilityControls(dom, settings, getCurrent, renderSelectedCard);

  initDownloadControls(dom, () => getSelection());

  // Save/Import progress (ZIP wrapper around the autosave payload)
  initProgressControls();

  initNavControls(dom, stateCtx, applyNewCard, doSync, renderSelectedCard);
  initCollapsibles();

  
  
  //
  // Initialize font browser (safe now)
  //
  initFontBrowser(dom);



  //
  // ---------- CANVAS INTERACTION ----------
  //
  initCanvasDrag(dom, getCurrent, renderCurrentCard);


  //
  // ---------- BULK UPLOAD ----------
  //
  dom.bulkUploadBadge.addEventListener("click", () =>
    openBulkModal(renderCurrentCard)
  );


  //
  // ---------- EXPORT FULL DECK ----------
  //
  dom.exportDeckButton.addEventListener("click", () =>
    exportFullDeck().catch(err => {
      console.error(err);
      alert("Error exporting deck. See console for details.");
    })
  );


  //
  // ---------- PRESETS + RANK DROPDOWN ----------
  //
  initIconPresets(dom, settings, renderSelectedCard);
  refreshRankDropdown();


  //
  // ---------- VALIDATE CURRENT SUIT/RANK ----------
  //
  if (!dom.suitSelect.value) {
    dom.suitSelect.value = SUITS[0].id;
  }
  if (!dom.rankSelect.value && activeRanks.length > 0) {
    refreshRankDropdown(false);
  }
  
  
    initFaceControls(dom, settings, getCurrent, doSync, renderSelectedCard);



  //
  // ---------- SYNC + INITIAL RENDER ----------
  //
  doSync();
  // Initial render will occur after WebFont.load active callback
  // (set in hydrateUIFromSettings)
  // Do NOT render explicitly here
  // renderSelectedCard(...)
  


  // -------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------

  async function restoreIconSheet() {
    // Custom uploaded sprite sheet
    if (settings.customIconDataURL) {
      const img = new Image();
      img.src = settings.customIconDataURL;
      await img.decode();
      settings.iconSheet = img;
      dom.iconPresetSelect.value = "custom";
      return;
    }

    // Built-in preset restored
    if (settings.iconPresetId) {
      dom.iconPresetSelect.value = settings.iconPresetId;
      const img = await loadPreset(settings.iconPresetId);
      if (img) settings.iconSheet = img;
    }
  }


  function hydrateUIFromSettings() {
    // ---- Custom Ranks ----
    if (dom.customRanksInput) {
      dom.customRanksInput.value = settings.customRanksString || "";
    }

    if (dom.includeJokersCheckbox) dom.includeJokersCheckbox.checked = !!settings.includeJokers;
    if (dom.jokerCountInput) dom.jokerCountInput.value = settings.jokerCount;
    if (dom.jokerLabelInput) dom.jokerLabelInput.value = settings.jokerLabel;
    if (dom.jokerWildCheckbox) dom.jokerWildCheckbox.checked = !!settings.jokerWild;
    if (dom.jokerLabelOrientationSelect) dom.jokerLabelOrientationSelect.value = settings.jokerLabelOrientation;
    if (dom.jokerFontSizeInput) dom.jokerFontSizeInput.value = settings.jokerFontSize;
    if (dom.jokerSuitStyleSelect) dom.jokerSuitStyleSelect.value = settings.jokerSuitStyle;

    // ---- Font UI Fields ----
    if (dom.fontFamilyInput) dom.fontFamilyInput.textContent = settings.fontFamily;
    if (dom.fontSizeInput) dom.fontSizeInput.value = settings.fontSize;
    if (dom.fontWeightSelect) dom.fontWeightSelect.value = settings.fontWeight;
    if (dom.fontColorModeSelect) dom.fontColorModeSelect.value = settings.fontColorMode || "single";
    if (dom.fontColorInput) dom.fontColorInput.value = settings.fontColor;
    if (dom.fontColorBlackInput) dom.fontColorBlackInput.value = settings.fontColorBlack;
    if (dom.fontColorRedInput) dom.fontColorRedInput.value = settings.fontColorRed;
    if (dom.fontColorSpadesInput) dom.fontColorSpadesInput.value = settings.fontColorSpades;
    if (dom.fontColorHeartsInput) dom.fontColorHeartsInput.value = settings.fontColorHearts;
    if (dom.fontColorClubsInput) dom.fontColorClubsInput.value = settings.fontColorClubs;
    if (dom.fontColorDiamondsInput) dom.fontColorDiamondsInput.value = settings.fontColorDiamonds;
    if (dom.fontSingleGroup) dom.fontSingleGroup.classList.toggle("hidden", (settings.fontColorMode || "single") !== "single");
    if (dom.fontBiColorGroup) dom.fontBiColorGroup.classList.toggle("hidden", (settings.fontColorMode || "single") !== "bi");
    if (dom.fontPerSuitGroup) dom.fontPerSuitGroup.classList.toggle("hidden", (settings.fontColorMode || "single") !== "perSuit");
    if (dom.fontOpacityInput) dom.fontOpacityInput.value = settings.fontOpacity;

    if (dom.overlayTypeSelect) dom.overlayTypeSelect.value = settings.overlayType;

    if (dom.outlineCheckbox) dom.outlineCheckbox.checked = settings.outline;
    if (dom.outlineWidthInput) dom.outlineWidthInput.value = settings.outlineWidth;
    if (dom.outlineColorInput) dom.outlineColorInput.value = settings.outlineColor;

    // ---- Ability Text ----
    if (dom.abilityPlacementSelect) dom.abilityPlacementSelect.value = settings.abilityPlacement;
    if (dom.abilityMirrorCheckbox) dom.abilityMirrorCheckbox.checked = settings.abilityMirror;
    if (dom.abilityAlignmentSelect) dom.abilityAlignmentSelect.value = settings.abilityAlignment;
    if (dom.abilityWidthInput) dom.abilityWidthInput.value = settings.abilityWidthPercent;
    if (dom.abilityHeightModeSelect) dom.abilityHeightModeSelect.value = settings.abilityHeightMode;
    if (dom.abilityFixedHeightInput) dom.abilityFixedHeightInput.value = settings.abilityFixedHeight;
    if (dom.abilityOverflowSelect) dom.abilityOverflowSelect.value = settings.abilityOverflow;
    if (dom.abilityBackgroundInput) dom.abilityBackgroundInput.value = settings.abilityBackground;
    if (dom.abilityBackgroundOpacityInput) dom.abilityBackgroundOpacityInput.value = settings.abilityBackgroundOpacity;
    if (dom.abilityHeaderFontLabel) dom.abilityHeaderFontLabel.textContent = settings.abilityHeaderFontFamily;
    if (dom.abilityBodyFontLabel) dom.abilityBodyFontLabel.textContent = settings.abilityBodyFontFamily;
    if (dom.abilityHeaderFontSizeInput) dom.abilityHeaderFontSizeInput.value = settings.abilityHeaderFontSize;
    if (dom.abilityBodyFontSizeInput) dom.abilityBodyFontSizeInput.value = settings.abilityBodyFontSize;
    if (dom.abilityHeaderFontWeightSelect) dom.abilityHeaderFontWeightSelect.value = settings.abilityHeaderFontWeight;
    if (dom.abilityBodyFontWeightSelect) dom.abilityBodyFontWeightSelect.value = settings.abilityBodyFontWeight;
    if (dom.abilityTextColorInput) dom.abilityTextColorInput.value = settings.abilityTextColor;
    if (dom.abilityTextOpacityInput) dom.abilityTextOpacityInput.value = settings.abilityTextOpacity;

    // ---- Layout Controls ----
    document
      .querySelector(`[data-layout="${settings.layout}"]`)
      ?.classList.add("active");

    if (dom.showPipsCheckbox) dom.showPipsCheckbox.checked = settings.showPips;
    if (dom.mirrorDefaultCheckbox) dom.mirrorDefaultCheckbox.checked = settings.mirrorDefault;
    if (dom.backgroundStyleSelect) dom.backgroundStyleSelect.value = settings.backgroundStyle || "solid";
    if (dom.backgroundPrimaryInput) dom.backgroundPrimaryInput.value = settings.backgroundColorPrimary;
    if (dom.backgroundSecondaryInput) dom.backgroundSecondaryInput.value = settings.backgroundColorSecondary;
    if (dom.backgroundSecondaryGroup) dom.backgroundSecondaryGroup.classList.toggle("hidden", (settings.backgroundStyle || "solid") === "solid");

    // ---- Corner Offsets ----
    dom.rankOffsetXInput.value = settings.cornerRankOffsetX;
    dom.rankOffsetYInput.value = settings.cornerRankOffsetY;
    dom.suitOffsetXInput.value = settings.cornerSuitOffsetX;
    dom.suitOffsetYInput.value = settings.cornerSuitOffsetY;

    // ---- Pip Verticals ----
    const topVal = Math.round(settings.pipTop * 100);
    const innerTopVal = Math.round(settings.pipInnerTop * 100);
    const centerVal = Math.round(settings.pipCenter * 100);
    const innerBottomVal = Math.round(settings.pipInnerBottom * 100);
    const bottomVal = Math.round(settings.pipBottom * 100);

    dom.pipTopInput.value = topVal;
    dom.pipInnerTopInput.value = innerTopVal;
    dom.pipCenterInput.value = centerVal;
    dom.pipInnerBottomInput.value = innerBottomVal;
    dom.pipBottomInput.value = bottomVal;

    if (dom.pipTopValue) dom.pipTopValue.textContent = topVal;
    if (dom.pipInnerTopValue) dom.pipInnerTopValue.textContent = innerTopVal;
    if (dom.pipCenterValue) dom.pipCenterValue.textContent = centerVal;
    if (dom.pipInnerBottomValue) dom.pipInnerBottomValue.textContent = innerBottomVal;
    if (dom.pipBottomValue) dom.pipBottomValue.textContent = bottomVal;

    // ---- Icon Controls ----
    if (dom.iconColorModeSelect) dom.iconColorModeSelect.value = settings.iconColorMode || "single";
    if (dom.iconColorInput) dom.iconColorInput.value = settings.iconColor;
    if (dom.iconColorBlackInput) dom.iconColorBlackInput.value = settings.iconColorBlack;
    if (dom.iconColorRedInput) dom.iconColorRedInput.value = settings.iconColorRed;
    if (dom.iconColorSpadesInput) dom.iconColorSpadesInput.value = settings.iconColorSpades;
    if (dom.iconColorHeartsInput) dom.iconColorHeartsInput.value = settings.iconColorHearts;
    if (dom.iconColorClubsInput) dom.iconColorClubsInput.value = settings.iconColorClubs;
    if (dom.iconColorDiamondsInput) dom.iconColorDiamondsInput.value = settings.iconColorDiamonds;
    if (dom.iconSingleGroup) dom.iconSingleGroup.classList.toggle("hidden", (settings.iconColorMode || "single") !== "single");
    if (dom.iconBiColorGroup) dom.iconBiColorGroup.classList.toggle("hidden", (settings.iconColorMode || "single") !== "bi");
    if (dom.iconPerSuitGroup) dom.iconPerSuitGroup.classList.toggle("hidden", (settings.iconColorMode || "single") !== "perSuit");
    dom.iconOpacityInput.value = settings.iconOpacity;
    dom.iconScaleInput.value = settings.iconScale;

    // ---- FONT LOADING ----
    if (settings.fontFamily) {
      WebFont.load({
        google: { families: [settings.fontFamily] },
        active: () => renderSelectedCard()
      });

      if (dom.fontFamilyInput) {
        dom.fontFamilyInput.textContent = settings.fontFamily;
      }
    }

    const abilityFonts = [settings.abilityHeaderFontFamily, settings.abilityBodyFontFamily]
      .filter(Boolean);
    if (abilityFonts.length) {
      WebFont.load({
        google: { families: abilityFonts },
        active: () => renderSelectedCard()
      });
    }

    syncJokerSuitOption();
  }


  function updateCanvasMetadata() {
    const sizeEl = document.getElementById("canvasSizeInfo");
    const safeEl = document.getElementById("safeZoneInfo");

    if (sizeEl) sizeEl.textContent = `${CARD_WIDTH} × ${CARD_HEIGHT}`;
    if (safeEl) safeEl.textContent = `${SAFE_WIDTH} × ${SAFE_HEIGHT}`;
  }


  function getCurrent() {
    const selection = getSelection();
    if (selection.isJoker) return getJokerCard(selection.jokerIndex);
    return getCurrentCard(selection.suitId, selection.rank, selection.copyIndex);
  }


  function stateCtx() {
    const selection = getSelection();
    return {
      currentSuitId: selection.suitId,
      currentRank: selection.rank,
      currentCopyIndex: selection.copyIndex,
      currentIsJoker: selection.isJoker,
      currentJokerIndex: selection.jokerIndex,
      activeRanks,
      SUITS,
      includeJokers: settings.includeJokers,
      jokerCount: settings.jokerCount
    };
  }


  function applyNewCard(card) {
    if (card.isJoker) {
      syncJokerSuitOption();
      dom.suitSelect.value = JOKER_SUIT_ID;
      refreshRankDropdown(false);
      dom.rankSelect.value = encodeJokerValue(card.jokerIndex);
      return;
    }

    dom.suitSelect.value = card.suit;
    refreshRankDropdown(false);
    dom.rankSelect.value = encodeRankValue(card.rank, card.copyIndex ?? 1);
  }


  function refreshRankDropdown(shouldUpdateRanks = true) {
    if (shouldUpdateRanks) updateActiveRanksFromSettings();

    syncJokerSuitOption();

    const suitId = dom.suitSelect.value;
    const prevValue = dom.rankSelect.value;
    dom.rankSelect.innerHTML = "";

    if (suitId === JOKER_SUIT_ID) {
      const count = clampJokerCount(settings.jokerCount);
      for (let i = 1; i <= count; i++) {
        const opt = document.createElement("option");
        opt.value = encodeJokerValue(i);
        opt.textContent = count > 1 ? `${settings.jokerLabel || "JOKER"} ${i}` : settings.jokerLabel || "JOKER";
        dom.rankSelect.appendChild(opt);
      }

      dom.rankSelect.value = prevValue && prevValue.startsWith("joker-")
        ? prevValue
        : encodeJokerValue(1);

      return;
    }

    const slots = enumerateRankSlots(activeRanks);
    const options = slots.map(slot => ({
      value: encodeRankValue(slot.rank, slot.copyIndex),
      label: slot.total > 1 ? `${slot.rank} (${slot.copyIndex}/${slot.total})` : slot.rank
    }));

    options.forEach(opt => {
      const node = document.createElement("option");
      node.value = opt.value;
      node.textContent = opt.label;
      dom.rankSelect.appendChild(node);
    });

    const targetValue = options.find(o => o.value === prevValue)?.value || options[0]?.value;
    if (targetValue) dom.rankSelect.value = targetValue;
  }


  function doSync() {
    syncControls(getCurrent(), settings, dom);
  }


  function getSelection() {
    const suitId = dom.suitSelect.value || SUITS[0]?.id;

    if (suitId === JOKER_SUIT_ID) {
      const jokerIndex = decodeJokerValue(dom.rankSelect.value);
      return { suitId, rank: null, copyIndex: 1, isJoker: true, jokerIndex };
    }

    const defaultRank = activeRanks[0] ?? "";
    const fallbackValue = defaultRank ? encodeRankValue(defaultRank, 1) : "";
    const value = dom.rankSelect.value || fallbackValue;
    const { rank, copyIndex } = decodeRankValue(value || "__1");

    return { suitId, rank, copyIndex, isJoker: false, jokerIndex: null };
  }


  function encodeJokerValue(index) {
    return `joker-${index}`;
  }


  function decodeJokerValue(value) {
    const num = Number((value || "").split("-")[1]);
    return num >= 1 ? num : 1;
  }


  function clampJokerCount(n) {
    if (!n || n < 1) return 1;
    if (n > 8) return 8;
    return n;
  }


  function syncJokerSuitOption() {
    const option = dom.suitSelect.querySelector(`option[value="${JOKER_SUIT_ID}"]`);
    const shouldShow = settings.includeJokers && clampJokerCount(settings.jokerCount) > 0;

    if (shouldShow && !option) {
      const opt = document.createElement("option");
      opt.value = JOKER_SUIT_ID;
      opt.textContent = "Jokers";
      dom.suitSelect.appendChild(opt);
    }

    if (!shouldShow && option) {
      const isSelected = dom.suitSelect.value === JOKER_SUIT_ID;
      option.remove();
      if (isSelected) {
        dom.suitSelect.value = SUITS[0]?.id || "";
      }
    }
  }


  function renderSelectedCard() {
    const selection = getSelection();
    const canvas = document.getElementById("cardCanvas");
    const ctx = canvas.getContext("2d");

    if (selection.isJoker) {
      renderJokerCard(ctx, selection.jokerIndex, { preview: true });
      return;
    }

    if (!selection.rank) return;

    renderCardForPreview(ctx, selection.suitId, selection.rank, selection.copyIndex, true);
  }


  function handleJokerSettingsChange() {
    ensureJokerCards();
    syncJokerSuitOption();
    refreshRankDropdown(false);
    doSync();
    renderSelectedCard();
  }


  function initCollapsibles() {
    const headers = document.querySelectorAll(".panel-header.collapsible");
    headers.forEach(header => {
      header.addEventListener("click", () => {
        const panel = header.parentElement;
        panel.classList.toggle("collapsed");

        const chevron = header.querySelector(".chevron");
        if (chevron) chevron.classList.toggle("rotated");
      });
    });
  }
window.addEventListener("forceSyncAndRender", () => {
  doSync();
  renderSelectedCard();
});
}



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

import { initProgressControls } from "./controls/progressControls.js";
import { initProgressOverlay } from "./controls/progressOverlay.js";




import {
  settings,
  activeRanks,
  initDeck,
  updateActiveRanksFromSettings,
  getCurrentCard
} from "../state.js";

import {
  renderCardForPreview as renderCurrentCard
} from "../drawing.js";

import { openFontBrowser, initFontBrowser } from "../fonts.js";

import { exportFullDeck } from "../save.js";
import { openBulkModal, initBulkLoader } from "../bulk.js";

import { CARD_WIDTH, CARD_HEIGHT, BLEED, SAFE_WIDTH, SAFE_HEIGHT, SUITS } from "../config.js";

// Restore original default behavior
if (!dom.suitSelect.value) dom.suitSelect.value = settings.lastSuitId ?? "spades";
if (!dom.rankSelect.value) dom.rankSelect.value = settings.lastRank ?? activeRanks[0];


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

  initSuitControls(dom, stateCtx(), doSync, renderCurrentCard);
  initRankControls(dom, stateCtx(), refreshRankDropdown, doSync, renderCurrentCard);
  initLayoutControls(dom, settings, renderCurrentCard);
  
  // Font controls MUST be initialized AFTER hydration
  dom.fontFamilyInput = document.getElementById("fontFamilyInput");

  initFontControls(dom, settings, renderCurrentCard, openFontBrowser);

    initIconControls(dom, settings, renderCurrentCard);
  initPipControls(dom, settings, renderCurrentCard);
  initGuidelineControls(dom, settings, renderCurrentCard);
  initJokerControls(dom, settings);
  initMirrorControls(dom, getCurrent, settings, renderCurrentCard);
  initCornerOffsetControls(dom, settings, renderCurrentCard);

  initDownloadControls(dom, () => ({
    suit: stateCtx().currentSuitId,
    rank: stateCtx().currentRank
  }));

  // Save/Import progress (ZIP wrapper around the autosave payload)
  initProgressControls();

  initNavControls(dom, stateCtx, applyNewCard, doSync, renderCurrentCard);
  initCollapsibles();

  
  
  //
  // Initialize font browser (safe now)
  //
  initFontBrowser(dom);
  dom.fontFamilyWrapper.addEventListener("click", () => openFontBrowser(dom));



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
  initIconPresets(dom, settings, renderCurrentCard);
  refreshRankDropdown();


  //
  // ---------- VALIDATE CURRENT SUIT/RANK ----------
  //
  if (!dom.suitSelect.value) {
    dom.suitSelect.value = SUITS[0].id;
  }
  if (!dom.rankSelect.value && activeRanks.length > 0) {
    dom.rankSelect.value = activeRanks[0];
  }
  
  
    initFaceControls(dom, settings, getCurrent, doSync, renderCurrentCard);



  //
  // ---------- SYNC + INITIAL RENDER ----------
  //
  doSync();
  // Initial render will occur after WebFont.load active callback
  // (set in hydrateUIFromSettings)
  // Do NOT render explicitly here
  // renderCurrentCard(...)
  


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

    // ---- Font UI Fields ----
    if (dom.fontFamilyInput) dom.fontFamilyInput.textContent = settings.fontFamily;
    if (dom.fontSizeInput) dom.fontSizeInput.value = settings.fontSize;
    if (dom.fontWeightSelect) dom.fontWeightSelect.value = settings.fontWeight;
    if (dom.fontColorInput) dom.fontColorInput.value = settings.fontColor;
    if (dom.fontOpacityInput) dom.fontOpacityInput.value = settings.fontOpacity;

    if (dom.overlayTypeSelect) dom.overlayTypeSelect.value = settings.overlayType;

    if (dom.outlineCheckbox) dom.outlineCheckbox.checked = settings.outline;
    if (dom.outlineWidthInput) dom.outlineWidthInput.value = settings.outlineWidth;
    if (dom.outlineColorInput) dom.outlineColorInput.value = settings.outlineColor;

    // ---- Layout Controls ----
    document
      .querySelector(`[data-layout="${settings.layout}"]`)
      ?.classList.add("active");

    if (dom.showPipsCheckbox) dom.showPipsCheckbox.checked = settings.showPips;
    if (dom.mirrorDefaultCheckbox) dom.mirrorDefaultCheckbox.checked = settings.mirrorDefault;

    // ---- Corner Offsets ----
    dom.rankOffsetXInput.value = settings.cornerRankOffsetX;
    dom.rankOffsetYInput.value = settings.cornerRankOffsetY;
    dom.suitOffsetXInput.value = settings.cornerSuitOffsetX;
    dom.suitOffsetYInput.value = settings.cornerSuitOffsetY;

    // ---- Pip Verticals ----
    dom.pipTopInput.value = settings.pipTop * 100;
    dom.pipInnerTopInput.value = settings.pipInnerTop * 100;
    dom.pipCenterInput.value = settings.pipCenter * 100;
    dom.pipInnerBottomInput.value = settings.pipInnerBottom * 100;
    dom.pipBottomInput.value = settings.pipBottom * 100;

    // ---- Icon Controls ----
    dom.iconColorInput.value = settings.iconColor;
    dom.iconOpacityInput.value = settings.iconOpacity;
    dom.iconScaleInput.value = settings.iconScale;

    // ---- FONT LOADING ----
    if (settings.fontFamily) {
      WebFont.load({
        google: { families: [settings.fontFamily] },
        active: () => renderCurrentCard()
      });

      if (dom.fontFamilyInput) {
        dom.fontFamilyInput.textContent = settings.fontFamily;
      }
    }
  }


  function updateCanvasMetadata() {
    const sizeEl = document.getElementById("canvasSizeInfo");
    const safeEl = document.getElementById("safeZoneInfo");

    if (sizeEl) sizeEl.textContent = `${CARD_WIDTH} × ${CARD_HEIGHT}`;
    if (safeEl) safeEl.textContent = `${SAFE_WIDTH} × ${SAFE_HEIGHT}`;
  }


  function getCurrent() {
    const suit = stateCtx().currentSuitId;
    const rank = stateCtx().currentRank;
    return getCurrentCard(suit, rank);
  }


  function stateCtx() {
    return {
      currentSuitId: dom.suitSelect.value,
      currentRank: dom.rankSelect.value,
      activeRanks,
      SUITS
    };
  }


  function applyNewCard(suit, rank) {
    dom.suitSelect.value = suit;
    dom.rankSelect.value = rank;
  }


  function refreshRankDropdown() {
    updateActiveRanksFromSettings();
    dom.rankSelect.innerHTML = "";
    activeRanks.forEach(rank => {
      const opt = document.createElement("option");
      opt.value = rank;
      opt.textContent = rank;
      dom.rankSelect.appendChild(opt);
    });
  }


  function doSync() {
    syncControls(getCurrent(), settings, dom);
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
  renderCurrentCard();
});
}



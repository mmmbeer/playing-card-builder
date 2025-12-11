// save.js
// import JSZip from "jszip"; // only works if imported via bundler
// If JSZip is loaded globally via CDN, comment out the line above
// and rely on window.JSZip instead.

import {
  CARD_WIDTH,
  CARD_HEIGHT,
  SAFE_WIDTH,
  SAFE_HEIGHT,
  SUITS
} from "./config.js";

import {
  settings,
  activeRanks,
  getCurrentCard
} from "./state.js";

import {
  renderCardForExport,
  renderJokerCard
} from "./drawing.js";


// -------------------------------------------------------
// Download ONE card (clean, no overlays)
// -------------------------------------------------------
export async function downloadSingleCard(suitId, rank) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  renderCardForExport(ctx, suitId, rank);

  canvas.toBlob(blob => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rank}_${suitId}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}



// -------------------------------------------------------
// Export FULL deck (ZIP of PNG files)
// -------------------------------------------------------
export async function exportFullDeck() {
  const zip = new JSZip();
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = CARD_WIDTH;
  tmpCanvas.height = CARD_HEIGHT;
  const tmpCtx = tmpCanvas.getContext("2d");

  // Standard cards
  for (const suit of SUITS) {
    for (const rank of activeRanks) {
      renderCardForExport(tmpCtx, suit.id, rank);
      const blob = await new Promise(resolve =>
        tmpCanvas.toBlob(resolve, "image/png")
      );
      if (!blob) continue;

      const filename = `${rank}${suit.symbol}.png`;
      zip.file(filename, blob);
    }
  }

  // Jokers
  if (settings.includeJokers && settings.jokerCount > 0) {
    const count = Math.min(Math.max(settings.jokerCount, 1), 8);

    for (let i = 1; i <= count; i++) {
      renderJokerCard(tmpCtx, i, { preview: false });
      const blob = await new Promise(resolve =>
        tmpCanvas.toBlob(resolve, "image/png")
      );
      if (!blob) continue;

      const baseLabel = (settings.jokerLabel || "JOKER").replace(/\s+/g, "");
      const suffix = count > 1 ? `_${i}` : "";
      const filename = `${baseLabel}${suffix}.png`;

      zip.file(filename, blob);
    }
  }

  // Download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "custom-playing-cards.zip";
  a.click();

  URL.revokeObjectURL(url);
}

// save.js
// import JSZip from "jszip"; // only works if imported via bundler
// If JSZip is loaded globally via CDN, comment out the line above
// and rely on window.JSZip instead.

import { SUITS } from "./config.js";
import { getCardMetrics } from "./cardGeometry.js";

import {
  settings,
  activeRanks,
  getCurrentCard
} from "./state.js";

import {
  renderCardForExport,
  renderJokerCard
} from "./drawing.js";
import { JOKER_SUIT_ID } from "./ui/navigation.js";


// -------------------------------------------------------
// Download ONE card (clean, no overlays)
// -------------------------------------------------------
export async function downloadSingleCard(selectionOrSuit, rankMaybe, copyIndexMaybe = 1) {
  const selection = typeof selectionOrSuit === "object" && selectionOrSuit !== null
    ? selectionOrSuit
    : { suitId: selectionOrSuit, rank: rankMaybe, copyIndex: copyIndexMaybe };

  const canvas = document.createElement("canvas");
  const { cardWidth, cardHeight } = getCardMetrics();
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");

  if (selection.suitId === JOKER_SUIT_ID) {
    const jokerIndex = selection.jokerIndex || 1;
    renderJokerCard(ctx, jokerIndex, { preview: false });

    canvas.toBlob(blob => {
      if (!blob) return;

      const baseLabel = (settings.jokerLabel || "JOKER").replace(/\s+/g, "");
      const suffix = (settings.jokerCount || 1) > 1 ? `_${jokerIndex}` : "";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseLabel}${suffix}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");

    return;
  }

  const copyIndex = selection.copyIndex || 1;
  renderCardForExport(ctx, selection.suitId, selection.rank, copyIndex);
  canvas.toBlob(blob => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = copyIndex > 1 ? `_${copyIndex}` : "";
    a.download = `${selection.rank}_${selection.suitId}${suffix}.png`;
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
  const { cardWidth, cardHeight } = getCardMetrics();
  tmpCanvas.width = cardWidth;
  tmpCanvas.height = cardHeight;
  const tmpCtx = tmpCanvas.getContext("2d");

  // Standard cards
  const totalsByRank = activeRanks.reduce((map, rank) => {
    map[rank] = (map[rank] || 0) + 1;
    return map;
  }, {});

  for (const suit of SUITS) {
    const seen = {};
    for (const rank of activeRanks) {
      const copyIndex = (seen[rank] || 0) + 1;
      seen[rank] = copyIndex;

      renderCardForExport(tmpCtx, suit.id, rank, copyIndex);
      const blob = await new Promise(resolve =>
        tmpCanvas.toBlob(resolve, "image/png")
      );
      if (!blob) continue;

      const suffix = totalsByRank[rank] > 1 ? `_${copyIndex}` : "";
      const filename = `${rank}${suit.symbol}${suffix}.png`;
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

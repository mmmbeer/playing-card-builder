import api from "./api.js";
import { renderCardForExport, renderJokerCard } from "../drawing.js";
import { activeRanks, settings } from "../state.js";
import { SUITS } from "../config.js";
import { getCardMetrics } from "../cardGeometry.js";
import { enumerateRankSlots, JOKER_SUIT_ID } from "../ui/navigation.js";

import {
  showProgress,
  updateProgress,
  setProgressOperation,
  finishProgressSuccess,
  finishProgressError,
  isProgressCancelled,
  onProgressCancel
} from "../ui/controls/progressOverlay.js";

let cancelExport = false;
const UPLOAD_CONCURRENCY = 3;

function createRenderTarget() {
  const { cardWidth, cardHeight } = getCardMetrics();
  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  return { canvas, ctx: canvas.getContext("2d") };
}

function canvasToPngBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

export default {

  start(dom, state) {
    cancelExport = false;
    this.begin(dom, state);
  },

  cancel() {
    cancelExport = true;
  },

  /* ------------------------------------------------------------
     MAIN EXPORT PROCESS
  ------------------------------------------------------------ */
  async begin(dom, state) {
    const gameId = api.GID();
    const deckId = dom.deckSelect.value;
    if (!gameId || !deckId) return;

    const items = buildExportItems();

    const total = items.length;
    let index = 0;
    let nextItemIndex = 0;
    const failures = [];

    showProgress({
      total,
      title: "Uploading cards to The Game Crafter…"
    });

    onProgressCancel(() => {
      cancelExport = true;
    });

    const worker = async () => {
      const { canvas, ctx } = createRenderTarget();

      while (!cancelExport && !isProgressCancelled()) {
        const itemIndex = nextItemIndex;
        nextItemIndex += 1;
        const item = items[itemIndex];
        if (!item) return;

        setProgressOperation(item.progressLabel);

        const ok = await this.uploadCard(
          item,
          deckId,
          state.collisionMode,
          canvas,
          ctx
        );

        if (!ok) {
          failures.push(item.failureLabel);
        }

        index++;
        updateProgress(index);
      }
    };

    const workerCount = Math.min(UPLOAD_CONCURRENCY, total);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (cancelExport || isProgressCancelled()) {
      finishProgressError("Upload cancelled.");
      return;
    }

    if (failures.length === 0) {
      finishProgressSuccess("All cards uploaded successfully.");


    } else {
      finishProgressError([
        "Some cards failed to upload:",
        ...failures
      ]);
    }
  },

  /* ------------------------------------------------------------
     UPLOAD ONE CARD
  ------------------------------------------------------------ */
  async uploadCard(item, deckId, decision, canvas, ctx) {
    try {
      if (!canvas || !ctx) return false;
      if (item.isJoker) {
        renderJokerCard(ctx, item.jokerIndex, { preview: false });
      } else {
        renderCardForExport(ctx, item.suit, item.rank, item.copyIndex);
      }

      const suffix = item.total > 1 ? `_${item.copyIndex}` : "";
      const uploadRank = `${normalizeRank(item.rank)}${suffix}`;

      const blob = await canvasToPngBlob(canvas);

      if (!blob) return false;

      const form = new FormData();
      form.append("session_id", api.SID());
      form.append("user_id", api.UID());
      form.append("designer_id", api.DID());
      form.append("deck_id", deckId);
      form.append("card_suit", item.isJoker ? JOKER_SUIT_ID : item.suit);
      form.append("card_rank", uploadRank);
      form.append("collision_mode", decision);
      form.append("file", blob, `${item.suit}-${uploadRank}.png`);

      const res = await fetch(
        "/playing-cards/api/tgc.php?action=upload_card",
        {
          method: "POST",
          body: form
        }
      );

      if (!res.ok) {
        console.error("Upload failed:", await res.text());
        return false;
      }

      const json = await res.json();
      if (json?.error) {
        console.error("TGC error:", json);
        return false;
      }

      return true;

    } catch (err) {
      console.error("Upload exception:", err);
      return false;
    }
  }
};

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function capitalize(v) {
  return String(v)
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function clampJokerCount(n) {
  if (!n || n < 1) return 1;
  if (n > 8) return 8;
  return n;
}

function normalizeRank(rank) {
  return String(rank || "JOKER").replace(/\s+/g, "_");
}

function buildExportItems() {
  const items = [];

  const slots = enumerateRankSlots(activeRanks);

  SUITS.forEach(suit => {
    slots.forEach(slot => {
      const progressRank =
        slot.total > 1
          ? `${slot.rank} (${slot.copyIndex}/${slot.total})`
          : slot.rank;

      items.push({
        isJoker: false,
        suit: suit.id,
        rank: slot.rank,
        copyIndex: slot.copyIndex,
        total: slot.total,
        progressLabel: `Uploading ${capitalize(progressRank)} of ${capitalize(suit.label || suit.id)}`,
        failureLabel: `${slot.rank} of ${suit.label || suit.id}`
      });
    });
  });

  if (settings.includeJokers && settings.jokerCount > 0) {
    const count = clampJokerCount(settings.jokerCount);
    const baseLabel = settings.jokerLabel || "JOKER";

    for (let i = 1; i <= count; i++) {
      const progressRank = count > 1 ? `${baseLabel} ${i}` : baseLabel;

      items.push({
        isJoker: true,
        suit: JOKER_SUIT_ID,
        rank: baseLabel,
        copyIndex: i,
        total: count,
        jokerIndex: i,
        progressLabel: `Uploading ${progressRank} of Jokers`,
        failureLabel: progressRank
      });
    }
  }

  return items;
}

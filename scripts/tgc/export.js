import api from "./api.js";
import { renderCardForExport } from "../drawing.js";
import { activeRanks } from "../state.js";
import { CARD_WIDTH, CARD_HEIGHT } from "../config.js";

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

    const suits = ["spades", "hearts", "clubs", "diamonds"];
    const items = [];

    const totalsByRank = activeRanks.reduce((map, rank) => {
      map[rank] = (map[rank] || 0) + 1;
      return map;
    }, {});

    suits.forEach(suit => {
      const seen = {};
      activeRanks.forEach(rank => {
        const copyIndex = (seen[rank] || 0) + 1;
        seen[rank] = copyIndex;

        items.push({ suit, rank, copyIndex, total: totalsByRank[rank] || 1 });
      });
    });

    const total = items.length;
    let index = 0;
    const failures = [];

    showProgress({
      total,
      title: "Uploading cards to The Game Crafter…"
    });

    onProgressCancel(() => {
      cancelExport = true;
    });

    for (const item of items) {
          if (isProgressCancelled()) break;

          const rankLabel =
                item.total > 1
                  ? `${capitalize(item.rank)} (${item.copyIndex}/${item.total})`
                  : capitalize(item.rank);

          setProgressOperation(
                `Uploading ${rankLabel} of ${capitalize(item.suit)}`
          );

          const ok = await this.uploadCard(
                item.suit,
                item.rank,
                item.copyIndex || 1,
                item.total || 1,
                deckId,
                state.collisionMode
          );

	  if (!ok) {
		failures.push(`${item.rank} of ${item.suit}`);
	  }

	  index++;
	  updateProgress(index);
	}

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
  async uploadCard(suit, rank, copyIndex, totalCopies, deckId, decision) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;

      const ctx = canvas.getContext("2d");
      renderCardForExport(ctx, suit, rank, copyIndex);

      const suffix = totalCopies > 1 ? `_${copyIndex}` : "";
      const uploadRank = `${rank}${suffix}`;

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) return false;

      const form = new FormData();
      form.append("session_id", api.SID());
      form.append("user_id", api.UID());
      form.append("designer_id", api.DID());
      form.append("deck_id", deckId);
      form.append("card_suit", suit);
      form.append("card_rank", uploadRank);
      form.append("collision_mode", decision);
      form.append("file", blob, `${suit}-${uploadRank}.png`);

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

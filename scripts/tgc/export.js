// scripts/tgc/export.js
import api from "./api.js";
import { renderCardForExport } from "../drawing.js";
import { deck, activeRanks } from "../state.js";
import { CARD_WIDTH, CARD_HEIGHT } from "../config.js";

let cancelExport = false;

export default {
  start(dom, state) {
    cancelExport = false;
    this.begin(dom, state);
  },

  cancel() {
    cancelExport = true;
  },

  async begin(dom, state) {
    const gameId = api.GID();
    const deckId = dom.deckSelect.value;
    if (!gameId || !deckId) return;

    dom.modal.classList.add("exporting");
    dom.exportProgressContainer.classList.remove("hidden");
    dom.exportProgressBar.style.width = "0%";

    const suits = ["spades", "hearts", "clubs", "diamonds"];
    const items = [];

    suits.forEach(suit => {
      activeRanks.forEach(rank => {
        items.push({ suit, rank });
      });
    });

    const total = items.length;
    let index = 0;

    for (const item of items) {
      if (cancelExport) break;

      await this.uploadCard(item.suit, item.rank, deckId);

      index++;
      const pct = Math.round((index / total) * 100);
      dom.exportProgressBar.style.width = pct + "%";
    }

    dom.modal.classList.remove("exporting");

    if (!cancelExport) {
      const url = `https://www.thegamecrafter.com/games/${gameId}/decks/${deckId}/cards`;
      dom.exportDoneLink.href = url;
      dom.exportDoneLink.classList.remove("hidden");
    }
  },

  async uploadCard(suit, rank, deckId) {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const ctx = canvas.getContext("2d");
    renderCardForExport(ctx, suit, rank);

    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));

    const form = new FormData();
    form.append("session_id", api.SID());
    form.append("designer_id", api.DID());
    form.append("deck_id", deckId);
    form.append("card_suit", suit);
    form.append("card_rank", rank);
    form.append("file", blob, `${suit}-${rank}.png`);

    await fetch("/playing-cards/api/tgc.php?action=upload_card", {
		method: "POST",
		body: form
	});

  }
};

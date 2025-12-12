// scripts/tgc/preview.js
import { activeRanks, settings, JOKER_SUIT_ID } from "../state.js";
import { SUITS } from "../config.js";
import { getCardMetrics } from "../cardGeometry.js";
import { renderCardForPreview, renderJokerCard } from "../drawing.js";
import { enumerateRankSlots } from "../ui/navigation.js";

export default {
  state: {
    items: [],
    rendered: new Map(),
    batchSize: 10,
    loading: false,
    observer: null,
    initialBatchPending: false
  },

  init(dom, ui) {
    this.dom = dom;
    this.ui = ui;
    this.dom.previewLoading = this.dom.previewLoading || document.getElementById("tgcPreviewLoading");
    this.dom.previewPanel.classList.add("tgc-preview-grid");

    this.dom.previewPanel.addEventListener("scroll", () => {
      if (this.shouldLoadMore()) this.loadNextBatch();
    });
  },

  reset() {
    this.state.items = [];
    this.state.rendered.clear();
    this.state.initialBatchPending = false;
    this.dom.previewPanel.innerHTML = "";
  },

  load() {
    this.state.items = this.buildCardList();
    this.dom.previewPanel.innerHTML = "";
    this.state.initialBatchPending = true;
    this.showLoadingIndicator();
    this.loadNextBatch();
  },

  buildCardList() {
    const out = [];
    const slots = enumerateRankSlots(activeRanks);

    SUITS.forEach(suit => {
      slots.forEach(slot => {
        out.push({
          suit: suit.id,
          rank: slot.rank,
          copyIndex: slot.copyIndex,
          total: slot.total,
          isJoker: false
        });
      });
    });

    if (settings.includeJokers && settings.jokerCount > 0) {
      const count = clampJokerCount(settings.jokerCount);
      const baseLabel = settings.jokerLabel || "JOKER";

      for (let i = 1; i <= count; i++) {
        out.push({
          suit: JOKER_SUIT_ID,
          rank: baseLabel,
          copyIndex: i,
          total: count,
          isJoker: true,
          jokerIndex: i
        });
      }
    }

    return out;
  },

  shouldLoadMore() {
    const panel = this.dom.previewPanel;
    return panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 50;
  },

  async loadNextBatch() {
    if (this.state.loading) return;
    this.state.loading = true;

    const start = this.state.rendered.size;
    const end = Math.min(start + this.state.batchSize, this.state.items.length);
    const slice = this.state.items.slice(start, end);

    for (let item of slice) {
      await this.renderThumbnail(item);
    }

    this.state.loading = false;

    if (
      this.state.initialBatchPending &&
      (this.state.rendered.size > 0 || this.state.items.length === 0)
    ) {
      this.state.initialBatchPending = false;
      this.hideLoadingIndicator();
    }
  },

  async renderThumbnail({ suit, rank, copyIndex = 1, total = 1, isJoker = false, jokerIndex = 1 }) {
    const key = `${suit}-${rank}-${copyIndex}`;
    if (this.state.rendered.has(key)) return;

    const canvas = document.createElement("canvas");

    const { cardWidth, cardHeight } = getCardMetrics();
    const gridWidth = this.dom.previewPanel.clientWidth / 3 - 16;
    const width = Math.max(50, gridWidth);
    const height = width * (cardHeight / cardWidth);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    const scale = width / cardWidth;
    ctx.scale(scale, scale);

    if (isJoker) {
      renderJokerCard(ctx, jokerIndex, { preview: false });
    } else {
      renderCardForPreview(ctx, suit, rank, copyIndex, false);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "tgc-thumb-wrapper";

    const label = document.createElement("div");
    label.className = "tgc-thumb-label";
    label.textContent = isJoker
      ? total > 1
        ? `${rank} (${copyIndex}/${total})`
        : `${rank}`
      : total > 1
        ? `${rank} / ${suit} (${copyIndex}/${total})`
        : `${rank} / ${suit}`;

    wrapper.appendChild(canvas);
    wrapper.appendChild(label);

    this.dom.previewPanel.appendChild(wrapper);

    this.state.rendered.set(key, true);
  },

  showLoadingIndicator() {
    if (this.dom.previewLoading) this.dom.previewLoading.classList.remove("hidden");
  },

  hideLoadingIndicator() {
    if (this.dom.previewLoading) this.dom.previewLoading.classList.add("hidden");
  }

};

function clampJokerCount(n) {
  if (!n || n < 1) return 1;
  if (n > 8) return 8;
  return n;
}

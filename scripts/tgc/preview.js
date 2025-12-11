// scripts/tgc/preview.js
import api from "./api.js";
import { deck, activeRanks } from "../state.js";
import { CARD_WIDTH, CARD_HEIGHT } from "../config.js";
import { renderCardForPreview } from "../drawing.js";

export default {
  state: {
    items: [],
    rendered: new Map(),
    batchSize: 10,
    loading: false,
    observer: null
  },

  init(dom, ui) {
    this.dom = dom;
    this.ui = ui;
    this.dom.previewPanel.classList.add("tgc-preview-grid");

    this.dom.refreshBtn = document.createElement("button");
    this.dom.refreshBtn.textContent = "↻ Refresh Previews";
    this.dom.refreshBtn.className = "small secondary";
    this.dom.previewPanel.before(this.dom.refreshBtn);

    this.dom.refreshBtn.addEventListener("click", () => {
      this.reset();
      this.load();
    });

    this.dom.previewPanel.addEventListener("scroll", () => {
      if (this.shouldLoadMore()) this.loadNextBatch();
    });
  },

  reset() {
    this.state.items = [];
    this.state.rendered.clear();
    this.dom.previewPanel.innerHTML = "";
  },

  load() {
    this.state.items = this.buildCardList();
    this.dom.previewPanel.innerHTML = "";
    this.loadNextBatch();
  },

  buildCardList() {
    const suits = ["spades", "hearts", "clubs", "diamonds"];
    const out = [];

    suits.forEach(s => {
      activeRanks.forEach(r => {
        out.push({ suit: s, rank: r });
      });
    });

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
  },

  async renderThumbnail({ suit, rank }) {
  const key = `${suit}-${rank}`;
  if (this.state.rendered.has(key)) return;

  const canvas = document.createElement("canvas");

  const gridWidth = this.dom.previewPanel.clientWidth / 3 - 16;
  const width = Math.max(50, gridWidth);
  const height = width * (CARD_HEIGHT / CARD_WIDTH);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // scale so full card fits
  const scale = width / CARD_WIDTH;
  ctx.scale(scale, scale);

  // render WITHOUT overlays
  renderCardForPreview(ctx, suit, rank, false);

  const wrapper = document.createElement("div");
  wrapper.className = "tgc-thumb-wrapper";

  const label = document.createElement("div");
  label.className = "tgc-thumb-label";
  label.textContent = `${rank} / ${suit}`;

  wrapper.appendChild(canvas);
  wrapper.appendChild(label);

  this.dom.previewPanel.appendChild(wrapper);

  this.state.rendered.set(key, true);
}

  
};

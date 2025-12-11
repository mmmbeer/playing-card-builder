// ui/controls/navControls.js
import { computeNextCard } from "../navigation.js";

export function initNavControls(dom, ctxProvider, applyNewCard, sync, render) {
  function go(direction) {
    const ctx = ctxProvider();
    const next = computeNextCard(direction, ctx);

    applyNewCard(next.suit, next.rank);
    sync();
    render();
  }

  dom.prevCardBtn.addEventListener("click", () => go(-1));
  dom.nextCardBtn.addEventListener("click", () => go(1));
}

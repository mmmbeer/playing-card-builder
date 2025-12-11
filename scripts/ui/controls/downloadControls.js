// ui/controls/downloadControls.js
import { downloadSingleCard } from "../../save.js";

export function initDownloadControls(dom, getCardIds) {
  dom.downloadCardButton.addEventListener("click", () => {
    const { suit, rank } = getCardIds();
    downloadSingleCard(suit, rank);
  });
}

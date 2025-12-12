// ui/controls/downloadControls.js
import { downloadSingleCard } from "../../save.js";

export function initDownloadControls(dom, getSelection) {
  dom.downloadCardButton.addEventListener("click", () => {
    const selection = getSelection();
    downloadSingleCard(selection);
  });
}

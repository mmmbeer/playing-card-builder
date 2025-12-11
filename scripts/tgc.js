// scripts/tgc.js
import ui from "./tgc/ui.js";
import preview from "./tgc/preview.js";
import exporter from "./tgc/export.js";

export function initTgcExport() {
  const dom = {
    modal: document.getElementById("tgcModal"),
    closeBtn: document.getElementById("closeTgcModal"),
    openBtn: document.getElementById("tgcExportOpenButton"),

    loginPanel: document.getElementById("tgcLoginPanel"),
    loginBtn: document.getElementById("tgcLoginButton"),
    exportPanel: document.getElementById("tgcExportPanel"),

    phase1: document.getElementById("tgcPhase1"),
    phase2: document.getElementById("tgcPhase2"),

    designerSelect: document.getElementById("tgcDesignerSelect"),
    gameSearch: document.getElementById("tgcGameSearch"),
    gameSelect: document.getElementById("tgcGameSelect"),
    createGameBtn: document.getElementById("tgcCreateGameButton"),
    newGameRow: document.getElementById("tgcNewGameRow"),
    newGameName: document.getElementById("tgcNewGameName"),
    confirmCreateGame: document.getElementById("tgcConfirmCreateGame"),

    lockedInfo: document.getElementById("tgcLockedInfo"),
    restartBtn: document.getElementById("tgcRestartButton"),

    deckSelect: document.getElementById("tgcDeckSelect"),
    createDeckBtn: document.getElementById("tgcCreateDeckButton"),
    newDeckRow: document.getElementById("tgcNewDeckRow"),
    newDeckName: document.getElementById("tgcNewDeckName"),
    confirmCreateDeck: document.getElementById("tgcConfirmCreateDeck"),

    previewPanel: document.getElementById("tgcPreviewPanel"),
    exportBtn: document.getElementById("tgcExportButton")
  };

  const state = {
    designers: [],
    games: [],
    decks: []
  };

  preview.init(dom, ui);
  ui.init(dom, state, preview, exporter);
}

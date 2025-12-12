import { initUI } from './ui/index.js';
import { initTgcExport } from './tgc.js';
import { settings } from './state.js';
import { initAutosave } from "./autosave.js";
import { deck, getCurrentCard } from "./state.js";
import { renderCardForPreview } from './drawing.js';
import { initHelp } from "./help.js";
import { initErrorReporting } from "./errors.js";

window.addEventListener('DOMContentLoaded', () => {
    // DO NOT async/await this
    // It was blocking render and blocking restore execution timing
    initAutosave();

    initUI();
    initTgcExport();
    initHelp();
    initErrorReporting();

    window.deck = deck;
    window.renderCurrentCard = () => renderCardForPreview();
    window.getCurrentCard = getCurrentCard;
});

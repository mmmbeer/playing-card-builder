/* =====================================================================
   deck.js
   Manages:
   - Active ranks
   - Custom rank parsing
   - Deck structure (per-suit, per-rank)
   - Face image data & transforms
   - Joker generation
   ===================================================================== */

import { SUITS, settings } from './core.js';

/* ---------------------------------------------------------------------
   BASE STANDARD RANKS
   --------------------------------------------------------------------- */
export const BASE_RANKS = [
  'A','2','3','4','5','6','7','8','9','10','J','Q','K'
];

/* The actual ranks used after custom input. */
export let activeRanks = [...BASE_RANKS];

/* ---------------------------------------------------------------------
   FULL DECK DATA STRUCTURE
   deck[suitId][rank] = {
       faceImage: Image | null,
       faceImageUrl: string | null,
       offsetX, offsetY, scale, rotation,
       flipH, flipV,
       mirrorCorners: boolean,
   }
   --------------------------------------------------------------------- */
export const deck = {};

/* Create fresh empty deck */
export function initDeck() {
  SUITS.forEach(suit => {
    deck[suit.id] = {};
    activeRanks.forEach(rank => {
      deck[suit.id][rank] = createCardRecord();
    });
  });
}

/* Called whenever rank list changes to ensure deck entries exist. */
function ensureDeckForActiveRanks() {
  SUITS.forEach(suit => {
    if (!deck[suit.id]) deck[suit.id] = {};

    activeRanks.forEach(rank => {
      if (!deck[suit.id][rank]) {
        deck[suit.id][rank] = createCardRecord();
      }
    });
  });
}

/* ---------------------------------------------------------------------
   Create a clean per-card record.
   --------------------------------------------------------------------- */
function createCardRecord() {
  return {
    faceImage: null,
    faceImageUrl: null,

    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0,

    flipH: false,
    flipV: false,

    mirrorCorners: true
  };
}

/* ---------------------------------------------------------------------
   CUSTOM RANK INPUT
   Reads settings.customRanksString and updates activeRanks.
   --------------------------------------------------------------------- */
export function updateActiveRanks() {
  const raw = (settings.customRanksString || '').trim();

  if (raw === '') {
    activeRanks = [...BASE_RANKS];
  } else {
    const parsed =
      raw.split(',')
         .map(s => s.trim())
         .filter(s => s.length > 0);

    activeRanks = parsed.length ? parsed : [...BASE_RANKS];
  }

  ensureDeckForActiveRanks();
}

/* ---------------------------------------------------------------------
   PRELOAD FACE IMAGE for a specific card
   Called when user uploads/replaces face image.
   --------------------------------------------------------------------- */
export function setFaceImage(suitId, rank, file) {
  const rec = deck[suitId][rank];
  rec.faceImageUrl = URL.createObjectURL(file);

  const img = new Image();
  img.onload = () => {
    rec.faceImage = img;
  };
  img.src = rec.faceImageUrl;
}

/* ---------------------------------------------------------------------
   RESET TRANSFORMS for a card's face image
   --------------------------------------------------------------------- */
export function resetFaceTransforms(suitId, rank) {
  const rec = deck[suitId][rank];
  rec.offsetX = 0;
  rec.offsetY = 0;
  rec.scale = 1;
  rec.rotation = 0;
  rec.flipH = false;
  rec.flipV = false;
}

/* ---------------------------------------------------------------------
   JOKER SUPPORT
   This deck module does not store Jokers; they are generated on export
   and on-demand in renderer.
   --------------------------------------------------------------------- */
export function getJokerLabelWithIndex(i, total) {
  const base = settings.jokerLabel || 'JOKER';
  if (total > 1) return `${base} ${i}`;
  return base;
}

/* Is joker 'wild'? */
export function isWildJoker() {
  return settings.jokerWild === true;
}

/* ---------------------------------------------------------------------
   GENERATE ALL CARDS FOR EXPORT
   (Face cards drawn in renderer.js)
   This helper returns a flat list of:
     { suitId, rank, isJoker, jokerIndex }
   Renderer & export modules use this.
   --------------------------------------------------------------------- */
export function generateExportList() {
  const exportList = [];

  // Standard cards
  SUITS.forEach(suit => {
    activeRanks.forEach(rank => {
      exportList.push({
        isJoker: false,
        suitId: suit.id,
        rank,
        jokerIndex: null,
      });
    });
  });

  // Jokers
  if (settings.includeJokers && settings.jokerCount > 0) {
    const n = Math.min(Math.max(settings.jokerCount, 1), 8);
    for (let i = 1; i <= n; i++) {
      exportList.push({
        isJoker: true,
        suitId: null,
        rank: null,
        jokerIndex: i
      });
    }
  }

  return exportList;
}

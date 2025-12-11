import { SUITS, BASE_RANKS } from './config.js'
import { markDirty } from "./autosave.js";



export const deck = {}

// Live list of ranks used in the deck (can differ from BASE_RANKS)
export let activeRanks = BASE_RANKS.slice()

export const settings = wrapSettings({
  fontFamily: 'Roboto',
  fontWeight: '700',
  fontSize: 72,
  fontColor: '#000000',
  fontOpacity: 1,
  overlayType: 'none', // 'none' | 'shadow' | 'glow'
  outline: false,
  outlineWidth: 3,
  outlineColor: '#000000',

  layout: 'rankAboveSuit', // 'rankAboveSuit' | 'suitAboveRank' | 'sideBySide'
  showPips: true,
  mirrorDefault: true,

  iconSheet: null, // HTMLImageElement
  iconColor: '#000000',
  iconOpacity: 1,
  iconScale: 1,

  // Corner fine-tuning
  cornerRankOffsetX: 0,
  cornerRankOffsetY: 0,
  cornerSuitOffsetX: 0,
  cornerSuitOffsetY: 0,

  // Deck / joker configuration
  customRanksString: '',
  includeJokers: false,
  jokerCount: 2,
  jokerLabel: 'JOKER',
  jokerWild: false,

  // Pip layout vertical positions (fractions of safe area height)
  pipTop: 0.25,
  pipInnerTop: 0.425,
  pipCenter: 0.5,
  pipInnerBottom: 0.575,
  pipBottom: 0.75,

  // Pip horizontal positions
  pipLeft: 0.30,
  pipRight: 0.70,
  pipCenterX: 0.5,

  // NEW — overlay toggles
  showGuidelines: true,

  // NEW — safe zone inset (overlays use this)
  safeZoneInset: 80,
  
  deckIdentity: 'PokerDeck',

  
});

// Offscreen canvas used to tint suit icons
export const iconWorkCanvas = document.createElement('canvas')
export const iconWorkCtx = iconWorkCanvas.getContext('2d')

/* --------------------------------------------------------------------------
   GUIDELINE COMPUTATION
   Converts the fractional pip vertical positions into actual pixel values
   once drawing.js knows cardHeight & safe-area boundaries.
-------------------------------------------------------------------------- */

// Filled on each card render by drawing.js
export let pipGuidelineYs = []

export function computePipGuidelines(cardHeight, safeTopY, safeBottomY) {
  const safeHeight = safeBottomY - safeTopY

  pipGuidelineYs = [
    safeTopY + settings.pipTop         * safeHeight,
    safeTopY + settings.pipInnerTop    * safeHeight,
    safeTopY + settings.pipCenter      * safeHeight,
    safeTopY + settings.pipInnerBottom * safeHeight,
    safeTopY + settings.pipBottom      * safeHeight
  ]
}

/* --------------------------------------------------------------------------
   SETTINGS ACCESSOR (needed by overlays.js and drawing.js)
-------------------------------------------------------------------------- */
export function getSettings() {
  return settings
}

function wrapSettings(obj) {
  return new Proxy(obj, {
    set(target, prop, value) {
      target[prop] = value;
      markDirty();
      return true;
    }
  });
}

/* --------------------------------------------------------------------------
   DECK INITIALIZATION
-------------------------------------------------------------------------- */
export function initDeck() {
  SUITS.forEach(suit => {
    deck[suit.id] = deck[suit.id] || {}
  })
  ensureDeckForActiveRanks()
}

export function ensureDeckForActiveRanks() {
  SUITS.forEach(suit => {
    if (!deck[suit.id]) deck[suit.id] = {}
    activeRanks.forEach(rank => {
      if (!deck[suit.id][rank]) {
        deck[suit.id][rank] = wrapCard({
		  faceImage: null,
		  faceImageUrl: null,
		  offsetX: 0,
		  offsetY: 0,
		  scale: 1,
		  rotation: 0,
		  flipH: false,
		  flipV: false,
		  mirrorCorners: true
		});
      }
    })
  })
}

export function updateActiveRanksFromSettings() {
  const raw = (settings.customRanksString || '').trim()
  let nextRanks

  if (!raw) {
    nextRanks = BASE_RANKS.slice()
  } else {
    nextRanks = raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  if (nextRanks.length === 0) {
    nextRanks = BASE_RANKS.slice()
  }

  activeRanks = nextRanks
  ensureDeckForActiveRanks()
}

export function getCurrentCard(suitId, rank) {
  return deck[suitId]?.[rank]
}

function wrapCard(card) {
  if (card._wrapped) return card;
  card._wrapped = true;

  return new Proxy(card, {
    set(target, prop, value) {
      target[prop] = value;
      markDirty();
      return true;
    }
  });
}
import { SUITS, BASE_RANKS } from './config.js'
import { markDirty } from "./autosave.js";



export const JOKER_SUIT_ID = "joker";


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

  // Ability text globals
  abilityPlacement: 'bottom', // 'top' | 'bottom'
  abilityMirror: false,
  abilityAlignment: 'center', // 'left' | 'center' | 'right'
  abilityWidthPercent: 120,
  abilityHeightMode: 'auto', // 'auto' | 'fixed'
  abilityFixedHeight: 180,
  abilityOverflow: 'shrink', // 'shrink' | 'hidden' | 'overflow'
  abilityBackground: '#ffffff',
  abilityBackgroundOpacity: 0,
  abilityHeaderFontFamily: 'Roboto',
  abilityHeaderFontWeight: '700',
  abilityHeaderFontSize: 28,
  abilityBodyFontFamily: 'Roboto',
  abilityBodyFontWeight: '400',
  abilityBodyFontSize: 20,
  abilityTextColor: '#000000',
  abilityTextOpacity: 1,

  
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
  ensureJokerCards()
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
                  mirrorCorners: true,
                  abilityMarkdown: ''
                });
      }
    })
  })
}

function jokerKey(index) {
  return `JOKER_${index}`
}

export function ensureJokerCards() {
  const shouldInclude = settings.includeJokers && settings.jokerCount > 0

  if (!shouldInclude) {
    delete deck[JOKER_SUIT_ID]
    return
  }

  const count = Math.min(Math.max(settings.jokerCount, 1), 8)
  if (!deck[JOKER_SUIT_ID]) deck[JOKER_SUIT_ID] = {}

  for (let i = 1; i <= count; i++) {
    const key = jokerKey(i)
    if (!deck[JOKER_SUIT_ID][key]) {
      deck[JOKER_SUIT_ID][key] = wrapCard({
        faceImage: null,
        faceImageUrl: null,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
        flipH: false,
        flipV: false,
        mirrorCorners: true,
        abilityMarkdown: ''
      })
    }
  }

  Object.keys(deck[JOKER_SUIT_ID]).forEach(key => {
    const idx = Number((key || '').split('_')[1])
    if (!Number.isFinite(idx) || idx < 1 || idx > count) {
      delete deck[JOKER_SUIT_ID][key]
    }
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

export function getJokerCard(index) {
  const key = jokerKey(index)
  return deck[JOKER_SUIT_ID]?.[key]
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
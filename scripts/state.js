import {
  CARD_HEIGHT,
  CARD_IDENTITY,
  CARD_WIDTH,
  BLEED,
  SUITS,
  BASE_RANKS,
  DEFAULT_PIP_VERTICALS
} from './config.js'
import { markDirty } from "./autosave.js";



export const JOKER_SUIT_ID = "joker";


export const deck = {}

// Live list of ranks used in the deck (can differ from BASE_RANKS)
export let activeRanks = BASE_RANKS.slice()

export const DEFAULT_SETTINGS = Object.freeze({
  cardWidth: CARD_WIDTH,
  cardHeight: CARD_HEIGHT,
  bleed: BLEED,

  fontFamily: 'Roboto',
  fontWeight: '700',
  fontSize: 72,
  fontColorMode: 'single',
  fontColor: '#000000',
  fontColorRed: '#d12d2d',
  fontColorBlack: '#000000',
  fontColorSpades: '#000000',
  fontColorHearts: '#d12d2d',
  fontColorClubs: '#000000',
  fontColorDiamonds: '#d12d2d',
  fontOpacity: 1,
  overlayType: 'none',
  outline: false,
  outlineWidth: 3,
  outlineColor: '#000000',

  backgroundStyle: 'solid',
  backgroundColorPrimary: '#ffffff',
  backgroundColorSecondary: '#f0f0f0',

  layout: 'rankAboveSuit',
  showPips: true,
  mirrorDefault: true,

  iconSheet: null,
  iconColorMode: 'single',
  iconColor: '#000000',
  iconColorRed: '#d12d2d',
  iconColorBlack: '#000000',
  iconColorSpades: '#000000',
  iconColorHearts: '#d12d2d',
  iconColorClubs: '#000000',
  iconColorDiamonds: '#d12d2d',
  iconOpacity: 1,
  iconScale: 1,
  iconPresetId: null,
  customIconImageId: null,

  cornerRankOffsetX: 0,
  cornerRankOffsetY: 0,
  cornerSuitOffsetX: 0,
  cornerSuitOffsetY: 0,

  customRanksString: '',
  includeJokers: false,
  jokerCount: 2,
  jokerLabel: 'JOKER',
  jokerWild: false,
  jokerLabelOrientation: 'horizontal',
  jokerFontSize: 72,
  jokerSuitStyle: 'centerCircle',

  pipTop: DEFAULT_PIP_VERTICALS.top,
  pipInnerTop: DEFAULT_PIP_VERTICALS.innerTop,
  pipCenter: DEFAULT_PIP_VERTICALS.center,
  pipInnerBottom: DEFAULT_PIP_VERTICALS.innerBottom,
  pipBottom: DEFAULT_PIP_VERTICALS.bottom,
  pipLeft: 0.30,
  pipRight: 0.70,
  pipCenterX: 0.5,

  showGuidelines: true,
  safeZoneInset: 80,

  deckIdentity: CARD_IDENTITY,

  abilityPlacement: 'bottom',
  abilityMirror: false,
  abilityAlignment: 'center',
  abilityWidthPercent: 120,
  abilityHeightMode: 'auto',
  abilityFixedHeight: 180,
  abilityOverflow: 'shrink',
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

export const settings = wrapSettings(cloneDefaults(DEFAULT_SETTINGS));

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

function cloneDefaults(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function resetSettingsToDefaults(keys = null) {
  const defaults = cloneDefaults(DEFAULT_SETTINGS);
  const targetKeys = Array.isArray(keys) ? keys : Object.keys(defaults);

  targetKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      settings[key] = defaults[key];
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

function ensureRankCopies(container, rank, desired) {
  const existing = container[rank]

  const cards = Array.isArray(existing)
    ? existing
    : existing
    ? [existing]
    : []

  while (cards.length < desired) {
    cards.push(createCard())
  }

  if (cards.length > desired) {
    cards.length = desired
  }

  container[rank] = cards.map(wrapCard)
}

export function ensureDeckForActiveRanks() {
  const counts = activeRanks.reduce((map, rank) => {
    map[rank] = (map[rank] || 0) + 1
    return map
  }, {})

  SUITS.forEach(suit => {
    if (!deck[suit.id]) deck[suit.id] = {}

    Object.entries(counts).forEach(([rank, total]) => {
      ensureRankCopies(deck[suit.id], rank, total)
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
    const existing = deck[JOKER_SUIT_ID][key]
    deck[JOKER_SUIT_ID][key] = existing ? wrapCard(existing) : createCard()
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

export function resetDeckState() {
  Object.keys(deck).forEach(key => delete deck[key])
  activeRanks = BASE_RANKS.slice()
  initDeck()
  ensureJokerCards()
}

export function getCurrentCard(suitId, rank, copyIndex = 1) {
  const entry = deck[suitId]?.[rank]
  if (Array.isArray(entry)) {
    return entry[copyIndex - 1]
  }
  return entry
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

function createCard() {
  return wrapCard({
    faceImage: null,
    faceImageUrl: null,
    faceImageId: null,
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

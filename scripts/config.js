export const CARD_WIDTH = 825
export const CARD_HEIGHT = 1125
export const BLEED = 80
export const SAFE_WIDTH = CARD_WIDTH - BLEED * 2
export const SAFE_HEIGHT = CARD_HEIGHT - BLEED * 2

export const SUITS = [
  { id: 'spades',   label: 'Spades',   symbol: 'S', display: '♠', gridX: 0, gridY: 0 },
  { id: 'hearts',   label: 'Hearts',   symbol: 'H', display: '♥', gridX: 1, gridY: 0 },
  { id: 'clubs',    label: 'Clubs',    symbol: 'C', display: '♣', gridX: 0, gridY: 1 },
  { id: 'diamonds', label: 'Diamonds', symbol: 'D', display: '♦', gridX: 1, gridY: 1 }
]

// Standard ranks
export const BASE_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

// Built-in 2×2 suit icon sheets (files go in /suits)
export const ICON_PRESETS = [
  { id: 'modern-flat',        label: 'Modern Flat',               file: 'suits/modern-flat.png' },
  { id: 'standard-border',    label: 'Standard Bordered',         file: 'suits/standard-border.png' },
  { id: 'standard-border2',   label: 'Standard Bordered 2',       file: 'suits/standard-border2.png' },
  { id: 'ornate-gold',        label: 'Ornate Gold',               file: 'suits/ornate-gold.png' },

  { id: 'anime',              label: 'Anime',                     file: 'suits/anime.png' },
  { id: 'anime-br',           label: 'Anime (Black & Red)',       file: 'suits/anime-br.png' },

  { id: 'black-ink',          label: 'Black Ink',                 file: 'suits/black-ink.png' },
  { id: 'black-ink-br',       label: 'Black Ink (Black & Red)',   file: 'suits/black-ink-br.png' },

  { id: 'chibi',              label: 'Chibi',                     file: 'suits/chibi.png' },
  { id: 'chibi-br',           label: 'Chibi (Black & Red)',       file: 'suits/chibi-br.png' },

  { id: 'embroidered',        label: 'Embroidered',               file: 'suits/embroidered.png' },
  { id: 'embroidered-br',     label: 'Embroidered (Black & Red)', file: 'suits/embroidered-br.png' },

  { id: 'engraved',           label: 'Engraved',                  file: 'suits/engraved.png' },

  { id: 'list',               label: 'List',                      file: 'suits/list.txt' },

  { id: 'neon',               label: 'Neon',                      file: 'suits/neon.png' },
  { id: 'neon-br',            label: 'Neon (Black & Red)',        file: 'suits/neon-br.png' },
  { id: 'neon-futuristic',    label: 'Futuristic Neon',           file: 'suits/neon-futuristic.png' },

  { id: 'patchwork',          label: 'Patchwork',                 file: 'suits/patchwork.png' },
  { id: 'patchwork-br',       label: 'Patchwork (Black & Red)',   file: 'suits/patchwork-br.png' },

  { id: 'pencil-sketch',      label: 'Pencil Sketch',             file: 'suits/pencil-sketch.png' },
  { id: 'pixel-art',          label: 'Pixel Art',                 file: 'suits/pixel-art.png' },

  { id: 'watercolors',        label: 'Watercolors',               file: 'suits/watercolors.png' },
  { id: 'watercolors-br',     label: 'Watercolors (Black & Red)', file: 'suits/watercolors-br.png' },
];


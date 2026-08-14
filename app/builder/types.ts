export type SuitId = "spades" | "hearts" | "clubs" | "diamonds";
export type ColorMode = "single" | "black-red" | "per-suit";
export type EffectMode = "none" | "shadow" | "glow";
export type OutlinePosition = "inside" | "center" | "outside";
export type ImageFit = "cover" | "contain" | "stretch";
export type TextOverflow = "shrink" | "clip";
export type BackgroundStyle = "solid" | "horizontal" | "vertical" | "diagonal-down" | "diagonal-up" | "radial" | "sunburst";

export type CardDesign = {
  imageKey?: string;
  imageScale: number;
  imageRotation: number;
  imageX: number;
  imageY: number;
  imageFit: ImageFit;
  imageOpacity: number;
  imageBlendMode: GlobalCompositeOperation;
  flipX: boolean;
  flipY: boolean;
  mirrorCorners?: boolean;
  note: string;
};

export type FontOption = {
  name: string;
  source: "system" | "google";
  category: "Serif" | "Sans serif" | "Display" | "Handwriting" | "Monospace";
};

export type DeckSettings = {
  version: 5;
  title: string;
  ranks: string[];
  rankCopies: Record<string, number>;
  cards: Record<string, CardDesign>;

  background: string;
  backgroundAccent: string;
  backgroundStyle: BackgroundStyle;
  edgeRadius: number;
  edgeStrokeWidth: number;
  edgeStrokeColor: string;
  edgeStrokeInset: number;

  cornerOrder: "rank-first" | "suit-first" | "inline";
  mirrorCorners: boolean;
  showPips: boolean;
  pipsOverArtwork: boolean;
  aceScale: number;

  showGuides: boolean;
  showBleedGuide: boolean;
  showSafeGuide: boolean;
  showCenterGuide: boolean;
  showPipGuides: boolean;
  showCornerGuides: boolean;
  showImageBounds: boolean;
  safeZoneInset: number;

  rankFont: string;
  rankSize: number;
  rankWeight: number;
  rankColorMode: ColorMode;
  rankColor: string;
  suitColors: Record<SuitId, string>;
  rankOpacity: number;
  rankEffect: EffectMode;
  rankEffectColor: string;
  rankEffectOpacity: number;
  rankEffectBlur: number;
  rankShadowX: number;
  rankShadowY: number;
  rankOutline: boolean;
  rankOutlineWidth: number;
  rankOutlineColor: string;
  rankOutlinePosition: OutlinePosition;

  blackColor: string;
  redColor: string;
  iconPreset: string;
  customIconKey?: string;
  iconColorMode: "original" | ColorMode;
  iconColor: string;
  iconOpacity: number;
  iconScale: number;
  iconEffect: EffectMode;
  iconEffectColor: string;
  iconEffectOpacity: number;
  iconEffectBlur: number;
  iconShadowX: number;
  iconShadowY: number;
  iconOutline: boolean;
  iconOutlineWidth: number;
  iconOutlineColor: string;
  iconOutlinePosition: OutlinePosition;

  cornerRankOffsetX: number;
  cornerRankOffsetY: number;
  cornerSuitOffsetX: number;
  cornerSuitOffsetY: number;

  pipScale: number;
  pipTop: number;
  pipInnerTop: number;
  pipCenter: number;
  pipInnerBottom: number;
  pipBottom: number;
  pipLeft: number;
  pipRight: number;
  pipCenterX: number;

  textPlacement: "top" | "bottom";
  textMirror: boolean;
  textAlign: "left" | "center" | "right";
  textWidth: number;
  textHeightMode: "auto" | "fixed";
  textFixedHeight: number;
  textOverflow: TextOverflow;
  textBackground: string;
  textBackgroundOpacity: number;
  textHeaderFont: string;
  textHeaderWeight: number;
  textHeaderSize: number;
  textBodyFont: string;
  textBodyWeight: number;
  textBodySize: number;
  textColor: string;
  textOpacity: number;

  includeJokers: boolean;
  jokerCount: number;
  jokerLabel: string;
  jokerSubtitle: string;
  jokerWild: boolean;
  jokerOrientation: "vertical" | "horizontal";
  jokerFontSize: number;
  jokerSuitStyle: "center-circle" | "square" | "diamond" | "rows";
};

export type ImageUrls = Record<string, string>;

export const SUITS: Array<{ id: SuitId; name: string; symbol: string; red: boolean }> = [
  { id: "spades", name: "Spades", symbol: "♠", red: false },
  { id: "hearts", name: "Hearts", symbol: "♥", red: true },
  { id: "clubs", name: "Clubs", symbol: "♣", red: false },
  { id: "diamonds", name: "Diamonds", symbol: "♦", red: true },
];

export const STANDARD_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SYSTEM_FONTS: Array<[string, FontOption["category"]]> = [
  ["Arial", "Sans serif"], ["Arial Black", "Display"], ["Baskerville", "Serif"], ["Bookman", "Serif"],
  ["Brush Script MT", "Handwriting"], ["Copperplate", "Display"], ["Courier New", "Monospace"], ["Garamond", "Serif"],
  ["Geneva", "Sans serif"], ["Georgia", "Serif"], ["Gill Sans", "Sans serif"], ["Helvetica", "Sans serif"],
  ["Impact", "Display"], ["Lucida Sans", "Sans serif"], ["Optima", "Sans serif"], ["Palatino", "Serif"],
  ["Tahoma", "Sans serif"], ["Times New Roman", "Serif"], ["Trebuchet MS", "Sans serif"], ["Verdana", "Sans serif"],
];

const GOOGLE_FONTS: Array<[string, FontOption["category"]]> = [
  ["Abril Fatface", "Display"], ["Alfa Slab One", "Display"], ["Archivo", "Sans serif"], ["Bangers", "Display"],
  ["Bebas Neue", "Display"], ["Bitter", "Serif"], ["Black Ops One", "Display"], ["Bodoni Moda", "Serif"],
  ["Bree Serif", "Serif"], ["Cabin", "Sans serif"], ["Cinzel", "Serif"], ["Cormorant Garamond", "Serif"],
  ["Crimson Pro", "Serif"], ["DM Sans", "Sans serif"], ["EB Garamond", "Serif"], ["Fira Sans", "Sans serif"],
  ["Fredericka the Great", "Display"], ["IBM Plex Mono", "Monospace"], ["IBM Plex Sans", "Sans serif"],
  ["Inconsolata", "Monospace"], ["Inter", "Sans serif"], ["Josefin Sans", "Sans serif"], ["Kanit", "Sans serif"],
  ["Libre Baskerville", "Serif"], ["Libre Franklin", "Sans serif"], ["Lobster", "Handwriting"], ["Lora", "Serif"],
  ["Merriweather", "Serif"], ["Montserrat", "Sans serif"], ["Nanum Pen Script", "Handwriting"], ["Noto Sans", "Sans serif"],
  ["Noto Serif", "Serif"], ["Nunito", "Sans serif"], ["Open Sans", "Sans serif"], ["Orbitron", "Display"],
  ["Oswald", "Sans serif"], ["Pacifico", "Handwriting"], ["Permanent Marker", "Handwriting"], ["Playfair Display", "Serif"],
  ["Poppins", "Sans serif"], ["Press Start 2P", "Display"], ["Raleway", "Sans serif"], ["Roboto", "Sans serif"],
  ["Roboto Condensed", "Sans serif"], ["Roboto Mono", "Monospace"], ["Rock Salt", "Handwriting"], ["Rye", "Display"],
  ["Source Sans 3", "Sans serif"], ["Source Serif 4", "Serif"], ["Space Grotesk", "Sans serif"], ["Special Elite", "Display"],
  ["Teko", "Display"], ["Unbounded", "Display"], ["Vollkorn", "Serif"], ["Work Sans", "Sans serif"],
];

export const FONT_OPTIONS: FontOption[] = [
  ...SYSTEM_FONTS.map(([name, category]) => ({ name, category, source: "system" as const })),
  ...GOOGLE_FONTS.map(([name, category]) => ({ name, category, source: "google" as const })),
];

export const ICON_PRESETS = [
  ["unicode", "Classic symbols"], ["modern-flat", "Modern flat"], ["standard-border", "Standard border"],
  ["standard-border2", "Standard border II"], ["ornate-gold", "Ornate gold"], ["engraved", "Engraved"],
  ["metallic", "Metallic"], ["metallic-br", "Metallic black/red"], ["black-ink", "Black ink"],
  ["black-ink-br", "Black ink black/red"], ["neon", "Neon"], ["neon-br", "Neon black/red"],
  ["neon-futuristic", "Neon futuristic"], ["watercolors", "Watercolor"], ["watercolors-br", "Watercolor black/red"],
  ["embroidered", "Embroidered"], ["embroidered-br", "Embroidered black/red"], ["patchwork", "Patchwork"],
  ["patchwork-br", "Patchwork black/red"], ["pixel-art", "Pixel art"], ["pencil-sketch", "Pencil sketch"],
  ["constellations", "Constellations"], ["constellations-br", "Constellations black/red"], ["stone", "Stone"],
  ["stone-br", "Stone black/red"], ["anime", "Anime"], ["anime-br", "Anime black/red"],
  ["chibi", "Chibi"], ["chibi-br", "Chibi black/red"],
] as const;

export function cardKey(suit: SuitId, rank: string, copy = 1) {
  return copy > 1 ? `${suit}:${rank}:${copy}` : `${suit}:${rank}`;
}

export function rankCopyCount(deck: Pick<DeckSettings, "rankCopies">, rank: string) {
  return Math.max(1, Math.min(12, Math.round(deck.rankCopies[rank] || 1)));
}

export function deckCardCount(deck: Pick<DeckSettings, "ranks" | "rankCopies" | "includeJokers" | "jokerCount">) {
  return deck.ranks.reduce((total, rank) => total + rankCopyCount(deck, rank) * SUITS.length, 0) + (deck.includeJokers ? deck.jokerCount : 0);
}

export function blankCard(): CardDesign {
  return {
    imageScale: 1,
    imageRotation: 0,
    imageX: 0,
    imageY: 0,
    imageFit: "cover",
    imageOpacity: 1,
    imageBlendMode: "source-over",
    flipX: false,
    flipY: false,
    note: "",
  };
}

export function createDefaultDeck(): DeckSettings {
  const cards: Record<string, CardDesign> = {};
  const rankCopies = Object.fromEntries(STANDARD_RANKS.map((rank) => [rank, 1]));
  for (const suit of SUITS) for (const rank of STANDARD_RANKS) cards[cardKey(suit.id, rank)] = blankCard();
  return {
    version: 5, title: "Untitled deck", ranks: [...STANDARD_RANKS], rankCopies, cards,
    background: "#F7F5EF", backgroundAccent: "#C8B79A", backgroundStyle: "solid",
    edgeRadius: 0, edgeStrokeWidth: 0, edgeStrokeColor: "#090C02", edgeStrokeInset: 80,
    cornerOrder: "rank-first", mirrorCorners: true, showPips: true, pipsOverArtwork: false, aceScale: 1.3,
    showGuides: true, showBleedGuide: true, showSafeGuide: true, showCenterGuide: false,
    showPipGuides: false, showCornerGuides: false, showImageBounds: false, safeZoneInset: 112,
    rankFont: "Georgia", rankSize: 74, rankWeight: 700, rankColorMode: "black-red", rankColor: "#090C02",
    suitColors: { spades: "#090C02", hearts: "#A72608", clubs: "#090C02", diamonds: "#A72608" },
    rankOpacity: 1, rankEffect: "none", rankEffectColor: "#090C02", rankEffectOpacity: .7,
    rankEffectBlur: 12, rankShadowX: 4, rankShadowY: 4, rankOutline: false, rankOutlineWidth: 3,
    rankOutlineColor: "#F7F5EF", rankOutlinePosition: "center", blackColor: "#090C02", redColor: "#A72608",
    iconPreset: "unicode", iconColorMode: "black-red", iconColor: "#090C02", iconOpacity: 1, iconScale: 1,
    iconEffect: "none", iconEffectColor: "#467599", iconEffectOpacity: .7, iconEffectBlur: 12,
    iconShadowX: 3, iconShadowY: 3, iconOutline: false, iconOutlineWidth: 3,
    iconOutlineColor: "#F7F5EF", iconOutlinePosition: "center",
    cornerRankOffsetX: 0, cornerRankOffsetY: 0, cornerSuitOffsetX: 0, cornerSuitOffsetY: 0,
    pipScale: 1, pipTop: .3, pipInnerTop: .4, pipCenter: .5, pipInnerBottom: .6,
    pipBottom: .7, pipLeft: .3, pipRight: .7, pipCenterX: .5,
    textPlacement: "bottom", textMirror: false, textAlign: "center", textWidth: 72,
    textHeightMode: "auto", textFixedHeight: 180, textOverflow: "shrink",
    textBackground: "#F7F5EF", textBackgroundOpacity: .9,
    textHeaderFont: "Georgia", textHeaderWeight: 700, textHeaderSize: 32,
    textBodyFont: "Arial", textBodyWeight: 500, textBodySize: 26, textColor: "#090C02", textOpacity: 1,
    includeJokers: false, jokerCount: 2, jokerLabel: "JOKER", jokerSubtitle: "", jokerWild: true,
    jokerOrientation: "vertical", jokerFontSize: 72, jokerSuitStyle: "center-circle",
  };
}

export function migrateDeck(value: unknown): DeckSettings {
  const defaults = createDefaultDeck();
  if (!value || typeof value !== "object") return defaults;
  const parsed = value as Partial<DeckSettings> & {
    cards?: Record<string, Partial<CardDesign>>;
    ranks?: string[];
    textFont?: string;
    textWeight?: number;
    textSize?: number;
    jokerWild?: boolean | string;
  };
  if (!Array.isArray(parsed.ranks) || !parsed.ranks.length || !parsed.cards) return defaults;

  const rankCopies = { ...defaults.rankCopies, ...(parsed.rankCopies || {}) };
  const parsedBackgroundStyle = (parsed as { backgroundStyle?: string }).backgroundStyle;
  for (const rank of parsed.ranks) rankCopies[rank] = rankCopyCount({ rankCopies }, rank);
  const cards: Record<string, CardDesign> = {};
  for (const suit of SUITS) {
    for (const rank of parsed.ranks) {
      for (let copy = 1; copy <= rankCopies[rank]; copy += 1) {
        const key = cardKey(suit.id, rank, copy);
        cards[key] = { ...blankCard(), ...(parsed.cards[key] || (copy === 1 ? parsed.cards[`${suit.id}:${rank}`] : {}) || {}) };
      }
    }
  }

  return {
    ...defaults,
    ...parsed,
    version: 5,
    backgroundStyle: parsedBackgroundStyle === "split" ? "diagonal-down" : ((parsedBackgroundStyle as BackgroundStyle) || defaults.backgroundStyle),
    rankCopies,
    cards,
    suitColors: { ...defaults.suitColors, ...(parsed.suitColors || {}) },
    textHeaderFont: parsed.textHeaderFont || parsed.textFont || defaults.textHeaderFont,
    textBodyFont: parsed.textBodyFont || parsed.textFont || defaults.textBodyFont,
    textBodyWeight: parsed.textBodyWeight || parsed.textWeight || defaults.textBodyWeight,
    textBodySize: parsed.textBodySize || parsed.textSize || defaults.textBodySize,
    jokerWild: typeof parsed.jokerWild === "boolean" ? parsed.jokerWild : Boolean(parsed.jokerWild),
    jokerSubtitle: parsed.jokerSubtitle || (typeof parsed.jokerWild === "string" ? parsed.jokerWild : ""),
    ...(typeof parsed.version === "number" && parsed.version < 5 ? {
      pipTop: convertFullCardAnchor(parsed.pipTop, defaults.pipTop, 1125, 80),
      pipInnerTop: convertFullCardAnchor(parsed.pipInnerTop, defaults.pipInnerTop, 1125, 80),
      pipCenter: convertFullCardAnchor(parsed.pipCenter, defaults.pipCenter, 1125, 80),
      pipInnerBottom: convertFullCardAnchor(parsed.pipInnerBottom, defaults.pipInnerBottom, 1125, 80),
      pipBottom: convertFullCardAnchor(parsed.pipBottom, defaults.pipBottom, 1125, 80),
      pipLeft: convertFullCardAnchor(parsed.pipLeft, defaults.pipLeft, 825, 80),
      pipCenterX: convertFullCardAnchor(parsed.pipCenterX, defaults.pipCenterX, 825, 80),
      pipRight: convertFullCardAnchor(parsed.pipRight, defaults.pipRight, 825, 80),
    } : {}),
  } as DeckSettings;
}

function convertFullCardAnchor(value: number | undefined, fallback: number, dimension: number, bleed: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, (dimension * value - bleed) / (dimension - bleed * 2)));
}

export function colorForSuit(deck: DeckSettings, suit: SuitId, mode: ColorMode | "original", single: string) {
  const meta = SUITS.find((item) => item.id === suit)!;
  if (mode === "single") return single;
  if (mode === "per-suit") return deck.suitColors[suit];
  return meta.red ? deck.redColor : deck.blackColor;
}

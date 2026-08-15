import type { CardDesign, DeckSettings, OutlinePosition, SuitId } from "./types";
import { colorForSuit, SUITS } from "./types";
import { getPipLayout } from "./pip-layout";
import { ensureFontLoaded, loadImage, rgba, roundedRect } from "./canvas-resources";

export const CARD_WIDTH = 825;
export const CARD_HEIGHT = 1125;
export const BLEED = 80;
export const SAFE = 112;

function drawBackground(ctx: CanvasRenderingContext2D, deck: DeckSettings) {
  if (deck.backgroundStyle === "solid") {
    ctx.fillStyle = deck.background;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  } else if (deck.backgroundStyle !== "sunburst") {
    const gradient = deck.backgroundStyle === "radial"
      ? ctx.createRadialGradient(CARD_WIDTH / 2, CARD_HEIGHT / 2, 0, CARD_WIDTH / 2, CARD_HEIGHT / 2, Math.hypot(CARD_WIDTH, CARD_HEIGHT) / 2)
      : deck.backgroundStyle === "horizontal"
        ? ctx.createLinearGradient(0, 0, CARD_WIDTH, 0)
        : deck.backgroundStyle === "vertical"
          ? ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT)
          : deck.backgroundStyle === "diagonal-up"
            ? ctx.createLinearGradient(0, CARD_HEIGHT, CARD_WIDTH, 0)
            : ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, deck.background);
    gradient.addColorStop(1, deck.backgroundAccent);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  } else {
    ctx.fillStyle = deck.background;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.save();
    ctx.translate(CARD_WIDTH / 2, CARD_HEIGHT / 2);
    for (let index = 0; index < 24; index += 1) {
      ctx.rotate(Math.PI / 12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-34, -900);
      ctx.lineTo(34, -900);
      ctx.closePath();
      ctx.globalAlpha = index % 2 ? .16 : .04;
      ctx.fillStyle = deck.backgroundAccent;
      ctx.fill();
    }
    ctx.restore();
  }

  if (deck.edgeStrokeWidth > 0) {
    const inset = Math.max(deck.edgeStrokeWidth / 2, deck.edgeStrokeInset);
    ctx.save();
    ctx.strokeStyle = deck.edgeStrokeColor;
    ctx.lineWidth = deck.edgeStrokeWidth;
    roundedRect(ctx, inset, inset, CARD_WIDTH - inset * 2, CARD_HEIGHT - inset * 2, deck.edgeRadius);
    ctx.stroke();
    ctx.restore();
  }
}

function applyEffect(ctx: CanvasRenderingContext2D, mode: "none" | "shadow" | "glow", color: string, opacity: number, blur: number, x = 0, y = 0) {
  if (mode === "none") return;
  ctx.shadowColor = rgba(color, opacity);
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = mode === "shadow" ? x : 0;
  ctx.shadowOffsetY = mode === "shadow" ? y : 0;
}

function outlineLineWidth(width: number, position: OutlinePosition) {
  return width * (position === "inside" ? 1 : position === "outside" ? 3 : 2);
}

function drawRank(ctx: CanvasRenderingContext2D, deck: DeckSettings, suit: SuitId, rank: string, x: number, y: number) {
  const color = colorForSuit(deck, suit, deck.rankColorMode, deck.rankColor);
  ctx.save();
  ctx.globalAlpha = deck.rankOpacity;
  ctx.font = `${deck.rankWeight} ${deck.rankSize}px "${deck.rankFont}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  applyEffect(ctx, deck.rankEffect, deck.rankEffectColor, deck.rankEffectOpacity, deck.rankEffectBlur, deck.rankShadowX, deck.rankShadowY);
  if (deck.rankOutline) {
    ctx.lineJoin = "round";
    ctx.lineWidth = outlineLineWidth(deck.rankOutlineWidth, deck.rankOutlinePosition);
    ctx.strokeStyle = deck.rankOutlineColor;
    ctx.strokeText(rank, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(rank, x, y);
  ctx.restore();
}

function makeTinted(source: HTMLImageElement, suit: SuitId, color?: string) {
  const grid = { spades: [0, 0], hearts: [1, 0], clubs: [0, 1], diamonds: [1, 1] }[suit];
  const width = source.naturalWidth / 2;
  const height = source.naturalHeight / 2;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const work = canvas.getContext("2d")!;
  work.drawImage(source, grid[0] * width, grid[1] * height, width, height, 0, 0, width, height);
  if (color) {
    work.globalCompositeOperation = "source-in";
    work.fillStyle = color;
    work.fillRect(0, 0, width, height);
    work.globalCompositeOperation = "source-over";
  }
  return canvas;
}

async function drawSuit(
  ctx: CanvasRenderingContext2D,
  deck: DeckSettings,
  suit: SuitId,
  x: number,
  y: number,
  size: number,
  rotation = 0,
  iconUrl?: string,
) {
  const meta = SUITS.find((item) => item.id === suit)!;
  const color = colorForSuit(deck, suit, deck.iconColorMode, deck.iconColor);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = deck.iconOpacity;
  applyEffect(ctx, deck.iconEffect, deck.iconEffectColor, deck.iconEffectOpacity, deck.iconEffectBlur, deck.iconShadowX, deck.iconShadowY);

  if (deck.iconPreset === "unicode" && !iconUrl) {
    ctx.font = `${size * deck.iconScale}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (deck.iconOutline) {
      ctx.strokeStyle = deck.iconOutlineColor;
      ctx.lineJoin = "round";
      ctx.lineWidth = outlineLineWidth(deck.iconOutlineWidth, deck.iconOutlinePosition);
      ctx.strokeText(meta.symbol, 0, 0);
    }
    ctx.fillStyle = color;
    ctx.fillText(meta.symbol, 0, 0);
    ctx.restore();
    return;
  }

  try {
    const source = await loadImage(iconUrl || `/suits/${deck.iconPreset}.png`);
    const original = deck.iconColorMode === "original";
    const icon = makeTinted(source, suit, original ? undefined : color);
    const drawSize = size * deck.iconScale;
    const xOffset = -drawSize / 2;
    const yOffset = -drawSize / 2;
    if (deck.iconOutline) {
      const outlined = makeTinted(source, suit, deck.iconOutlineColor);
      const radius = deck.iconOutlineWidth * (deck.iconOutlinePosition === "outside" ? 1.5 : deck.iconOutlinePosition === "inside" ? .5 : 1);
      for (let index = 0; index < 16; index += 1) {
        const angle = index * Math.PI / 8;
        ctx.drawImage(outlined, xOffset + Math.cos(angle) * radius, yOffset + Math.sin(angle) * radius, drawSize, drawSize);
      }
    }
    ctx.drawImage(icon, xOffset, yOffset, drawSize, drawSize);
  } catch {
    ctx.font = `${size * deck.iconScale}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(meta.symbol, 0, 0);
  }
  ctx.restore();
}

async function drawCorner(ctx: CanvasRenderingContext2D, deck: DeckSettings, suit: SuitId, rank: string, mirrored: boolean, iconUrl?: string) {
  ctx.save();
  if (mirrored) { ctx.translate(CARD_WIDTH, CARD_HEIGHT); ctx.rotate(Math.PI); }
  const padding = 10;
  const gap = 8;
  const suitRadius = 30 * deck.iconScale + (deck.iconOutline ? deck.iconOutlineWidth * 1.5 : 0);
  ctx.font = `${deck.rankWeight} ${deck.rankSize}px "${deck.rankFont}"`;
  const rankRadius = ctx.measureText(rank).width / 2 + (deck.rankOutline ? deck.rankOutlineWidth * 1.5 : 0);
  const x = deck.safeZoneInset + padding + Math.max(rankRadius, suitRadius);
  const rankY = deck.cornerOrder === "suit-first"
    ? deck.safeZoneInset + padding + suitRadius * 2 + gap
    : deck.safeZoneInset + padding;
  const suitY = deck.cornerOrder === "suit-first"
    ? deck.safeZoneInset + padding + suitRadius
    : rankY + deck.rankSize * 1.08 + gap + suitRadius;
  if (deck.cornerOrder === "inline") {
    const inlineRankX = deck.safeZoneInset + padding + rankRadius;
    const inlineSuitX = inlineRankX + rankRadius + gap + suitRadius;
    drawRank(ctx, deck, suit, rank, inlineRankX + deck.cornerRankOffsetX, rankY + deck.cornerRankOffsetY);
    await drawSuit(ctx, deck, suit, inlineSuitX + deck.cornerSuitOffsetX, rankY + deck.rankSize * .5 + deck.cornerSuitOffsetY, 60, 0, iconUrl);
  } else {
    drawRank(ctx, deck, suit, rank, x + deck.cornerRankOffsetX, rankY + deck.cornerRankOffsetY);
    await drawSuit(ctx, deck, suit, x + deck.cornerSuitOffsetX, suitY + deck.cornerSuitOffsetY, 60, 0, iconUrl);
  }
  ctx.restore();
}

type TextBlock = { type: "heading" | "body"; text: string };
type TextLine = TextBlock & { width: number };

function parseBlocks(text: string): TextBlock[] {
  return text.trim().split(/\n/).filter(Boolean).map((raw) => {
    if (/^#{1,3}\s+/.test(raw)) return { type: "heading", text: raw.replace(/^#{1,3}\s+/, "") };
    if (/^[-*]\s+/.test(raw)) return { type: "body", text: `• ${raw.replace(/^[-*]\s+/, "")}` };
    return { type: "body", text: raw.replace(/^\d+\.\s+/, (match) => match) };
  });
}

function replaceSuitTags(text: string, currentSuit: SuitId) {
  const symbols: Record<string, string> = { suit: SUITS.find((item) => item.id === currentSuit)!.symbol, spade: "♠", spades: "♠", heart: "♥", hearts: "♥", club: "♣", clubs: "♣", diamond: "♦", diamonds: "♦" };
  return text.replace(/::(suit|spades?|hearts?|clubs?|diamonds?)::/gi, (_, key: string) => symbols[key.toLowerCase()] || "");
}

function wrapBlock(ctx: CanvasRenderingContext2D, block: TextBlock, maxWidth: number, deck: DeckSettings, suit: SuitId): TextLine[] {
  const family = block.type === "heading" ? deck.textHeaderFont : deck.textBodyFont;
  const weight = block.type === "heading" ? deck.textHeaderWeight : deck.textBodyWeight;
  const size = block.type === "heading" ? deck.textHeaderSize : deck.textBodySize;
  ctx.font = `${weight} ${size}px "${family}"`;
  const words = replaceSuitTags(block.text, suit).split(/\s+/);
  const lines: TextLine[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push({ ...block, text: line, width: ctx.measureText(line).width });
      line = word;
    } else line = candidate;
  }
  if (line) lines.push({ ...block, text: line, width: ctx.measureText(line).width });
  return lines;
}

async function drawCardText(ctx: CanvasRenderingContext2D, deck: DeckSettings, suit: SuitId, text: string, mirrored = false) {
  const blocks = parseBlocks(text);
  if (!blocks.length) return;
  const width = CARD_WIDTH * deck.textWidth / 100;
  const maxTextWidth = width - 34;
  const lines = blocks.flatMap((block) => wrapBlock(ctx, block, maxTextWidth, deck, suit));
  const lineHeight = (line: TextLine) => (line.type === "heading" ? deck.textHeaderSize : deck.textBodySize) * 1.3;
  const naturalHeight = Math.max(72, 28 + lines.reduce((total, line) => total + lineHeight(line), 0));
  const boxHeight = deck.textHeightMode === "fixed" ? deck.textFixedHeight : naturalHeight;
  const scale = deck.textHeightMode === "fixed" && deck.textOverflow === "shrink" && naturalHeight > boxHeight ? boxHeight / naturalHeight : 1;
  const safe = deck.safeZoneInset;

  ctx.save();
  if (mirrored) { ctx.translate(CARD_WIDTH, CARD_HEIGHT); ctx.rotate(Math.PI); }
  const x = (CARD_WIDTH - width) / 2;
  const y = deck.textPlacement === "top" ? safe + 22 : CARD_HEIGHT - safe - boxHeight - 20;
  ctx.fillStyle = rgba(deck.textBackground, deck.textBackgroundOpacity);
  roundedRect(ctx, x, y, width, boxHeight, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x, y, width, boxHeight);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = deck.textOpacity;
  ctx.fillStyle = deck.textColor;
  ctx.textBaseline = "top";
  let cursorY = 14;
  for (const line of lines) {
    const family = line.type === "heading" ? deck.textHeaderFont : deck.textBodyFont;
    const weight = line.type === "heading" ? deck.textHeaderWeight : deck.textBodyWeight;
    const size = line.type === "heading" ? deck.textHeaderSize : deck.textBodySize;
    ctx.font = `${weight} ${size}px "${family}"`;
    ctx.textAlign = deck.textAlign;
    const textX = deck.textAlign === "left" ? 17 : deck.textAlign === "right" ? width - 17 : width / 2;
    ctx.fillText(line.text, textX, cursorY);
    cursorY += size * 1.3;
  }
  ctx.restore();
}

async function drawJoker(ctx: CanvasRenderingContext2D, deck: DeckSettings, index: number, iconUrl?: string) {
  const centerX = CARD_WIDTH / 2, centerY = CARD_HEIGHT / 2;
  const positions = deck.jokerSuitStyle === "rows"
    ? [[-105, -50], [-35, -50], [35, -50], [105, -50]]
    : deck.jokerSuitStyle === "square"
      ? [[-70, -70], [70, -70], [-70, 70], [70, 70]]
      : deck.jokerSuitStyle === "diamond"
        ? [[0, -110], [110, 0], [0, 110], [-110, 0]]
        : [[0, -95], [95, 0], [0, 95], [-95, 0]];
  if (deck.jokerSuitStyle === "center-circle") {
    ctx.save(); ctx.strokeStyle = deck.rankColor; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(centerX, centerY, 155, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  for (let suitIndex = 0; suitIndex < SUITS.length; suitIndex += 1) {
    const [x, y] = positions[suitIndex];
    await drawSuit(ctx, deck, SUITS[suitIndex].id, centerX + x, centerY + y, 70, 0, iconUrl);
  }
  ctx.save();
  ctx.fillStyle = deck.rankColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(centerX, centerY);
  if (deck.jokerOrientation === "vertical") ctx.rotate(-Math.PI / 2);
  ctx.font = `${deck.rankWeight} ${deck.jokerFontSize}px "${deck.rankFont}"`;
  ctx.fillText(deck.jokerLabel, 0, -210);
  const subtitle = [deck.jokerSubtitle, deck.jokerWild ? "WILD" : "", deck.jokerCount > 1 ? `${index}` : ""].filter(Boolean).join(" · ");
  if (subtitle) {
    ctx.font = `${deck.rankWeight} ${Math.max(22, deck.jokerFontSize * .34)}px "${deck.rankFont}"`;
    ctx.fillText(subtitle, 0, 210);
  }
  ctx.restore();
}

function drawGuides(ctx: CanvasRenderingContext2D, deck: DeckSettings) {
  if (!deck.showGuides) return;
  const safe = deck.safeZoneInset;
  ctx.save();
  ctx.setLineDash([14, 11]);
  ctx.lineWidth = 3;
  ctx.font = "600 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  if (deck.showBleedGuide) {
    ctx.strokeStyle = "rgba(167,38,8,.82)";
    ctx.fillStyle = "rgba(167,38,8,.82)";
    ctx.strokeRect(BLEED, BLEED, CARD_WIDTH - BLEED * 2, CARD_HEIGHT - BLEED * 2);
    ctx.fillText("TRIM", CARD_WIDTH / 2, BLEED + 8);
  }
  if (deck.showSafeGuide) {
    ctx.strokeStyle = "rgba(70,117,153,.9)";
    ctx.fillStyle = "rgba(70,117,153,.9)";
    ctx.strokeRect(safe, safe, CARD_WIDTH - safe * 2, CARD_HEIGHT - safe * 2);
    ctx.fillText("SAFE", CARD_WIDTH / 2, safe + 8);
  }
  if (deck.showCenterGuide) {
    ctx.strokeStyle = "rgba(9,12,2,.42)";
    ctx.beginPath(); ctx.moveTo(CARD_WIDTH / 2, safe); ctx.lineTo(CARD_WIDTH / 2, CARD_HEIGHT - safe);
    ctx.moveTo(safe, CARD_HEIGHT / 2); ctx.lineTo(CARD_WIDTH - safe, CARD_HEIGHT / 2); ctx.stroke();
  }
  if (deck.showPipGuides) {
    ctx.strokeStyle = "rgba(70,117,153,.7)";
    for (const y of [deck.pipTop, deck.pipInnerTop, deck.pipCenter, deck.pipInnerBottom, deck.pipBottom]) {
      const canvasY = BLEED + y * (CARD_HEIGHT - BLEED * 2);
      ctx.beginPath(); ctx.moveTo(safe, canvasY); ctx.lineTo(CARD_WIDTH - safe, canvasY); ctx.stroke();
    }
    for (const x of [deck.pipLeft, deck.pipCenterX, deck.pipRight]) {
      const canvasX = BLEED + x * (CARD_WIDTH - BLEED * 2);
      ctx.beginPath(); ctx.moveTo(canvasX, safe); ctx.lineTo(canvasX, CARD_HEIGHT - safe); ctx.stroke();
    }
  }
  if (deck.showCornerGuides) {
    ctx.strokeStyle = "rgba(167,38,8,.55)";
    ctx.strokeRect(BLEED, BLEED, 148, 210);
    ctx.strokeRect(CARD_WIDTH - BLEED - 148, CARD_HEIGHT - BLEED - 210, 148, 210);
  }
  ctx.restore();
}

async function drawFaceImage(ctx: CanvasRenderingContext2D, deck: DeckSettings, card: CardDesign, imageUrl: string, includeGuides: boolean) {
  try {
    const img = await loadImage(imageUrl);
    const cover = Math.max(CARD_WIDTH / img.naturalWidth, CARD_HEIGHT / img.naturalHeight);
    const contain = Math.min(CARD_WIDTH / img.naturalWidth, CARD_HEIGHT / img.naturalHeight);
    const baseScale = card.imageFit === "contain" ? contain : card.imageFit === "stretch" ? 1 : cover;
    const width = card.imageFit === "stretch" ? CARD_WIDTH * card.imageScale : img.naturalWidth * baseScale * card.imageScale;
    const height = card.imageFit === "stretch" ? CARD_HEIGHT * card.imageScale : img.naturalHeight * baseScale * card.imageScale;
    ctx.save();
    ctx.translate(CARD_WIDTH / 2 + card.imageX, CARD_HEIGHT / 2 + card.imageY);
    ctx.rotate(card.imageRotation * Math.PI / 180);
    ctx.scale(card.flipX ? -1 : 1, card.flipY ? -1 : 1);
    ctx.globalAlpha = card.imageOpacity;
    ctx.globalCompositeOperation = card.imageBlendMode;
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    if (includeGuides && deck.showGuides && deck.showImageBounds) {
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(167,38,8,.8)"; ctx.strokeRect(-width / 2, -height / 2, width, height);
    }
    ctx.restore();
  } catch { /* Keep the styled card if a local image is unavailable. */ }
}

export async function renderCard(
  ctx: CanvasRenderingContext2D,
  deck: DeckSettings,
  suitId: SuitId,
  rank: string,
  card: CardDesign,
  imageUrl?: string,
  includeGuides = false,
  iconUrl?: string,
) {
  await Promise.all([
    ensureFontLoaded(deck.rankFont, deck.rankWeight),
    ensureFontLoaded(deck.textHeaderFont, deck.textHeaderWeight),
    ensureFontLoaded(deck.textBodyFont, deck.textBodyWeight),
  ]);
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  drawBackground(ctx, deck);
  if (imageUrl) await drawFaceImage(ctx, deck, card, imageUrl, includeGuides);

  if (rank.startsWith("__JOKER_")) {
    await drawJoker(ctx, deck, Number(rank.match(/\d+/)?.[0] || 1), iconUrl);
  } else {
    await drawCorner(ctx, deck, suitId, rank, false, iconUrl);
    if (card.mirrorCorners ?? deck.mirrorCorners) await drawCorner(ctx, deck, suitId, rank, true, iconUrl);
    if (deck.showPips && (!imageUrl || deck.pipsOverArtwork)) {
      for (const [x, y, flipped] of getPipLayout(rank, deck)) {
        const scale = rank === "A" || rank === "1" ? deck.aceScale : 1;
        await drawSuit(ctx, deck, suitId, BLEED + x * (CARD_WIDTH - BLEED * 2), BLEED + y * (CARD_HEIGHT - BLEED * 2), 100 * deck.pipScale * scale, flipped ? Math.PI : 0, iconUrl);
      }
    }
    if (card.note.trim()) {
      await drawCardText(ctx, deck, suitId, card.note, false);
      if (deck.textMirror) await drawCardText(ctx, deck, suitId, card.note, true);
    }
  }
  if (includeGuides) drawGuides(ctx, deck);
}

export function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not render PNG")), "image/png"));
}

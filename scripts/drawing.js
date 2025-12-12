// drawing.js
import { SUITS } from './config.js';
import { getCardMetrics } from './cardGeometry.js';

import {
  settings,
  iconWorkCanvas,
  iconWorkCtx,
  computePipGuidelines,
  getCurrentCard,
  getJokerCard,
  JOKER_SUIT_ID,
  pipGuidelineYs
} from './state.js';

import { getPipLayout } from './pips.js'; // NEW

import { renderOverlays } from './overlays.js';
import { renderAbilityText } from './abilityText.js';

const measureCtx = document.createElement('canvas').getContext('2d');

function getGeometry() {
  const { cardWidth, cardHeight, bleed, safeWidth, safeHeight } = getCardMetrics();
  return {
    cardWidth,
    cardHeight,
    bleed,
    safeWidth,
    safeHeight,
    CARD_WIDTH: cardWidth,
    CARD_HEIGHT: cardHeight,
    BLEED: bleed,
    SAFE_WIDTH: safeWidth,
    SAFE_HEIGHT: safeHeight
  };
}

/* ------------------------------------------------------------
   COLOR HELPERS
------------------------------------------------------------- */

function getSelectedSuit() {
  return document.getElementById("suitSelect")?.value;
}

function getSelectedRank() {
  return document.getElementById("rankSelect")?.value;
}



export function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16)
  };
}

function getRankColor(suitId) {
  if (settings.fontColorMode === 'bi') {
    const isBlackSuit = suitId === 'spades' || suitId === 'clubs';
    const isRedSuit = suitId === 'hearts' || suitId === 'diamonds';
    if (isBlackSuit) return settings.fontColorBlack;
    if (isRedSuit) return settings.fontColorRed;
  }

  if (settings.fontColorMode === 'perSuit') {
    switch (suitId) {
      case 'spades': return settings.fontColorSpades;
      case 'hearts': return settings.fontColorHearts;
      case 'clubs': return settings.fontColorClubs;
      case 'diamonds': return settings.fontColorDiamonds;
      default: break;
    }
  }

  return settings.fontColor;
}

function getIconColor(suitId) {
  if (settings.iconColorMode === 'standard') return null;

  if (settings.iconColorMode === 'bi') {
    const isBlackSuit = suitId === 'spades' || suitId === 'clubs';
    const isRedSuit = suitId === 'hearts' || suitId === 'diamonds';
    if (isBlackSuit) return settings.iconColorBlack;
    if (isRedSuit) return settings.iconColorRed;
  }

  if (settings.iconColorMode === 'perSuit') {
    switch (suitId) {
      case 'spades': return settings.iconColorSpades;
      case 'hearts': return settings.iconColorHearts;
      case 'clubs': return settings.iconColorClubs;
      case 'diamonds': return settings.iconColorDiamonds;
      default: break;
    }
  }

  return settings.iconColor;
}

function fillBackground(ctx) {
  const { CARD_WIDTH, CARD_HEIGHT } = getGeometry();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const style = settings.backgroundStyle || 'solid';
  const colorA = settings.backgroundColorPrimary || '#ffffff';
  const colorB = settings.backgroundColorSecondary || colorA;

  if (style === 'solid') {
    ctx.fillStyle = colorA;
  } else {
    let gradient;
    if (style === 'radial') {
      const radius = Math.hypot(CARD_WIDTH, CARD_HEIGHT) / 2;
      gradient = ctx.createRadialGradient(
        CARD_WIDTH / 2,
        CARD_HEIGHT / 2,
        0,
        CARD_WIDTH / 2,
        CARD_HEIGHT / 2,
        radius
      );
    } else {
      let x0 = 0, y0 = 0, x1 = CARD_WIDTH, y1 = CARD_HEIGHT;
      if (style === 'horizontal') {
        y1 = 0;
      } else if (style === 'vertical') {
        x1 = 0;
      } else if (style === 'diagUp') {
        x0 = 0; y0 = CARD_HEIGHT; x1 = CARD_WIDTH; y1 = 0;
      } else {
        x0 = 0; y0 = 0; x1 = CARD_WIDTH; y1 = CARD_HEIGHT;
      }
      gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    }

    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);
    ctx.fillStyle = gradient;
  }

  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.restore();
}

/* ------------------------------------------------------------
   SUIT ICON RENDERING (same as before)
------------------------------------------------------------- */

function drawSuitIcon(ctx, suitId, x, y, size, rotationRad = 0) {
  if (!settings.iconSheet) return;

  const suit = SUITS.find(s => s.id === suitId);
  if (!suit) return;

  const sheet = settings.iconSheet;
  const cellWidth = sheet.width / 2;
  const cellHeight = sheet.height / 2;

  const sx = suit.gridX * cellWidth;
  const sy = suit.gridY * cellHeight;
  const sw = cellWidth;
  const sh = cellHeight;

  const dw = size * settings.iconScale;
  const dh = size * settings.iconScale;

  const iconColor = getIconColor(suitId);
  const hasTint = !!iconColor && (() => {
    const { r, g, b } = hexToRgb(iconColor);
    return r !== 0 || g !== 0 || b !== 0;
  })();

  // Fast path: no tint
  if (!hasTint) {
    ctx.save();
    ctx.translate(x, y);
    if (rotationRad) ctx.rotate(rotationRad);

    const dx = -dw / 2;
    const dy = -dh / 2;

    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * settings.iconOpacity;

    ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.globalAlpha = prevAlpha;
    ctx.restore();
    return;
  }

  // Tint path
  const { r, g, b } = hexToRgb(iconColor || '#000000');

  iconWorkCanvas.width = sw;
  iconWorkCanvas.height = sh;
  iconWorkCtx.clearRect(0, 0, sw, sh);

  iconWorkCtx.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
  const imageData = iconWorkCtx.getImageData(0, 0, sw, sh);
  const data = imageData.data;

  const opacity = settings.iconOpacity;
  const rFactor = r / 255;
  const gFactor = g / 255;
  const bFactor = b / 255;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;

    data[i]     = Math.round(data[i] * rFactor);
    data[i + 1] = Math.round(data[i + 1] * gFactor);
    data[i + 2] = Math.round(data[i + 2] * bFactor);
    data[i + 3] = alpha * opacity;
  }

  iconWorkCtx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.translate(x, y);
  if (rotationRad) ctx.rotate(rotationRad);

  const dx = -dw / 2;
  const dy = -dh / 2;
  ctx.drawImage(iconWorkCanvas, 0, 0, sw, sh, dx, dy, dw, dh);

  ctx.restore();
}

/* ------------------------------------------------------------
   RANK TEXT (unchanged)
------------------------------------------------------------- */

function drawRankText(ctx, text, x, y, align = 'left', baseline = 'top', options = {}) {
  ctx.save();

  const fontSize = options.fontSize ?? settings.fontSize;
  const fontWeight = options.fontWeight ?? settings.fontWeight;
  const fontFamily = options.fontFamily ?? settings.fontFamily;
  const fontColor = options.fontColor ?? settings.fontColor;
  const fontOpacity = options.fontOpacity ?? settings.fontOpacity;
  const overlayType = options.overlayType ?? settings.overlayType;
  const outline = typeof options.outline === 'boolean' ? options.outline : settings.outline;
  const outlineWidth = options.outlineWidth ?? settings.outlineWidth;
  const outlineColor = options.outlineColor ?? settings.outlineColor;

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  ctx.fillStyle = hexToRgba(fontColor, fontOpacity);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (overlayType === 'shadow') {
    ctx.shadowColor = hexToRgba('#000000', 0.35);
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  } else if (overlayType === 'glow') {
    ctx.shadowColor = hexToRgba(fontColor, 0.7);
    ctx.shadowBlur = 10;
  }

  ctx.fillText(text, x, y);

  if (outline && outlineWidth > 0) {
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outlineColor;
    ctx.strokeText(text, x, y);
  }

  ctx.restore();
}

function getAdjustedCornerFontSize(rank, requestedSize, rankOrientation) {
  const { BLEED, SAFE_HEIGHT } = getGeometry();
  if (rankOrientation !== 'vertical') return requestedSize;

  let fontSize = requestedSize;

  for (let i = 0; i < 2; i++) {
    const marginY = BLEED + fontSize * 0.3;
    const availableHeight = SAFE_HEIGHT - marginY * 2;
    const requiredHeight = fontSize * 0.95 * rank.length;

    if (requiredHeight <= availableHeight || availableHeight <= 0) {
      break;
    }

    fontSize *= availableHeight / requiredHeight;
  }

  return fontSize;
}

/* ------------------------------------------------------------
   CORNER RENDERING (unchanged)
------------------------------------------------------------- */

function drawCorners(ctx, suitId, rank, mirror, options = {}) {
  const { BLEED, CARD_WIDTH, CARD_HEIGHT, SAFE_WIDTH, SAFE_HEIGHT } = getGeometry();
  const rankOrientation = options.rankOrientation || 'horizontal';
  let fontSize = getAdjustedCornerFontSize(rank, options.fontSize ?? settings.fontSize, rankOrientation);
  const layout = options.layout ?? settings.layout;
  const rankColor = getRankColor(suitId);

  const marginX = BLEED + fontSize * 0.3;
  const marginY = BLEED + fontSize * 0.3;

  const topX = marginX;
  const topY = marginY;

  const iconSize = fontSize * 0.9;
  const lineHeight = rankOrientation === 'vertical' ? fontSize * 0.95 : fontSize;

  function measureRank(ctx2) {
    if (rankOrientation === 'vertical') {
      const widths = [...rank].map(letter => ctx2.measureText(letter).width || 0);
      return {
        width: widths.length ? Math.max(...widths) : 0,
        height: lineHeight * rank.length
      };
    }

    const metrics = ctx2.measureText(rank);
    return { width: metrics.width, height: fontSize };
  }

  function drawRankMark(ctx2, rankX, rankY) {
    if (rankOrientation === 'vertical') {
      ctx2.save();
      ctx2.translate(rankX + settings.cornerRankOffsetX, rankY + settings.cornerRankOffsetY);
      [...rank].forEach((letter, idx) => {
        drawRankText(ctx2, letter, 0, idx * lineHeight, 'center', 'top', { fontSize, fontColor: rankColor });
      });
      ctx2.restore();
      return;
    }

    drawRankText(
      ctx2,
      rank,
      rankX + settings.cornerRankOffsetX,
      rankY + settings.cornerRankOffsetY,
      'left',
      'top',
      { fontSize, fontColor: rankColor }
    );
  }

  function drawOneCorner(ctx2, baseX, baseY, bottomMirrored) {
    ctx2.save();

    if (bottomMirrored) {
      ctx2.translate(CARD_WIDTH, CARD_HEIGHT);
      ctx2.rotate(Math.PI);
    }

    ctx2.font = `${settings.fontWeight} ${fontSize}px "${settings.fontFamily}"`;
    const { width: rankWidth } = measureRank(ctx2);

    const suitDrawSize = iconSize * settings.iconScale;
    const centeredRankX = baseX + (suitDrawSize - rankWidth) / 2;

    if (layout === 'rankAboveSuit') {
      const rankX = centeredRankX;
      const rankY = baseY;

      const suitX = baseX;
      const suitY = baseY + fontSize * 1.2;

      drawRankMark(ctx2, rankX, rankY);

      drawSuitIcon(
        ctx2,
        suitId,
        suitX + settings.cornerSuitOffsetX + suitDrawSize / 2,
        suitY + settings.cornerSuitOffsetY,
        iconSize
      );

    } else if (layout === 'suitAboveRank') {
      const suitX = baseX;
      const suitY = baseY;

      const rankX = centeredRankX;
      const rankY = baseY + fontSize * 1.2;

      drawSuitIcon(
        ctx2,
        suitId,
        suitX + settings.cornerSuitOffsetX + suitDrawSize / 2,
        suitY + settings.cornerSuitOffsetY,
        iconSize
      );

      drawRankMark(ctx2, rankX, rankY);

    } else {
      // side-by-side
      const rankX = centeredRankX;
      const rankY = baseY;

      const suitX = baseX + suitDrawSize + fontSize * 0.2;
      const suitY = baseY + fontSize * 0.45;

      drawRankMark(ctx2, rankX, rankY);

      drawSuitIcon(
        ctx2,
        suitId,
        suitX + settings.cornerSuitOffsetX,
        suitY + settings.cornerSuitOffsetY,
        iconSize
      );
    }

    ctx2.restore();
  }

  drawOneCorner(ctx, topX, topY, false);
  if (mirror) drawOneCorner(ctx, topX, topY, true);
}

/* ------------------------------------------------------------
   FACE IMAGE (unchanged)
------------------------------------------------------------- */

function drawFaceImage(ctx, card) {
  const { CARD_WIDTH, CARD_HEIGHT, SAFE_WIDTH, SAFE_HEIGHT } = getGeometry();
  const img = card.faceImage;
  if (!img || !img.complete) return;

  const safeCenterX = CARD_WIDTH / 2 + card.offsetX;
  const safeCenterY = CARD_HEIGHT / 2 + card.offsetY;

  const maxW = SAFE_WIDTH;
  const maxH = SAFE_HEIGHT;

  const baseScale = Math.min(maxW / img.width, maxH / img.height);

  const scaleX = baseScale * card.scale * (card.flipH ? -1 : 1);
  const scaleY = baseScale * card.scale * (card.flipV ? -1 : 1);

  ctx.save();
  ctx.translate(safeCenterX, safeCenterY);
  ctx.rotate(card.rotation * Math.PI / 180);
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

/* ------------------------------------------------------------
   NEW DRAW PIPS (uses pips.js)
------------------------------------------------------------- */

function getPipIconSize() {
  return settings.fontSize * 1.4;
}

function drawPips(ctx, suitId, rank) {
  const { BLEED, SAFE_WIDTH, SAFE_HEIGHT } = getGeometry();
  if (!settings.showPips) return;

  const layout = getPipLayout(rank);
  if (!layout.length) return;

  const size = getPipIconSize();

  layout.forEach(p => {
    const px = BLEED + p.x * SAFE_WIDTH;
    const py = BLEED + p.y * SAFE_HEIGHT;
    const rot = p.rotate180 ? Math.PI : 0;

    drawSuitIcon(ctx, suitId, px, py, size, rot);
  });
}

/* ------------------------------------------------------------
   FULL CARD RENDER
------------------------------------------------------------- */

export function renderCard(ctx, suitId, rank, copyIndex = 1) {
  const card = getCurrentCard(suitId, rank, copyIndex);
  if (!card) return;

  renderCardSurface(ctx, {
    card,
    suitId,
    rankLabel: rank,
    pipRank: rank
  });
}

/* ------------------------------------------------------------
   PREVIEW VERSION (with overlays)
------------------------------------------------------------- */

export function renderCardForPreview(ctx, suitId, rank, copyIndex = 1, showOverlays = true) {
  if (!ctx) {
    const canvas = document.getElementById("cardCanvas");
    ctx = canvas.getContext("2d");
  }

  if (!suitId || !rank) {
    suitId = suitId || document.getElementById("suitSelect")?.value;
    const rawRank = rank || document.getElementById("rankSelect")?.value;
    const parts = (rawRank || "").split("__");
    rank = parts[0];
    copyIndex = Number(parts[1]) || 1;
  }

  if (!suitId || !rank) return;

  renderCard(ctx, suitId, rank, copyIndex);

  if (showOverlays) {
    renderOverlays(ctx, getGeometry());
  }
}

/* ------------------------------------------------------------
   EXPORT VERSION (clean)
------------------------------------------------------------- */

export function renderCardForExport(ctx, suitId, rank, copyIndex = 1) {
  renderCard(ctx, suitId, rank, copyIndex);
}

/* ------------------------------------------------------------
   JOKER (unchanged)
------------------------------------------------------------- */

export function renderJokerCard(ctx, index, { preview = false } = {}) {
  const card = getJokerCard(index);
  if (!card) return;

  const baseLabel = settings.jokerLabel || 'JOKER';
  const cornerOptions = {
    fontSize: settings.jokerFontSize || settings.fontSize,
    rankOrientation: settings.jokerLabelOrientation || 'horizontal'
  };

  renderCardSurface(ctx, {
    card,
    suitId: JOKER_SUIT_ID,
    rankLabel: baseLabel,
    pipRank: null,
    cornerOptions
  });

  drawJokerSuits(ctx, settings.jokerSuitStyle);

  if (preview) {
    renderOverlays(ctx, getGeometry());
  }
}

function getPipGuidelinesWithFallback() {
  const { BLEED, SAFE_HEIGHT } = getGeometry();
  if (pipGuidelineYs.length === 5) return pipGuidelineYs;

  const safeTopY = BLEED;
  const safeBottomY = BLEED + SAFE_HEIGHT;
  const safeHeight = safeBottomY - safeTopY;

  return [
    safeTopY + settings.pipTop * safeHeight,
    safeTopY + settings.pipInnerTop * safeHeight,
    safeTopY + settings.pipCenter * safeHeight,
    safeTopY + settings.pipInnerBottom * safeHeight,
    safeTopY + settings.pipBottom * safeHeight
  ];
}

function getJokerLabelMetrics() {
  const { BLEED } = getGeometry();
  const text = settings.jokerLabel || 'JOKER';
  const rankOrientation = settings.jokerLabelOrientation || 'horizontal';
  const fontSize = getAdjustedCornerFontSize(text, settings.jokerFontSize || settings.fontSize, rankOrientation);

  measureCtx.font = `${settings.fontWeight} ${fontSize}px "${settings.fontFamily}"`;

  const lineHeight = rankOrientation === 'vertical' ? fontSize * 0.95 : fontSize;
  const width =
    rankOrientation === 'vertical'
      ? Math.max(...[...text].map(letter => measureCtx.measureText(letter).width || 0), 0)
      : measureCtx.measureText(text).width;
  const height = rankOrientation === 'vertical' ? lineHeight * text.length : fontSize;
  const marginY = BLEED + fontSize * 0.3;

  return {
    fontSize,
    lineHeight,
    width,
    height,
    marginY,
    labelBottomY: marginY + height
  };
}

function mirrorPlacementsVertically(placements) {
  const { CARD_HEIGHT } = getGeometry();
  return placements.map(pos => ({
    ...pos,
    y: CARD_HEIGHT - pos.y,
    rotation: (pos.rotation || 0) + Math.PI
  }));
}

function getJokerSuitPlacements(mode) {
  const { BLEED, SAFE_WIDTH, SAFE_HEIGHT, CARD_HEIGHT } = getGeometry();
  const [topY, innerTopY, centerY, innerBottomY, bottomY] = getPipGuidelinesWithFallback();
  const centerX = BLEED + settings.pipCenterX * SAFE_WIDTH;
  const leftX = BLEED + settings.pipLeft * SAFE_WIDTH;
  const rightX = BLEED + settings.pipRight * SAFE_WIDTH;

  const innerSpanX = rightX - leftX;
  const verticalSpan = innerBottomY - innerTopY;
  const radius = Math.max(Math.min(innerSpanX, verticalSpan) / 2, Math.min(SAFE_WIDTH, SAFE_HEIGHT) * 0.08);
  const rowSpacing = innerSpanX / 3 || SAFE_WIDTH * 0.12;
  const labelMetrics = getJokerLabelMetrics();
  const belowLabelY = Math.min(
    labelMetrics.labelBottomY + labelMetrics.fontSize * 0.4,
    BLEED + SAFE_HEIGHT - labelMetrics.fontSize * 0.6
  );

  switch (mode) {
    case 'centerCircle':
      return [
        { x: centerX, y: centerY - radius },
        { x: centerX + radius, y: centerY },
        { x: centerX, y: centerY + radius, rotation: Math.PI },
        { x: centerX - radius, y: centerY }
      ];
    case 'centerSquare':
      return [
        { x: leftX, y: innerTopY },
        { x: rightX, y: innerTopY },
        { x: rightX, y: innerBottomY, rotation: Math.PI },
        { x: leftX, y: innerBottomY, rotation: Math.PI }
      ];
    case 'diamond':
      return [
        { x: centerX, y: topY },
        { x: rightX, y: centerY },
        { x: centerX, y: bottomY, rotation: Math.PI },
        { x: leftX, y: centerY }
      ];
    case 'belowLabelRow': {
      const row = [-1.5, -0.5, 0.5, 1.5].map(mult => ({
        x: centerX + rowSpacing * mult,
        y: belowLabelY,
        scale: 0.7
      }));
      const mirrored = mirrorPlacementsVertically(row);
      return [...row, ...mirrored];
    }
    case 'centerRowSplit':
      return [-1.5, -0.5, 0.5, 1.5].map((mult, idx) => ({
        x: centerX + rowSpacing * mult,
        y: centerY,
        rotation: idx < 2 ? 0 : Math.PI
      }));
    case 'centerColumn':
      return [
        { x: centerX, y: topY },
        { x: centerX, y: innerTopY },
        { x: centerX, y: innerBottomY, rotation: Math.PI },
        { x: centerX, y: bottomY, rotation: Math.PI }
      ];
    case 'cornerRows': {
      const offsetX = Math.min(innerSpanX * 0.2, SAFE_WIDTH * 0.18);
      const rowY = Math.max(belowLabelY, topY);
      const rowFactory = (baseX, y, rotation = 0) =>
        [-1.5, -0.5, 0.5, 1.5].map(mult => ({
          x: baseX + rowSpacing * 0.9 * mult,
          y,
          rotation,
          scale: 0.65
        }));
      const topRow = rowFactory(centerX - offsetX, rowY, 0);
      const bottomRow = rowFactory(centerX + offsetX, CARD_HEIGHT - rowY, Math.PI);
      return [...topRow, ...bottomRow];
    }
    default:
      return [];
  }
}

function drawJokerSuits(ctx, mode) {
  if (!mode || mode === 'none') return;

  const placements = getJokerSuitPlacements(mode);
  if (!placements.length) return;

  const baseSize = getPipIconSize();

  placements.forEach((pos, idx) => {
    const suit = SUITS[idx % SUITS.length];
    const size = baseSize * (pos.scale || 1);
    const rotation = pos.rotation || 0;
    drawSuitIcon(ctx, suit.id, pos.x, pos.y, size, rotation);
  });
}

function renderCardSurface(ctx, { card, suitId, rankLabel, pipRank, cornerOptions }) {
  const { CARD_WIDTH, CARD_HEIGHT, BLEED, SAFE_HEIGHT, SAFE_WIDTH } = getGeometry();
  if (!card) return;

  fillBackground(ctx);

  const safeTopY = BLEED;
  const safeBottomY = BLEED + SAFE_HEIGHT;
  computePipGuidelines(CARD_HEIGHT, safeTopY, safeBottomY);

  drawFaceImage(ctx, card);

  if (pipRank) {
    drawPips(ctx, suitId, pipRank);
  }

  renderAbilityText(ctx, suitId, rankLabel, card, drawSuitIcon);

  const mirror =
    typeof card.mirrorCorners === 'boolean'
      ? card.mirrorCorners
      : true;

  drawCorners(ctx, suitId, rankLabel, mirror, cornerOptions);
}

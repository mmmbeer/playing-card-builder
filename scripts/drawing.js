// drawing.js
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  BLEED,
  SAFE_WIDTH,
  SAFE_HEIGHT,
  SUITS
} from './config.js';

import {
  settings,
  deck,
  iconWorkCanvas,
  iconWorkCtx,
  computePipGuidelines
} from './state.js';

import { getPipLayout } from './pips.js'; // NEW

import { renderOverlays } from './overlays.js';

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

  // Fast path: no tint
  if (settings.iconColor.toLowerCase() === '#000000') {
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
  iconWorkCanvas.width = sw;
  iconWorkCanvas.height = sh;
  iconWorkCtx.clearRect(0, 0, sw, sh);

  iconWorkCtx.drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
  const imageData = iconWorkCtx.getImageData(0, 0, sw, sh);
  const data = imageData.data;

  const { r, g, b } = hexToRgb(settings.iconColor);
  const opacity = settings.iconOpacity;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;

    data[i]     = r;
    data[i + 1] = g;
    data[i + 2] = b;
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

function drawRankText(ctx, text, x, y, align = 'left', baseline = 'top') {
  ctx.save();

  ctx.font = `${settings.fontWeight} ${settings.fontSize}px "${settings.fontFamily}"`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  ctx.fillStyle = hexToRgba(settings.fontColor, settings.fontOpacity);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (settings.overlayType === 'shadow') {
    ctx.shadowColor = hexToRgba('#000000', 0.35);
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  } else if (settings.overlayType === 'glow') {
    ctx.shadowColor = hexToRgba(settings.fontColor, 0.7);
    ctx.shadowBlur = 10;
  }

  ctx.fillText(text, x, y);

  if (settings.outline && settings.outlineWidth > 0) {
    ctx.lineWidth = settings.outlineWidth;
    ctx.strokeStyle = settings.outlineColor;
    ctx.strokeText(text, x, y);
  }

  ctx.restore();
}

/* ------------------------------------------------------------
   CORNER RENDERING (unchanged)
------------------------------------------------------------- */

function drawCorners(ctx, suitId, rank, mirror) {
  const marginX = BLEED + settings.fontSize * 0.3;
  const marginY = BLEED + settings.fontSize * 0.3;

  const topX = marginX;
  const topY = marginY;

  const fontSize = settings.fontSize;
  const iconSize = fontSize * 0.9;

  function drawOneCorner(ctx2, baseX, baseY, bottomMirrored) {
    ctx2.save();

    if (bottomMirrored) {
      ctx2.translate(CARD_WIDTH, CARD_HEIGHT);
      ctx2.rotate(Math.PI);
    }

    ctx2.font = `${settings.fontWeight} ${settings.fontSize}px "${settings.fontFamily}"`;
    const metrics = ctx2.measureText(rank);
    const rankWidth = metrics.width;

    const suitDrawSize = iconSize * settings.iconScale;
    const centeredRankX = baseX + (suitDrawSize - rankWidth) / 2;

    if (settings.layout === 'rankAboveSuit') {
      const rankX = centeredRankX;
      const rankY = baseY;

      const suitX = baseX;
      const suitY = baseY + fontSize * 1.2;

      drawRankText(
        ctx2,
        rank,
        rankX + settings.cornerRankOffsetX,
        rankY + settings.cornerRankOffsetY,
        'left',
        'top'
      );

      drawSuitIcon(
        ctx2,
        suitId,
        suitX + settings.cornerSuitOffsetX + suitDrawSize / 2,
        suitY + settings.cornerSuitOffsetY,
        iconSize
      );

    } else if (settings.layout === 'suitAboveRank') {
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

      drawRankText(
        ctx2,
        rank,
        rankX + settings.cornerRankOffsetX,
        rankY + settings.cornerRankOffsetY,
        'left',
        'top'
      );

    } else {
      // side-by-side
      const rankX = centeredRankX;
      const rankY = baseY;

      const suitX = baseX + suitDrawSize + fontSize * 0.2;
      const suitY = baseY + fontSize * 0.45;

      drawRankText(
        ctx2,
        rank,
        rankX + settings.cornerRankOffsetX,
        rankY + settings.cornerRankOffsetY,
        'left',
        'top'
      );

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

function drawPips(ctx, suitId, rank) {
  if (!settings.showPips) return;

  const layout = getPipLayout(rank);
  if (!layout.length) return;

  const size = settings.fontSize * 1.4;

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

export function renderCard(ctx, suitId, rank) {
	
	
	// console.log( `renderCard: suitId: ${suitId}; rank: ${rank}`);
	
	
  const card = deck[suitId][rank];

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const safeTopY = BLEED;
  const safeBottomY = BLEED + SAFE_HEIGHT;
  computePipGuidelines(CARD_HEIGHT, safeTopY, safeBottomY);

  drawFaceImage(ctx, card);
  drawPips(ctx, suitId, rank);

  const mirror =
    typeof card.mirrorCorners === 'boolean'
      ? card.mirrorCorners
      : settings.mirrorDefault;

  drawCorners(ctx, suitId, rank, mirror);
}

/* ------------------------------------------------------------
   PREVIEW VERSION (with overlays)
------------------------------------------------------------- */

export function renderCardForPreview(ctx, suitId, rank) {
  // 1. Resolve context if missing
  if (!ctx) {
    const canvas = document.getElementById("cardCanvas");
    if (!canvas) {
      console.error("renderCardForPreview: canvas not found");
      return;
    }
    ctx = canvas.getContext("2d");
  }

  // 2. Resolve suit/rank if missing
  if (!suitId || !rank) {
    suitId = suitId || document.getElementById("suitSelect")?.value;
    rank   = rank   || document.getElementById("rankSelect")?.value;
  }

  // 3. Reject if still incomplete
  if (!suitId || !rank) {
    console.warn("renderCardForPreview: missing suit/rank");
    return;
  }

  // 4. Delegate to main renderer
  renderCard(ctx, suitId, rank);
  renderOverlays(ctx, CARD_WIDTH, CARD_HEIGHT);
}


/* ------------------------------------------------------------
   EXPORT VERSION (clean)
------------------------------------------------------------- */

export function renderCardForExport(ctx, suitId, rank) {
  renderCard(ctx, suitId, rank);
}

/* ------------------------------------------------------------
   JOKER (unchanged)
------------------------------------------------------------- */

export function renderJokerCard(ctx, index, { preview = false } = {}) {
  const baseLabel = settings.jokerLabel || 'JOKER';
  const text = settings.jokerWild ? `${baseLabel} (WILD)` : baseLabel;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.save();
  ctx.font = `${settings.fontWeight} ${Math.round(settings.fontSize * 1.4)}px "${settings.fontFamily}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = hexToRgba(settings.fontColor, settings.fontOpacity);
  ctx.fillText(text, CARD_WIDTH / 2, CARD_HEIGHT / 2);
  ctx.restore();

  if (preview) {
    renderOverlays(ctx, CARD_WIDTH, CARD_HEIGHT);
  }
}

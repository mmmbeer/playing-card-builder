import { CARD_WIDTH, CARD_HEIGHT, BLEED } from './config.js';
import { settings } from './state.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';

const PADDING = 14;
const BLOCK_SPACING = 8;

function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function estimateCornerWidth(ctx, rank) {
  ctx.save();
  ctx.font = `${settings.fontWeight} ${settings.fontSize}px "${settings.fontFamily}"`;
  const rankWidth = ctx.measureText(rank || '10').width;
  const iconWidth = settings.fontSize * 0.9 * settings.iconScale;
  ctx.restore();
  return BLEED + Math.max(rankWidth, iconWidth) + settings.fontSize * 0.8;
}

function normalizeInline(text) {
  const html = marked.parseInline(text || '');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function getBlocks(markdown) {
  const tokens = marked.lexer(markdown || '');
  const blocks = [];

  tokens.forEach(token => {
    if (token.type === 'heading') {
      blocks.push({ type: 'heading', text: normalizeInline(token.text) });
    } else if (token.type === 'list') {
      token.items.forEach((item, idx) => blocks.push({
        type: 'listItem',
        text: `${token.ordered ? `${idx + 1}. ` : '• '}${normalizeInline(item.text)}`,
        ordered: token.ordered
      }));
    } else if (token.type === 'paragraph') {
      blocks.push({ type: 'paragraph', text: normalizeInline(token.text) });
    } else if (token.type === 'text') {
      blocks.push({ type: 'paragraph', text: normalizeInline(token.text) });
    }
  });

  return blocks;
}

const SUIT_TAG_MAP = {
  suit: null,
  spade: 'spades',
  spades: 'spades',
  heart: 'hearts',
  hearts: 'hearts',
  club: 'clubs',
  clubs: 'clubs',
  diamond: 'diamonds',
  diamonds: 'diamonds'
};

function segmentText(raw) {
  const parts = raw.split(/(::(suit|spades?|hearts?|clubs?|diamonds?)::)/gi);

  return parts.filter(Boolean).map(part => {
    const match = part.match(/^::(suit|spades?|hearts?|clubs?|diamonds?)::$/i);
    if (match) {
      const key = match[1].toLowerCase();
      return SUIT_TAG_MAP.hasOwnProperty(key)
        ? { type: 'pip', suitId: SUIT_TAG_MAP[key] || undefined }
        : { type: 'pip' };
    }
    return { type: 'text', text: part };
  });
}

function wrapSegments(ctx, segments, maxWidth, fontConfig, pipSize) {
  const lines = [];
  let currentLine = [];
  let lineWidth = 0;

  const spaceWidth = ctx.measureText(' ').width;

  function pushLine() {
    lines.push({ segments: currentLine, width: lineWidth });
    currentLine = [];
    lineWidth = 0;
  }

  segments.forEach(seg => {
    if (seg.type === 'pip') {
      if (lineWidth + pipSize > maxWidth && currentLine.length) {
        pushLine();
      }
      currentLine.push({ type: 'pip', width: pipSize, suitId: seg.suitId });
      lineWidth += pipSize;
      return;
    }

    const words = seg.text.split(/(\s+)/);
    words.forEach(word => {
      if (!word) return;
      const isSpace = /^\s+$/.test(word);
      const width = isSpace ? spaceWidth : ctx.measureText(word).width;

      if (!isSpace && lineWidth + width > maxWidth && currentLine.length) {
        pushLine();
      }

      if (!(isSpace && currentLine.length === 0)) {
        currentLine.push({ type: isSpace ? 'space' : 'text', text: word, width });
        lineWidth += width;
      }
    });
  });

  if (currentLine.length) pushLine();
  return lines;
}

function layoutBlocks(ctx, blocks, maxWidth, pipSize) {
  const layouts = [];

  blocks.forEach(block => {
    const isHeading = block.type === 'heading';
    const fontSize = isHeading ? settings.abilityHeaderFontSize : settings.abilityBodyFontSize;
    const fontWeight = isHeading ? settings.abilityHeaderFontWeight : settings.abilityBodyFontWeight;
    const fontFamily = isHeading ? settings.abilityHeaderFontFamily : settings.abilityBodyFontFamily;
    const lineHeight = fontSize * 1.3;

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
    const lines = wrapSegments(ctx, segmentText(block.text), maxWidth, { fontSize, fontWeight, fontFamily }, pipSize);
    ctx.restore();

    layouts.push({
      lines,
      lineHeight,
      isHeading,
      fontSize,
      fontWeight,
      fontFamily
    });
  });

  return layouts;
}

function measureHeight(layouts) {
  let height = 0;
  layouts.forEach((layout, idx) => {
    const blockHeight = layout.lines.length * layout.lineHeight;
    height += blockHeight;
    if (idx < layouts.length - 1) height += BLOCK_SPACING;
  });
  return height + PADDING * 2;
}

function drawPip(ctx, drawSuitIcon, suitId, x, y, size) {
  drawSuitIcon(ctx, suitId, x, y, size);
}

function drawLayouts(ctx, layouts, rect, suitId, drawSuitIcon, pipSize, align) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  let yCursor = rect.y + PADDING;

  layouts.forEach((layout, idx) => {
    layout.lines.forEach(line => {
      ctx.save();
      ctx.font = `${layout.fontWeight} ${layout.fontSize}px "${layout.fontFamily}"`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hexToRgba(settings.abilityTextColor, settings.abilityTextOpacity);

      const lineWidth = line.width;
      let xCursor = rect.x + PADDING;
      if (align === 'center') {
        xCursor += (rect.w - PADDING * 2 - lineWidth) / 2;
      } else if (align === 'right') {
        xCursor += (rect.w - PADDING * 2 - lineWidth);
      }

      const yCenter = yCursor + layout.lineHeight / 2;

      line.segments.forEach(seg => {
        if (seg.type === 'pip') {
          const pipSuitId = seg.suitId || suitId;
          drawPip(ctx, drawSuitIcon, pipSuitId, xCursor + pipSize / 2, yCenter, pipSize);
          xCursor += pipSize;
        } else if (seg.type === 'space') {
          xCursor += seg.width;
        } else {
          ctx.fillText(seg.text, xCursor, yCenter);
          xCursor += seg.width;
        }
      });

      ctx.restore();
      yCursor += layout.lineHeight;
    });

    if (idx < layouts.length - 1) {
      yCursor += BLOCK_SPACING;
    }
  });

  ctx.restore();
}

export function renderAbilityText(ctx, suitId, rank, card, drawSuitIcon, allowMirror = true) {
  const markdown = card?.abilityMarkdown || '';
  if (!markdown.trim()) return;

  const cornerWidth = estimateCornerWidth(ctx, rank);
  const baseWidth = CARD_WIDTH - cornerWidth * 2;
  const targetWidth = baseWidth * (settings.abilityWidthPercent / 100);

  const pipSize = settings.abilityBodyFontSize * 0.9;
  const blocks = getBlocks(markdown);
  if (!blocks.length) return;

  const layouts = layoutBlocks(ctx, blocks, targetWidth - PADDING * 2, pipSize);
  let panelHeight = measureHeight(layouts);
  const desiredHeight = settings.abilityHeightMode === 'fixed'
    ? settings.abilityFixedHeight
    : panelHeight;

  let scale = 1;
  if (settings.abilityHeightMode === 'fixed') {
    if (settings.abilityOverflow === 'shrink' && panelHeight > desiredHeight) {
      scale = desiredHeight / panelHeight;
      panelHeight = desiredHeight;
    } else {
      panelHeight = desiredHeight;
    }
  }

  const align = settings.abilityAlignment || 'center';
  const xBase = cornerWidth;
  let panelX = xBase;
  if (align === 'center') {
    panelX = xBase + (baseWidth - targetWidth) / 2;
  } else if (align === 'right') {
    panelX = xBase + (baseWidth - targetWidth);
  }

  const marginY = settings.fontSize * 0.6;
  const panelY = settings.abilityPlacement === 'top'
    ? BLEED + marginY
    : CARD_HEIGHT - BLEED - marginY - panelHeight;

  ctx.save();
  ctx.translate(panelX, panelY);
  ctx.scale(scale, scale);

  const scaledWidth = targetWidth / scale;
  const scaledHeight = panelHeight / scale;

  if (settings.abilityHeightMode === 'fixed' && settings.abilityOverflow === 'hidden') {
    ctx.beginPath();
    ctx.rect(0, 0, scaledWidth, scaledHeight);
    ctx.clip();
  }

  if (settings.abilityBackgroundOpacity > 0) {
    ctx.fillStyle = hexToRgba(settings.abilityBackground, settings.abilityBackgroundOpacity);
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
  }

  drawLayouts(
    ctx,
    layouts,
    { x: 0, y: 0, w: scaledWidth, h: scaledHeight },
    suitId,
    drawSuitIcon,
    pipSize,
    align
  );
  ctx.restore();

  if (allowMirror && settings.abilityMirror) {
    ctx.save();
    ctx.translate(CARD_WIDTH, CARD_HEIGHT);
    ctx.rotate(Math.PI);
    renderAbilityText(ctx, suitId, rank, card, drawSuitIcon, false);
    ctx.restore();
  }
}

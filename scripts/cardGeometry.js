import {
  CARD_WIDTH as DEFAULT_CARD_WIDTH,
  CARD_HEIGHT as DEFAULT_CARD_HEIGHT,
  BLEED as DEFAULT_BLEED,
  CARD_IDENTITY as DEFAULT_CARD_IDENTITY
} from './config.js';
import { settings } from './state.js';

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

export function getCardWidth() {
  return toNumber(settings.cardWidth, DEFAULT_CARD_WIDTH);
}

export function getCardHeight() {
  return toNumber(settings.cardHeight, DEFAULT_CARD_HEIGHT);
}

export function getBleed() {
  return toNumber(settings.bleed, DEFAULT_BLEED);
}

export function getSafeWidth() {
  const bleed = getBleed();
  return getCardWidth() - bleed * 2;
}

export function getSafeHeight() {
  const bleed = getBleed();
  return getCardHeight() - bleed * 2;
}

export function getCardIdentity() {
  return settings.deckIdentity || DEFAULT_CARD_IDENTITY;
}

export function getCardMetrics() {
  const cardWidth = getCardWidth();
  const cardHeight = getCardHeight();
  const bleed = getBleed();
  return {
    cardWidth,
    cardHeight,
    bleed,
    safeWidth: cardWidth - bleed * 2,
    safeHeight: cardHeight - bleed * 2,
    cardIdentity: getCardIdentity()
  };
}

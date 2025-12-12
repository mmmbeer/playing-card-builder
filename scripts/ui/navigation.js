// ui/navigation.js
import { JOKER_SUIT_ID } from "../state.js";

export { JOKER_SUIT_ID };

export function encodeRankValue(rank, copyIndex = 1) {
  return `${rank}__${copyIndex}`;
}

export function decodeRankValue(value) {
  const [rank, copyString] = value.split("__");
  const copyIndex = Number(copyString) || 1;

  return { rank, copyIndex };
}

export function enumerateRankSlots(ranks) {
  const totals = ranks.reduce((map, rank) => {
    map[rank] = (map[rank] || 0) + 1;
    return map;
  }, {});

  const seen = {};
  return ranks.map(rank => {
    const copyIndex = (seen[rank] || 0) + 1;
    seen[rank] = copyIndex;
    return { rank, copyIndex, total: totals[rank] };
  });
}

function buildTraversalList(ctx) {
  const { activeRanks, SUITS, includeJokers, jokerCount } = ctx;
  const cards = [];

  SUITS.forEach(suit => {
    const slots = enumerateRankSlots(activeRanks);
    slots.forEach(slot => {
      cards.push({
        suit: suit.id,
        rank: slot.rank,
        copyIndex: slot.copyIndex,
        isJoker: false,
        jokerIndex: null,
        totalCopies: slot.total
      });
    });
  });

  if (includeJokers && jokerCount > 0) {
    const count = Math.min(Math.max(jokerCount, 1), 8);
    for (let i = 1; i <= count; i++) {
      cards.push({
        suit: JOKER_SUIT_ID,
        rank: `JOKER_${i}`,
        copyIndex: 1,
        isJoker: true,
        jokerIndex: i,
        totalCopies: count
      });
    }
  }

  return cards;
}

function cardKey(card) {
  if (card.isJoker) return `${JOKER_SUIT_ID}-${card.jokerIndex}`;
  return `${card.suit}-${card.rank}-${card.copyIndex}`;
}

export function computeNextCard(direction, ctx) {
  const traversal = buildTraversalList(ctx);

  const currentKey = ctx.currentIsJoker
    ? cardKey({ isJoker: true, jokerIndex: ctx.currentJokerIndex })
    : cardKey({ suit: ctx.currentSuitId, rank: ctx.currentRank, copyIndex: ctx.currentCopyIndex });

  const startIndex = Math.max(traversal.findIndex(c => cardKey(c) === currentKey), 0);
  const total = traversal.length;
  const nextIndex = (startIndex + direction + total) % total;

  return traversal[nextIndex];
}

// ui/navigation.js
export function getCardIndex(currentSuitId, currentRank, activeRanks, suits) {
  const s = suits.findIndex(s => s.id === currentSuitId);
  const r = activeRanks.indexOf(currentRank);
  return s * activeRanks.length + r;
}

export function computeNextCard(direction, ctx) {
  const { currentSuitId, currentRank, activeRanks, SUITS } = ctx;
  const total = SUITS.length * activeRanks.length;

  let index =
    getCardIndex(currentSuitId, currentRank, activeRanks, SUITS) + direction;

  if (index < 0) index = total - 1;
  if (index >= total) index = 0;

  const suitIndex = Math.floor(index / activeRanks.length);
  const rankIndex = index % activeRanks.length;

  return {
    suit: SUITS[suitIndex].id,
    rank: activeRanks[rankIndex]
  };
}

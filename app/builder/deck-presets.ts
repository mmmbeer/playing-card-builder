import { getSpecialtyDeck } from "@/app/content/specialty-decks";
import { blankCard, cardKey, createDefaultDeck, SUITS, type DeckSettings } from "./types";

export function createPresetDeck(slug: string): DeckSettings | null {
  const preset = getSpecialtyDeck(slug);
  if (!preset) return null;

  const deck = createDefaultDeck();
  const rankCopies = Object.fromEntries(preset.ranks.map((rank) => [rank, preset.copies]));
  const cards: DeckSettings["cards"] = {};
  for (const suit of SUITS) {
    for (const rank of preset.ranks) {
      for (let copy = 1; copy <= preset.copies; copy += 1) cards[cardKey(suit.id, rank, copy)] = blankCard();
    }
  }

  return {
    ...deck,
    title: `${preset.title} deck`,
    ranks: [...preset.ranks],
    rankCopies,
    cards,
    includeJokers: preset.jokerCount > 0,
    jokerCount: preset.jokerCount || deck.jokerCount,
  };
}

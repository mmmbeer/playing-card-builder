export type SpecialtyDeck = {
  slug: string;
  title: string;
  gameSlug: string;
  cardCount: number;
  ranks: string[];
  copies: number;
  jokerCount: number;
  composition: string;
  explanation: string;
};

export const SPECIALTY_DECKS: SpecialtyDeck[] = [
  { slug: "pinochle", title: "Pinochle", gameSlug: "pinochle", cardCount: 48, ranks: ["A", "10", "K", "Q", "J", "9"], copies: 2, jokerCount: 0, composition: "Two copies of A, 10, K, Q, J, and 9 in each suit", explanation: "The duplicate short deck creates the matching cards needed for marriages, runs, pinochles, and the game's unusual trick-taking structure." },
  { slug: "sheepshead", title: "Sheepshead", gameSlug: "sheepshead", cardCount: 32, ranks: ["A", "10", "K", "Q", "J", "9", "8", "7"], copies: 1, jokerCount: 0, composition: "A, 10, K, Q, J, 9, 8, and 7 in all four standard suits", explanation: "Wisconsin Sheepshead normally uses a 32-card French-suited deck. Queens and jacks become permanent trumps during play, so no separate suit artwork is required." },
  { slug: "euchre", title: "Euchre", gameSlug: "euchre", cardCount: 24, ranks: ["A", "K", "Q", "J", "10", "9"], copies: 1, jokerCount: 0, composition: "A, K, Q, J, 10, and 9 in each suit", explanation: "The familiar 24-card Euchre pack removes every rank below nine. The jack of trump and the same-color jack become the right and left bowers." },
  { slug: "doppelkopf", title: "Doppelkopf", gameSlug: "doppelkopf", cardCount: 48, ranks: ["A", "10", "K", "Q", "J", "9"], copies: 2, jokerCount: 0, composition: "Two copies of A, 10, K, Q, J, and 9 in each suit", explanation: "Doppelkopf uses a doubled 24-card pack. Duplicate cards are intentional and central to its partnerships, trumps, and tie-breaking rules." },
  { slug: "skat", title: "Skat", gameSlug: "skat", cardCount: 32, ranks: ["A", "10", "K", "Q", "J", "9", "8", "7"], copies: 1, jokerCount: 0, composition: "A, 10, K, Q, J, 9, 8, and 7 in each suit", explanation: "A 32-card pack leaves exactly ten cards for each player and two cards for the skat. German-suited packs also exist, but this preset matches common French-suited play." },
  { slug: "belote", title: "Belote", gameSlug: "belote", cardCount: 32, ranks: ["A", "10", "K", "Q", "J", "9", "8", "7"], copies: 1, jokerCount: 0, composition: "A, 10, K, Q, J, 9, 8, and 7 in each suit", explanation: "Belote's trump and plain-suit ranking systems are built around this compact 32-card pack. The same cards also support many regional Belote variants." },
  { slug: "sixty-six", title: "Sixty-Six", gameSlug: "sixty-six", cardCount: 24, ranks: ["A", "10", "K", "Q", "J", "9"], copies: 1, jokerCount: 0, composition: "A, 10, K, Q, J, and 9 in each suit", explanation: "Removing ranks two through eight produces the classic 24-card marriage deck used for Schnapsen's close relative, Sixty-Six." },
  { slug: "bezique", title: "Bezique", gameSlug: "bezique", cardCount: 64, ranks: ["A", "10", "K", "Q", "J", "9", "8", "7"], copies: 2, jokerCount: 0, composition: "Two copies of A, 10, K, Q, J, 9, 8, and 7 in each suit", explanation: "Bezique needs two identical 32-card packs. The duplicate queen of spades and jack of diamonds make the game's namesake double bezique possible." },
  { slug: "canasta", title: "Canasta", gameSlug: "canasta", cardCount: 108, ranks: ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"], copies: 2, jokerCount: 4, composition: "Two complete 52-card decks plus four jokers", explanation: "Canasta needs duplicate ranks for large melds and six wild cards in total. This preset creates two of every suited card and four separate jokers." },
  { slug: "piquet", title: "Piquet", gameSlug: "piquet", cardCount: 32, ranks: ["A", "K", "Q", "J", "10", "9", "8", "7"], copies: 1, jokerCount: 0, composition: "A, K, Q, J, 10, 9, 8, and 7 in each suit", explanation: "The traditional piquet pack removes ranks two through six. Its 32 cards support the deal, discard phase, declarations, and final tricks without leftovers." },
];

export function getSpecialtyDeck(slug: string) {
  return SPECIALTY_DECKS.find((deck) => deck.slug === slug);
}

import type { MetadataRoute } from "next";
import { CARD_GAMES } from "@/app/content/card-games";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: "https://www.deckforged.com/", lastModified, changeFrequency: "monthly", priority: 1 },
    { url: "https://www.deckforged.com/builder", lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: "https://www.deckforged.com/card-games", lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...CARD_GAMES.map((game) => ({ url: `https://www.deckforged.com/card-games/${game.slug}`, lastModified, changeFrequency: "yearly" as const, priority: .7 })),
    { url: "https://www.deckforged.com/specialty-decks", lastModified, changeFrequency: "monthly", priority: 0.85 },
    { url: "https://www.deckforged.com/playing-card-history", lastModified, changeFrequency: "yearly", priority: 0.75 },
    { url: "https://www.deckforged.com/privacy", lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: "https://www.deckforged.com/terms", lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}

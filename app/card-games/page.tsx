import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { ContentHeader, SiteFooter } from "@/app/components/SiteChrome";
import { CARD_GAMES, GAME_CATEGORIES } from "@/app/content/card-games";

export const metadata: Metadata = { title: "Rules for 30 Popular Card Games", description: "Learn the setup, play, and scoring rules for 30 card games played with standard playing cards, from poker and bridge to rummy and solitaire.", alternates: { canonical: "/card-games" } };

export default function CardGamesPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Rules for 30 popular card games", url: "https://www.deckforged.com/card-games", mainEntity: { "@type": "ItemList", itemListElement: CARD_GAMES.map((game, index) => ({ "@type": "ListItem", position: index + 1, url: `https://www.deckforged.com/card-games/${game.slug}`, name: game.title })) } };
  return <main className="content-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ContentHeader />
    <section className="content-hero"><span className="eyebrow">Standard playing card rules</span><h1>Thirty games. One familiar deck.</h1><p>Clear rules for casino games, trick-taking classics, rummy games, family favorites, and solitaire. Every guide covers the deck, setup, turn structure, and scoring.</p></section>
    <div className="content-body">{GAME_CATEGORIES.map((category) => <section className="game-category" key={category}><div className="category-heading"><h2>{category}</h2><span>{CARD_GAMES.filter((game) => game.category === category).length} games</span></div><div className="game-card-grid">{CARD_GAMES.filter((game) => game.category === category).map((game) => <Link className="game-card" href={`/card-games/${game.slug}`} key={game.slug}><span className="game-deck">{game.deck}</span><h3>{game.title}</h3><p>{game.summary}</p><div><span><Users size={14} />{game.players}</span><span><Clock3 size={14} />{game.time}</span></div><strong>Read rules <ArrowRight size={15} /></strong></Link>)}</div></section>)}</div>
    <section className="resource-cta"><div><span className="eyebrow">Need the right cards?</span><h2>Start with a game-ready deck.</h2><p>Ten specialty presets open the builder with the correct ranks, copies, and jokers already configured.</p></div><Link className="button button-primary" href="/specialty-decks">Browse specialty decks <ArrowRight size={17} /></Link></section><SiteFooter />
  </main>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { ContentHeader, SiteFooter } from "@/app/components/SiteChrome";
import { SPECIALTY_DECKS } from "@/app/content/specialty-decks";

export const metadata: Metadata = { title: "Specialty Playing Card Deck Builder Presets", description: "Create Pinochle, Sheepshead, Euchre, Doppelkopf, Skat, Belote, Sixty-Six, Bezique, Canasta, and Piquet decks with one-click rank presets.", alternates: { canonical: "/specialty-decks" } };

export default function SpecialtyDecksPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Specialty playing card deck presets", mainEntity: { "@type": "ItemList", itemListElement: SPECIALTY_DECKS.map((deck, index) => ({ "@type": "ListItem", position: index + 1, name: deck.title, url: `https://www.deckforged.com/card-games/${deck.gameSlug}` })) } };
  return <main className="content-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ContentHeader /><section className="content-hero"><span className="eyebrow">One-click deck setup</span><h1>Build the deck the game actually uses.</h1><p>Short decks, doubled ranks, and extra jokers are easy to get wrong. Each preset opens Deck Forged with the exact common composition already applied.</p></section>
    <div className="specialty-grid">{SPECIALTY_DECKS.map((deck) => <article className="specialty-card" key={deck.slug}><div className="specialty-card-top"><span><Layers3 size={16} />{deck.cardCount} cards</span><div className="mini-suits" aria-hidden="true"><i>♠</i><i>♥</i><i>♣</i><i>♦</i></div></div><h2>{deck.title}</h2><strong>{deck.composition}</strong><p>{deck.explanation}</p><div className="rank-strip" aria-label={`${deck.title} ranks`}>{deck.ranks.map((rank) => <span key={rank}>{rank}{deck.copies > 1 && <small>×{deck.copies}</small>}</span>)}{deck.jokerCount > 0 && <span>Joker<small>×{deck.jokerCount}</small></span>}</div><div className="specialty-actions"><Link className="button button-primary" href={`/builder?preset=${deck.slug}`}>Create deck <ArrowRight size={16} /></Link><Link className="text-link" href={`/card-games/${deck.gameSlug}`}>Rules and explanation</Link></div><small className="draft-warning">Starting a preset replaces the current browser draft.</small></article>)}</div><SiteFooter />
  </main>;
}

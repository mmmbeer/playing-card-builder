import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, ExternalLink, Layers3, Users } from "lucide-react";
import { ContentHeader, SiteFooter } from "@/app/components/SiteChrome";
import { CARD_GAMES, getCardGame } from "@/app/content/card-games";
import { getSpecialtyDeck } from "@/app/content/specialty-decks";

export function generateStaticParams() { return CARD_GAMES.map((game) => ({ slug: game.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const game = getCardGame((await params).slug); if (!game) return {}; return { title: `How to Play ${game.title}: Rules, Setup & Scoring`, description: `${game.summary} Learn the deck, setup, turn sequence, scoring, and common rule choices.`, alternates: { canonical: `/card-games/${game.slug}` } }; }

export default async function CardGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const game = getCardGame((await params).slug); if (!game) notFound();
  const preset = game.preset ? getSpecialtyDeck(game.preset) : undefined;
  const steps = [...game.setup, ...game.play, ...game.scoring];
  const schema = { "@context": "https://schema.org", "@type": "HowTo", name: `How to play ${game.title}`, description: game.summary, totalTime: game.time, supply: [{ "@type": "HowToSupply", name: game.deck }], step: steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })) };
  return <main className="content-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ContentHeader />
    <article className="rules-article"><Link className="back-link" href="/card-games"><ArrowLeft size={16} />All game rules</Link><header><span className="eyebrow">{game.category}</span><h1>How to play {game.title}</h1><p>{game.summary}</p><dl className="rules-facts"><div><dt><Users />Players</dt><dd>{game.players}</dd></div><div><dt><Layers3 />Cards</dt><dd>{game.deck}</dd></div><div><dt><Clock3 />Time</dt><dd>{game.time}</dd></div></dl></header>
      {preset && <aside className="preset-callout"><div><span>Deck preset</span><h2>Build the {preset.cardCount}-card {preset.title} deck</h2><p>{preset.composition}. The builder will apply the ranks, duplicate copies, and jokers automatically.</p></div><Link className="button button-primary" href={`/builder?preset=${preset.slug}`}>Create this deck <ArrowRight size={17} /></Link><small>Starting the preset replaces the current browser draft.</small></aside>}
      <section><h2>Objective</h2><p>{game.objective}</p></section><RuleSection title="Setup" items={game.setup} /><RuleSection title="How play works" items={game.play} /><RuleSection title="Scoring and winning" items={game.scoring} /><RuleSection title="Rules to settle before play" items={game.notes} />
      <section className="source-note"><h2>Rule reference</h2><p>Card games develop regional and household variations. This guide states a common form and flags important choices. For formal or tournament play, consult the linked rules.</p><a href={game.source.url} target="_blank" rel="noreferrer">{game.source.label} <ExternalLink size={15} /></a></section>
    </article><nav className="article-next"><Link href="/card-games"><ArrowLeft size={16} />Browse all 30 games</Link><Link href="/specialty-decks">Specialty deck presets <ArrowRight size={16} /></Link></nav><SiteFooter />
  </main>;
}

function RuleSection({ title, items }: { title: string; items: string[] }) { return <section><h2>{title}</h2><ol>{items.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></section>; }

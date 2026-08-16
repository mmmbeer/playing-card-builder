import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SiteBrand() {
  return <Link className="brand" href="/" aria-label="Deck Forged home"><img src="/deckforged-mark.png" alt="" width={48} height={48} /><span className="brand-wordmark"><strong>Deck</strong><em>Forged</em></span></Link>;
}

export function ContentHeader() {
  return <header className="content-header"><SiteBrand /><nav aria-label="Main navigation"><Link href="/card-games">Game rules</Link><Link href="/specialty-decks">Specialty decks</Link><Link href="/playing-card-history">Card history</Link><Link className="button button-small" href="/builder">Open builder <ArrowRight size={16} /></Link></nav></header>;
}

export function SiteFooter() {
  return <footer className="content-footer"><SiteBrand /><p>Design, study, and print custom playing cards.</p><nav aria-label="Footer navigation"><Link href="/builder">Builder</Link><Link href="/card-games">Rules</Link><Link href="/specialty-decks">Decks</Link><Link href="/playing-card-history">History</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>;
}

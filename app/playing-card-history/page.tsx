import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { ContentHeader, SiteFooter } from "@/app/components/SiteChrome";
import { HISTORICAL_CARDS } from "@/app/content/historical-cards";

export const metadata: Metadata = { title: "Face Cards Through History: Public Domain Scans", description: "Explore public-domain scans of kings, queens, and knaves from the 1430s through the late nineteenth century, with provenance and design significance.", alternates: { canonical: "/playing-card-history" } };

export default function PlayingCardHistoryPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Face cards through history", description: "Public-domain scans of historical court cards with provenance.", hasPart: HISTORICAL_CARDS.map((card) => ({ "@type": "VisualArtwork", name: card.title, dateCreated: card.date, creator: card.maker, image: card.image, url: card.source })) };
  return <main className="content-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ContentHeader /><section className="content-hero history-hero"><span className="eyebrow">Public-domain card archive</span><h1>Face cards were never fixed.</h1><p>Before today’s mirrored kings, queens, and jacks became familiar, court cards reflected local suits, political regimes, printing methods, costumes, and advertising. These scans are linked to museum or repository records that identify them as public domain.</p></section>
    <div className="history-timeline">{HISTORICAL_CARDS.map((card, index) => <article className="history-entry" key={card.title}><div className="history-date"><span>{String(index + 1).padStart(2, "0")}</span><strong>{card.date}</strong></div><a className="history-image" href={card.source} target="_blank" rel="noreferrer"><img src={card.image} alt={`${card.title}, ${card.date}`} loading={index < 2 ? "eager" : "lazy"} /><span>Open collection record <ExternalLink size={14} /></span></a><div className="history-copy"><span>{card.collection}</span><h2>{card.title}</h2><h3>{card.maker}</h3><section><h4>Provenance</h4><p>{card.provenance}</p></section><section><h4>Why it matters</h4><p>{card.significance}</p></section></div></article>)}</div>
    <aside className="archive-note"><h2>About the scans and rights statements</h2><p>The Met records shown here explicitly mark their object images Public Domain. The Wikimedia Commons records identify the other files as faithful scans or reproductions of public-domain works. Rights can differ by jurisdiction, so the collection record linked under every image remains the controlling reference for reuse.</p></aside><SiteFooter />
  </main>;
}

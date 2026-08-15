import Link from "next/link";
import { ArrowRight, Check, Download, ImagePlus, Layers3, LockKeyhole, Printer, SlidersHorizontal, Shapes } from "lucide-react";

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Deck Forged",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any modern web browser",
  url: "https://www.deckforged.com/",
  description: "A browser-based playing card maker for designing full decks and exporting print-ready files.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: ["Custom ranks and suits", "Per-card artwork", "Print-ready PNG and ZIP export", "The Game Crafter upload", "Private device-local drafts"],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Can I make a complete deck of playing cards online?", acceptedAnswer: { "@type": "Answer", text: "Yes. Deck Forged lets you customize every rank and suit, add art to individual cards, and export the complete deck as print-ready PNG files." } },
    { "@type": "Question", name: "What size are the exported playing cards?", acceptedAnswer: { "@type": "Answer", text: "Poker-card exports are 825 by 1125 pixels and include an 80-pixel bleed area for professional printing." } },
    { "@type": "Question", name: "Can I print my deck with The Game Crafter?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can connect your The Game Crafter account, choose a game and deck, and upload generated card faces from Deck Forged." } },
  ],
};

function Brand() {
  return <Link className="brand" href="/" aria-label="Deck Forged home"><img src="/deckforged-mark.png" alt="" width={48} height={48} /><span className="brand-wordmark"><strong>Deck</strong><em>Forged</em></span></Link>;
}

export default function Home() {
  return (
    <main className="landing-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="landing-nav">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#examples">Examples</a><a href="#features">Features</a><a href="#printing">Printing</a><a href="#faq">FAQ</a>
          <Link className="button button-small" href="/builder">Open builder <ArrowRight size={16} aria-hidden="true" /></Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><Shapes size={15} /> Custom playing card builder</div>
          <h1>Build a complete custom deck.</h1>
          <p>Design every card in your browser. Add face artwork, customize ranks, suits, pips, typography, colors, and text, then export print-size PNGs or upload the deck to The Game Crafter.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/builder">Open the deck builder <ArrowRight size={18} aria-hidden="true" /></Link>
            <a className="button button-quiet" href="#features">View all features</a>
          </div>
          <ul className="proof-list" aria-label="Product highlights">
            <li><Check size={16} /> Per-card artwork</li><li><Check size={16} /> Local autosave</li><li><Check size={16} /> 825 × 1125 px PNGs</li>
          </ul>
        </div>

        <div className="hero-workbench" aria-label="Example cards made with Deck Forged">
          <div className="hero-grid-lines" />
          <article className="demo-card demo-card-left" aria-label="Ace of spades card example"><span className="corner corner-top">A<br />♠</span><span className="card-symbol">♠</span><span className="corner corner-bottom">A<br />♠</span></article>
          <article className="demo-card demo-card-main" aria-label="Queen of hearts card example">
            <span className="corner corner-top red">Q<br />♥</span><div className="portrait-frame"><div className="portrait-sun" /><div className="portrait-mountain portrait-mountain-one" /><div className="portrait-mountain portrait-mountain-two" /><span>QUEEN OF<br />THE WILD</span></div><span className="corner corner-bottom red">Q<br />♥</span>
          </article>
          <article className="demo-card demo-card-right" aria-label="Seven of diamonds card example"><span className="corner corner-top red">7<br />♦</span><span className="pip-field red">♦<br />♦ ♦<br />♦<br />♦ ♦<br />♦</span><span className="corner corner-bottom red">7<br />♦</span></article>
          <div className="canvas-chip"><SlidersHorizontal size={16} /> Live card preview</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Deck Forged capabilities"><span>52-card and custom decks</span><span>Artwork for every card</span><span>PNG and ZIP export</span><span>The Game Crafter upload</span></section>

      <section className="examples-section" id="examples">
        <div className="section-heading">
          <span className="eyebrow">Made for more than game night</span>
          <h2>Turn favorite photos into a deck worth keeping.</h2>
          <p>Build a playable gift around a person, a memory, or a milestone. Every card can use its own photo, message, rank, and suit treatment.</p>
        </div>

        <div className="occasion-grid">
          <article className="occasion-panel occasion-birthday">
            <div className="occasion-card-stage" aria-label="Examples of birthday gift cards">
              <div className="photo-playing-card photo-card-back">
                <span className="photo-card-image photo-birthday-balloons" role="img" aria-label="Birthday cake and colorful balloons" />
                <span className="photo-card-wash" />
                <span className="photo-card-index photo-card-index-top">H<small>♥</small></span>
                <span className="photo-card-index photo-card-index-bottom">H<small>♥</small></span>
                <span className="photo-card-caption"><small>Birthday edition</small><strong>Best year yet</strong></span>
              </div>
              <div className="photo-playing-card photo-card-front">
                <span className="photo-card-image photo-birthday-cake" role="img" aria-label="Strawberry birthday cake with party balloons" />
                <span className="photo-card-wash" />
                <span className="photo-card-index photo-card-index-top">B<small>★</small></span>
                <span className="photo-card-index photo-card-index-bottom">B<small>★</small></span>
                <span className="photo-card-caption"><small>A deck for Alex</small><strong>Make a wish</strong><em>52 moments worth celebrating</em></span>
              </div>
            </div>
            <div className="occasion-copy"><span>Birthday gifts</span><h3>A different memory on every card.</h3><p>Make a keepsake deck from family photos, party snapshots, inside jokes, and wishes for the year ahead.</p><Link className="text-link" href="/builder">Make a birthday deck <ArrowRight size={17} /></Link></div>
          </article>

          <article className="occasion-panel occasion-mothers-day">
            <div className="occasion-card-stage" aria-label="Examples of Mother's Day gift cards">
              <div className="photo-playing-card photo-card-back">
                <span className="photo-card-image photo-mothers-day-floral" role="img" aria-label="Floral gift box arranged for Mother's Day" />
                <span className="photo-card-wash" />
                <span className="photo-card-index photo-card-index-top">Q<small>♥</small></span>
                <span className="photo-card-index photo-card-index-bottom">Q<small>♥</small></span>
                <span className="photo-card-caption"><small>For Mom</small><strong>Always in bloom</strong></span>
              </div>
              <div className="photo-playing-card photo-card-front">
                <span className="photo-card-image photo-mothers-day-gifts" role="img" aria-label="Colorful floral gift boxes and a Mother's Day card" />
                <span className="photo-card-wash" />
                <span className="photo-card-index photo-card-index-top">M<small>♥</small></span>
                <span className="photo-card-index photo-card-index-bottom">M<small>♥</small></span>
                <span className="photo-card-caption"><small>Made with love</small><strong>For everything you are</strong><em>One thank-you at a time</em></span>
              </div>
            </div>
            <div className="occasion-copy"><span>Mother&apos;s Day gifts</span><h3>Deal out the reasons she matters.</h3><p>Pair photographs with short notes, family stories, and thank-yous to create a personal gift she can revisit.</p><Link className="text-link" href="/builder">Make a Mother&apos;s Day deck <ArrowRight size={17} /></Link></div>
          </article>
        </div>

        <p className="photo-credits">Example photography from <a href="https://www.pexels.com/photo/whimsical-strawberry-birthday-cake-with-balloons-30307704/" target="_blank" rel="noreferrer">Nur Tok</a>, <a href="https://www.pexels.com/photo/a-birthday-cake-near-balloons-7600382/" target="_blank" rel="noreferrer">Thirdman</a>, <a href="https://www.pexels.com/photo/elegant-mother-s-day-floral-gift-box-29483068/" target="_blank" rel="noreferrer">Alina Matveycheva</a>, and <a href="https://www.pexels.com/photo/gift-boxes-with-floral-design-and-a-greeting-card-7764415/" target="_blank" rel="noreferrer">RDNE Stock project</a>.</p>
      </section>

      <section className="content-section" id="features">
        <div className="section-heading"><span className="eyebrow">Deck-building controls</span><h2>Everything needed to design every card.</h2><p>Work with individual card artwork and shared deck styles in one editor. The preview stays visible while each control panel opens beside it.</p></div>
        <div className="feature-grid">
          <article><ImagePlus /><h3>Place your artwork</h3><p>Upload art for each card. Drag, zoom, rotate, and crop it against the final print canvas.</p></article>
          <article><Layers3 /><h3>Define the deck</h3><p>Use standard ranks, enter a custom rank set, and include configurable jokers.</p></article>
          <article><SlidersHorizontal /><h3>Control every detail</h3><p>Choose fonts, suit artwork, colors, effects, outlines, pip positions, corner offsets, and card text.</p></article>
          <article><Download /><h3>Download PNG or ZIP</h3><p>Save the current card as a PNG or package every named, print-size card face in one ZIP.</p></article>
          <article><Printer /><h3>Send it to print</h3><p>Connect to The Game Crafter and upload the generated faces to a selected poker deck.</p></article>
          <article><LockKeyhole /><h3>Keep drafts private</h3><p>Your working deck stays on this device. Files leave only when you export or send them to print.</p></article>
        </div>
      </section>

      <section className="workflow-section" id="card-controls">
        <div className="workflow-art" aria-hidden="true"><div className="mini-card mini-card-one">A<span>♣</span></div><div className="mini-card mini-card-two">K<span>♦</span></div><div className="mini-card mini-card-three">J<span>♠</span></div></div>
        <div className="workflow-copy">
          <span className="eyebrow">Full deck editor</span><h2>Shared styles and per-card artwork.</h2>
          <ol className="step-list"><li><span>ART</span><div><h3>Place artwork precisely</h3><p>Drag with a mouse or finger, pinch or wheel to zoom, rotate, flip, and reset each face image.</p></div></li><li><span>TYPE</span><div><h3>Build the card system</h3><p>Set typefaces, weights, per-suit colors, icon libraries, pips, effects, outlines, and print guides.</p></div></li><li><span>TEXT</span><div><h3>Add card-specific text</h3><p>Style captions and rules with placement, alignment, width, background, opacity, and optional mirroring.</p></div></li></ol>
          <Link className="text-link" href="/builder">Open the card builder <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="printing-section" id="printing">
        <div><span className="eyebrow">Print and export</span><h2>Output sized for poker-card printing.</h2><p>Use bleed, safe-area, center, and pip-row guides while editing. Export 825 × 1125 pixel PNG files individually or in a ZIP, or connect a The Game Crafter account and upload every generated face to a selected poker deck.</p><a className="text-link" href="https://www.thegamecrafter.com/developer/APIKey.html" target="_blank" rel="noreferrer">The Game Crafter API documentation <ArrowRight size={17} /></a></div>
        <div className="print-spec-card"><div className="spec-header"><Printer size={20} /> Poker card export</div><dl><div><dt>Canvas</dt><dd>825 × 1125 px</dd></div><div><dt>Bleed</dt><dd>80 px</dd></div><div><dt>Format</dt><dd>PNG</dd></div><div><dt>Deck package</dt><dd>ZIP</dd></div></dl></div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading compact"><span className="eyebrow">Details</span><h2>Custom card builder FAQ</h2></div>
        <div className="faq-grid"><details open><summary>Can I make a full deck online?</summary><p>Yes. You can edit every rank and suit, add individual artwork, and export the complete deck.</p></details><details><summary>Do I need an account?</summary><p>No. Drafts are saved to your browser on this device. The Game Crafter asks you to sign in only when you choose its print upload.</p></details><details><summary>Can I use custom card ranks?</summary><p>Yes. Replace the standard ranks with any comma-separated set. This works for prototypes, teaching tools, and original games.</p></details><details><summary>Are exports ready for printing?</summary><p>Exports are 825 × 1125 pixel PNG files with an 80-pixel bleed. Always review the printer&apos;s current proof before ordering.</p></details></div>
      </section>

      <section className="final-cta"><div><span className="eyebrow">Custom deck builder</span><h2>Design, export, and print your deck.</h2></div><Link className="button button-primary" href="/builder">Open the builder <ArrowRight size={18} /></Link></section>

      <footer className="landing-footer"><Brand /><p>Free browser-based tools for making custom playing cards.</p><nav aria-label="Footer navigation"><Link href="/builder">Builder</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="https://github.com/mmmbeer/playing-card-builder" target="_blank" rel="noreferrer">GitHub</a></nav></footer>
    </main>
  );
}

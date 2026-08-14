"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Image as ImageIcon,
  Images,
  MessageSquareText,
  Palette,
  Layers3,
  LayoutTemplate,
  Printer,
  Redo2,
  Save,
  Shapes,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import CardCanvas from "./CardCanvas";
import ToolPanel, { type PanelId } from "./ToolPanel";
import TgcModal from "./TgcModal";
import { sampleCanvasColor } from "./color-sampler";
import { canvasToBlob, CARD_HEIGHT, CARD_WIDTH, renderCard } from "./render-card";
import { clearDraft, clearImages, getImage, loadDraft, putImage, saveDraft } from "./storage";
import { blankCard, cardKey, createDefaultDeck, deckCardCount, migrateDeck, rankCopyCount, SUITS, type CardDesign, type DeckSettings, type ImageUrls, type SuitId } from "./types";

const tools: Array<{ id: PanelId; label: string; icon: React.ReactNode }> = [
  { id: "cards", label: "Cards", icon: <Layers3 /> },
  { id: "art", label: "Artwork", icon: <ImageIcon /> },
  { id: "type", label: "Type", icon: <Type /> },
  { id: "icons", label: "Icons", icon: <Palette /> },
  { id: "pips", label: "Pips", icon: <Shapes /> },
  { id: "text", label: "Text", icon: <MessageSquareText /> },
  { id: "layout", label: "Layout", icon: <LayoutTemplate /> },
  { id: "deck", label: "Deck", icon: <Save /> },
];

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "card";
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BuilderClient() {
  const [deck, setDeck] = useState<DeckSettings>(() => createDefaultDeck());
  const [suit, setSuit] = useState<SuitId>("spades");
  const [rank, setRank] = useState("A");
  const [copy, setCopy] = useState(1);
  const [images, setImages] = useState<ImageUrls>({});
  const [panel, setPanel] = useState<PanelId | null>("cards");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [exportOpen, setExportOpen] = useState(false);
  const [tgcOpen, setTgcOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [past, setPast] = useState<DeckSettings[]>([]);
  const [future, setFuture] = useState<DeckSettings[]>([]);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const continuousEdit = useRef(false);
  const cancelExport = useRef(false);
  const currentKey = cardKey(suit, rank, copy);
  const card = deck.cards[currentKey] || blankCard();

  useEffect(() => {
    const stored = loadDraft();
    setDeck(stored);
    if (!stored.ranks.includes(rank)) setRank(stored.ranks[0] || "A");
    const keys = [...new Set([...Object.values(stored.cards).map((item) => item.imageKey), stored.customIconKey].filter(Boolean) as string[])];
    void Promise.all(keys.map(async (key) => {
      const blob = await getImage(key);
      return blob ? [key, URL.createObjectURL(blob)] as const : null;
    })).then((entries) => setImages(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, string]>))).finally(() => setHydrated(true));
    // The initial draft is intentionally read only after the browser mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => { saveDraft(deck); setSaveState("saved"); }, 350);
    return () => window.clearTimeout(timeout);
  }, [deck, hydrated]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (bulkOpen) setBulkOpen(false); else if (resetOpen) setResetOpen(false); else if (tgcOpen) setTgcOpen(false); else if (exportOpen) { cancelExport.current = true; setExportProgress({ current: 0, total: 0 }); setExportOpen(false); } else setPanel(null);
        return;
      }
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || exportOpen || tgcOpen || resetOpen || bulkOpen) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const sequence = useMemo(() => [
    ...SUITS.flatMap((item) => deck.ranks.flatMap((deckRank) => Array.from({ length: rankCopyCount(deck, deckRank) }, (_, index) => ({ suit: item.id, rank: deckRank, copy: index + 1, joker: false })))),
    ...(deck.includeJokers ? Array.from({ length: deck.jokerCount }, (_, index) => ({ suit: "spades" as SuitId, rank: `__JOKER_${index + 1}__`, copy: 1, joker: true })) : []),
  ], [deck]);
  const index = sequence.findIndex((item) => item.suit === suit && item.rank === rank && item.copy === copy);
  const suitMeta = SUITS.find((item) => item.id === suit)!;

  useEffect(() => {
    if (rank.startsWith("__JOKER_")) {
      const joker = Number(rank.match(/\d+/)?.[0] || 1);
      if (!deck.includeJokers || joker > deck.jokerCount) { setRank(deck.ranks[0] || "A"); setSuit("spades"); setCopy(1); }
      return;
    }
    const validCopyCount = Math.max(1, Math.min(12, Math.round(deck.rankCopies[rank] || 1)));
    if (!deck.ranks.includes(rank)) { setRank(deck.ranks[0] || "A"); setCopy(1); }
    else if (copy > validCopyCount) setCopy(validCopyCount);
  }, [copy, deck.includeJokers, deck.jokerCount, deck.rankCopies, deck.ranks, rank]);

  function navigate(offset: number) {
    const next = sequence[(index + offset + sequence.length) % sequence.length];
    if (next) { setSuit(next.suit); setRank(next.rank); setCopy(next.copy); }
  }

  function commit(updater: (current: DeckSettings) => DeckSettings) { setDeck((current) => { setPast((items) => [...items, current].slice(-50)); setFuture([]); return updater(current); }); }
  function updateDeck(patch: Partial<DeckSettings>) { commit((current) => ({ ...current, ...patch })); }
  function updateCard(patch: Partial<CardDesign>) { commit((current) => ({ ...current, cards: { ...current.cards, [currentKey]: { ...(current.cards[currentKey] || blankCard()), ...patch } } })); }
  function updateCardLive(patch: Partial<CardDesign>) { setDeck((current) => ({ ...current, cards: { ...current.cards, [currentKey]: { ...(current.cards[currentKey] || blankCard()), ...patch } } })); }
  function beginContinuousEdit() { if (continuousEdit.current) return; continuousEdit.current = true; setDeck((current) => { setPast((items) => [...items, current].slice(-50)); setFuture([]); return current; }); }
  function endContinuousEdit() { continuousEdit.current = false; }
  function undo() { continuousEdit.current = false; if (!past.length) return; const previous = past[past.length - 1]; setPast((items) => items.slice(0, -1)); setFuture((items) => [deck, ...items].slice(0, 50)); setDeck(previous); }
  function redo() { continuousEdit.current = false; if (!future.length) return; const next = future[0]; setFuture((items) => items.slice(1)); setPast((items) => [...items, deck].slice(-50)); setDeck(next); }

  function updateRanks(value: string) {
    const entries = value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 120);
    if (!entries.length) return;
    const nextRanks = [...new Set(entries)].slice(0, 40);
    const rankCopies = Object.fromEntries(nextRanks.map((item) => [item, Math.min(12, entries.filter((entry) => entry === item).length)]));
    commit((current) => {
      const cards = { ...current.cards };
      for (const nextSuit of SUITS) for (const nextRank of nextRanks) for (let nextCopy = 1; nextCopy <= rankCopies[nextRank]; nextCopy += 1) cards[cardKey(nextSuit.id, nextRank, nextCopy)] ||= blankCard();
      return { ...current, ranks: nextRanks, rankCopies, cards };
    });
    if (!nextRanks.includes(rank) && !rank.startsWith("__JOKER_")) { setRank(nextRanks[0]); setCopy(1); }
    else if (copy > (rankCopies[rank] || 1)) setCopy(rankCopies[rank] || 1);
  }

  async function addImage(file: File) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024) {
      window.alert("Choose a PNG, JPG, or WebP file smaller than 20 MB.");
      return;
    }
    const key = crypto.randomUUID();
    await putImage(key, file);
    const url = URL.createObjectURL(file);
    setImages((current) => ({ ...current, [key]: url }));
    updateCard({ imageKey: key, imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0, flipX: false, flipY: false });
  }

  async function removeImage() {
    if (!card.imageKey) return;
    updateCard({ imageKey: undefined, imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0, flipX: false, flipY: false });
  }

  async function addCustomIcon(file: File) { if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 20*1024*1024) { window.alert("Choose a PNG, JPG, or WebP file smaller than 20 MB."); return; } const key=crypto.randomUUID(); await putImage(key,file); setImages((current)=>({...current,[key]:URL.createObjectURL(file)})); updateDeck({customIconKey:key,iconPreset:"custom"}); }
  function removeCustomIcon(){updateDeck({customIconKey:undefined,iconPreset:"unicode"})}

  function matchBulkFile(file: File) { const name=file.name.toLowerCase().replace(/\.[^.]+$/,""); const jokerMatch=name.match(/joker[-_ ]?(\d+)?/); if(jokerMatch&&deck.includeJokers){const joker=Math.min(deck.jokerCount,Math.max(1,Number(jokerMatch[1]||1)));return{suit:"spades" as SuitId,rank:`__JOKER_${joker}__`,copy:1};} const suitMatch=SUITS.find(s=>name.includes(s.id)||name.includes(s.id.slice(0,-1))||new RegExp(`(^|[-_ ])${s.id[0]}($|[-_ ])`).test(name)); if(!suitMatch)return null; const rankMatch=[...deck.ranks].sort((a,b)=>b.length-a.length).find(r=>new RegExp(`(^|[-_ ])${r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").toLowerCase()}($|[-_ ])`).test(name)); if(!rankMatch)return null; const copyMatch=name.match(/(?:copy|c)[-_ ]?(\d+)/); return{suit:suitMatch.id,rank:rankMatch,copy:Math.min(rankCopyCount(deck,rankMatch),Math.max(1,Number(copyMatch?.[1]||1)))}; }
  async function applyBulk(){let matched=0;for(const file of bulkFiles){const target=matchBulkFile(file);if(!target)continue;const key=crypto.randomUUID();await putImage(key,file);setImages(current=>({...current,[key]:URL.createObjectURL(file)}));commit(current=>({...current,cards:{...current.cards,[cardKey(target.suit,target.rank,target.copy)]:{...(current.cards[cardKey(target.suit,target.rank,target.copy)]||blankCard()),imageKey:key}}}));matched+=1;}setBulkFiles([]);setBulkOpen(false);if(!matched)window.alert("No files matched. Include a rank and suit in each filename, such as A-spades.png, 10-hearts-copy2.jpg, or joker-1.png.");}

  const renderBlob = useCallback(async (renderSuit: SuitId, renderRank: string, renderCopy = 1) => {
    const key = cardKey(renderSuit, renderRank, renderCopy);
    const renderDesign = deck.cards[key] || blankCard();
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH; canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");
    await renderCard(ctx, deck, renderSuit, renderRank, renderDesign, renderDesign.imageKey ? images[renderDesign.imageKey] : undefined, false, deck.customIconKey ? images[deck.customIconKey] : undefined);
    return canvasToBlob(canvas);
  }, [deck, images]);

  async function downloadCurrent() {
    const blob = await renderBlob(suit, rank, copy);
    download(blob, `${safeFilename(rank.startsWith("__JOKER_") ? `joker-${rank.match(/\d+/)?.[0] || 1}` : `${rank}-${suit}${copy > 1 ? `-copy-${copy}` : ""}`)}.png`);
  }

  async function exportZip() {
    const zip = new JSZip();
    const total = sequence.length;
    cancelExport.current = false;
    setExportProgress({ current: 0, total });
    for (let current = 0; current < total; current += 1) {
      if (cancelExport.current) { setExportProgress({ current: 0, total: 0 }); return; }
      const item = sequence[current];
      const blob = await renderBlob(item.suit, item.rank, item.copy);
      zip.file(item.joker ? `joker-${item.rank.match(/\d+/)?.[0] || 1}.png` : `${safeFilename(item.rank)}-${item.suit}${item.copy > 1 ? `-copy-${item.copy}` : ""}.png`, blob);
      setExportProgress({ current: current + 1, total });
    }
    if (cancelExport.current) { setExportProgress({ current: 0, total: 0 }); return; }
    const archive = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    download(archive, `${safeFilename(deck.title)}-print-files.zip`);
    setExportProgress({ current: 0, total: 0 });
  }

  async function exportBackup() {
    const zip = new JSZip();
    zip.file("deck.json", JSON.stringify(deck, null, 2));
    const keys = [...new Set([...Object.values(deck.cards).map((item) => item.imageKey), deck.customIconKey].filter(Boolean) as string[])];
    await Promise.all(keys.map(async (key) => {
      const blob = await getImage(key);
      if (blob) zip.file(`assets/${key}`, blob);
    }));
    zip.file("README.txt", "Deck Forged project backup\n\nImport this ZIP from the editor to restore deck settings, card artwork, and a custom suit sheet.");
    download(await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }), `${safeFilename(deck.title)}-deckforged-project.zip`);
  }

  async function importBackup(file: File) {
    try {
      let parsed: DeckSettings;
      const restoredUrls: ImageUrls = {};
      if (file.name.toLowerCase().endsWith(".zip") || file.type.includes("zip")) {
        const zip = await JSZip.loadAsync(file);
        const deckFile = zip.file("deck.json");
        if (!deckFile) throw new Error("Missing deck.json");
        parsed = migrateDeck(JSON.parse(await deckFile.async("text")));
        const keys = [...new Set([...Object.values(parsed.cards).map((item) => item.imageKey), parsed.customIconKey].filter(Boolean) as string[])];
        await Promise.all(keys.map(async (key) => {
          const asset = zip.file(`assets/${key}`);
          if (!asset) return;
          const blob = await asset.async("blob");
          await putImage(key, blob);
          restoredUrls[key] = URL.createObjectURL(blob);
        }));
      } else {
        parsed = migrateDeck(JSON.parse(await file.text()));
        const keys = [...new Set([...Object.values(parsed.cards).map((item) => item.imageKey), parsed.customIconKey].filter(Boolean) as string[])];
        await Promise.all(keys.map(async (key) => {
          const blob = await getImage(key);
          if (blob) restoredUrls[key] = URL.createObjectURL(blob);
        }));
      }
      Object.values(images).forEach((url) => URL.revokeObjectURL(url));
      setImages(restoredUrls);
      setDeck(parsed); setRank(parsed.ranks[0]); setCopy(1); setSuit("spades"); setPast([]); setFuture([]);
    } catch { window.alert("That file is not a valid Deck Forged project backup."); }
  }

  async function resetDeck() {
    Object.values(images).forEach((url) => URL.revokeObjectURL(url));
    await clearImages(); clearDraft();
    setImages({}); setDeck(createDefaultDeck()); setPast([]); setFuture([]); setSuit("spades"); setRank("A"); setCopy(1); setResetOpen(false);
  }

  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <div className="builder-brand-group"><Link href="/" className="builder-back" aria-label="Back to Deck Forged home"><ArrowLeft /></Link><Link href="/" className="builder-brand"><img src="/deckforged-mark.png" alt="" /><span>Deck Forged</span></Link><span className="top-divider" /><input className="deck-title-input" aria-label="Deck name" value={deck.title} maxLength={80} onChange={(e) => updateDeck({ title: e.target.value })} /></div>
        <div className="builder-top-actions"><span className={`save-indicator ${saveState}`}><span />{saveState === "saving" ? "Saving…" : "Saved on this device"}</span><button className="top-action compact" disabled={!past.length} onClick={undo} aria-label="Undo"><Undo2 /></button><button className="top-action compact" disabled={!future.length} onClick={redo} aria-label="Redo"><Redo2 /></button><button className="top-action" onClick={() => setExportOpen(true)}><FileDown /> Export</button><button className="top-action primary" onClick={() => setTgcOpen(true)}><Printer /> Print deck</button></div>
      </header>

      <div className="builder-workspace">
        <nav className="tool-rail" aria-label="Builder tools">{tools.map((tool) => <button key={tool.id} className={panel === tool.id ? "active" : ""} onClick={() => setPanel(panel === tool.id ? null : tool.id)} aria-pressed={panel === tool.id}>{tool.icon}<span>{tool.label}</span></button>)}<div className="rail-spacer" /><button onClick={() => setResetOpen(true)}><Trash2 /><span>Reset</span></button></nav>
        {panel && <ToolPanel panel={panel} deck={deck} suit={suit} rank={rank} copy={copy} card={card} imageUrl={card.imageKey ? images[card.imageKey] : undefined} onClose={() => setPanel(null)} onDeck={updateDeck} onCard={updateCard} onSelect={(nextSuit, nextRank, nextCopy = 1) => { setSuit(nextSuit); setRank(nextRank); setCopy(nextCopy); }} onImage={(file) => void addImage(file)} onRemoveImage={() => void removeImage()} onRanks={updateRanks} onBulk={() => setBulkOpen(true)} onCustomIcon={(file) => void addCustomIcon(file)} onRemoveCustomIcon={removeCustomIcon} onSampleColor={() => sampleCanvasColor(canvasRef.current)} />}

        <section className="canvas-stage" aria-label="Card design canvas">
          <div className="stage-meta"><span className="card-position">Card {index + 1} of {sequence.length}</span><span>{CARD_WIDTH} × {CARD_HEIGHT} px · poker card with bleed</span></div>
          <div className="canvas-frame"><CardCanvas deck={deck} suit={suit} rank={rank} card={card} imageUrl={card.imageKey ? images[card.imageKey] : undefined} iconUrl={deck.customIconKey ? images[deck.customIconKey] : undefined} onTransform={updateCardLive} onTransformStart={beginContinuousEdit} onTransformEnd={endContinuousEdit} onDelete={() => void removeImage()} canvasRef={canvasRef} /></div>
          <div className="card-navigator"><button onClick={() => navigate(-1)} aria-label="Previous card"><ChevronLeft /></button><div><span className={suitMeta.red && !rank.startsWith("__JOKER_") ? "red-suit" : ""}>{rank.startsWith("__JOKER_") ? "★" : suitMeta.symbol}</span><strong>{rank.startsWith("__JOKER_") ? `Joker ${rank.match(/\d+/)?.[0] || 1}` : `${rank} of ${suitMeta.name}${rankCopyCount(deck, rank) > 1 ? ` · copy ${copy}` : ""}`}</strong><small>{card.imageKey ? "Artwork placed" : "Uses deck style"}</small></div><button onClick={() => navigate(1)} aria-label="Next card"><ChevronRight /></button></div>
        </section>
      </div>

      {exportOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { cancelExport.current = true; setExportProgress({ current: 0, total: 0 }); setExportOpen(false); } }}><section className="builder-modal export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title"><header><div><span className="panel-kicker">Files and backups</span><h2 id="export-title">Export {deck.title || "your deck"}</h2></div><button className="icon-control" onClick={() => { cancelExport.current = true; setExportProgress({ current: 0, total: 0 }); setExportOpen(false); }} aria-label="Close"><X /></button></header><div className="export-options"><button onClick={() => void downloadCurrent()}><div className="export-icon"><Download /></div><div><strong>Current card PNG</strong><span>{rank.startsWith("__JOKER_") ? `Joker ${rank.match(/\d+/)?.[0] || 1}` : `${rank} of ${suitMeta.name}${copy > 1 ? ` · copy ${copy}` : ""}`} · 825 × 1125 px</span></div><ChevronRight /></button><button onClick={() => void exportZip()} disabled={Boolean(exportProgress.total)}><div className="export-icon"><FileDown /></div><div><strong>Complete print ZIP</strong><span>{deckCardCount(deck)} named PNG files with bleed</span></div><ChevronRight /></button><button onClick={() => void exportBackup()}><div className="export-icon"><Save /></div><div><strong>Complete project backup</strong><span>ZIP with settings, card artwork, and custom suit sheets</span></div><ChevronRight /></button><button onClick={() => importRef.current?.click()}><div className="export-icon"><Upload /></div><div><strong>Import project backup</strong><span>Restore a Deck Forged project ZIP or legacy JSON file</span></div><ChevronRight /></button><input ref={importRef} type="file" hidden accept="application/zip,.zip,application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importBackup(file); e.currentTarget.value = ""; }} /></div>{exportProgress.total > 0 && <div className="export-progress"><div><span style={{ width: `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` }} /></div><p>Rendering card {Math.min(exportProgress.current + 1, exportProgress.total)} of {exportProgress.total}…</p><button className="panel-button" onClick={() => { cancelExport.current = true; setExportProgress({ current: 0, total: 0 }); }}>Cancel export</button></div>}<footer><p>Print guides are visible in the builder but are excluded from exported files.</p><button className="button button-primary" onClick={() => { setExportOpen(false); setTgcOpen(true); }}><Printer /> Send to The Game Crafter</button></footer></section></div>}
      {bulkOpen && <div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setBulkOpen(false)}}><section className="builder-modal bulk-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-title"><header><div><span className="panel-kicker">Batch artwork</span><h2 id="bulk-title">Add artwork to multiple cards</h2></div><button className="icon-control" onClick={()=>setBulkOpen(false)} aria-label="Close"><X/></button></header><div className="bulk-body"><label className="art-drop"><Images/><strong>Choose artwork files</strong><span>Use names such as A-spades.png, 10_hearts.jpg, or Q-clubs.webp</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>setBulkFiles([...e.target.files||[]])}/></label>{bulkFiles.length>0&&<div className="bulk-match-list">{bulkFiles.slice(0,40).map(file=>{const match=matchBulkFile(file);return <div key={`${file.name}-${file.size}`}><span>{file.name}</span><strong className={match?"matched":"unmatched"}>{match?`${match.rank} of ${match.suit}`:"No match"}</strong></div>})}</div>}</div><footer><p>{bulkFiles.filter(file=>matchBulkFile(file)).length} of {bulkFiles.length} files match current cards.</p><button className="button button-primary" disabled={!bulkFiles.some(file=>matchBulkFile(file))} onClick={()=>void applyBulk()}>Add matched artwork</button></footer></section></div>}
      {tgcOpen && <TgcModal deck={deck} renderBlob={renderBlob} onClose={() => setTgcOpen(false)} />}
      {resetOpen && <div className="modal-backdrop"><section className="builder-modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title"><header><div><span className="panel-kicker">Permanent on this device</span><h2 id="reset-title">Start a new deck?</h2></div><button className="icon-control" onClick={() => setResetOpen(false)} aria-label="Close"><X /></button></header><p>This clears the saved deck, artwork, and settings from this browser. Export a backup first if you may need them again.</p><footer><button className="button button-quiet" onClick={() => setResetOpen(false)}>Keep this deck</button><button className="button danger-button" onClick={() => void resetDeck()}>Clear and start over</button></footer></section></div>}
    </main>
  );
}

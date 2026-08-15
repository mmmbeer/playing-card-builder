"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileDown,
  Image as ImageIcon,
  MessageSquareText,
  Palette,
  Layers3,
  LayoutTemplate,
  Maximize2,
  Minus,
  Printer,
  Plus,
  Redo2,
  Save,
  Shapes,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { NotificationRegion, useNotifications } from "@/app/components/ui/Notifications";
import CardCanvas from "./CardCanvas";
import BulkArtworkModal, { type BulkArtworkAssignment } from "./BulkArtworkModal";
import ExportModal from "./ExportModal";
import ResetDeckModal from "./ResetDeckModal";
import { BugReportModal, HelpModal } from "./SupportModals";
import ToolPanel, { type PanelId } from "./ToolPanel";
import TgcModal from "./TgcModal";
import { sampleCanvasColor } from "./color-sampler";
import { canvasToBlob, CARD_HEIGHT, CARD_WIDTH, renderCard } from "./render-card";
import { clearDraft, clearImages, loadDraft, saveDraft } from "./storage";
import { blankCard, cardKey, createDefaultDeck, rankCopyCount, SUITS, type CardDesign, type DeckSettings, type ImageUrls, type SuitId } from "./types";
import { imageValidationError, loadImageUrls, revokeImageUrls, storeImage } from "./deck-assets";
import { createPrintArchive, createProjectBackup, downloadBlob, importProjectBackup, safeFilename } from "./deck-files";
import { useCanvasZoom } from "./use-canvas-zoom";
import { useDeckHistory } from "./use-deck-history";

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

export default function BuilderClient() {
  const { beginContinuousEdit, canRedo, canUndo, commit, deck, endContinuousEdit, redo, replaceDeck, undo, updateLive } = useDeckHistory(createDefaultDeck());
  const [suit, setSuit] = useState<SuitId>("spades");
  const [rank, setRank] = useState("A");
  const [copy, setCopy] = useState(1);
  const [images, setImages] = useState<ImageUrls>({});
  const [panel, setPanel] = useState<PanelId | null>("cards");
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<"error" | "saved" | "saving">("saved");
  const [exportOpen, setExportOpen] = useState(false);
  const [tgcOpen, setTgcOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const cancelExport = useRef(false);
  const saveFailureShown = useRef(false);
  const renderFailureShown = useRef(false);
  const { dismiss, notices, notify } = useNotifications();
  const { change: changeCanvasZoom, fit: fitCanvas, mode: canvasZoomMode, printSize: showPrintSize, zoom: canvasZoom } = useCanvasZoom(canvasViewportRef);
  const currentKey = cardKey(suit, rank, copy);
  const card = deck.cards[currentKey] || blankCard();

  useEffect(() => {
    const stored = loadDraft();
    replaceDeck(stored);
    if (!stored.ranks.includes(rank)) setRank(stored.ranks[0] || "A");
    void loadImageUrls(stored).then(({ failed, images: storedImages }) => {
      setImages(storedImages);
      if (failed.length) notify("Some saved artwork could not be restored. The rest of the deck is still available.", "error");
    }).finally(() => setHydrated(true));
    // The initial draft is intentionally read only after the browser mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timeout = window.setTimeout(() => {
      const saved = saveDraft(deck);
      setSaveState(saved ? "saved" : "error");
      if (!saved && !saveFailureShown.current) {
        saveFailureShown.current = true;
        notify("This browser could not save the latest changes. Export a project backup before leaving.", "error");
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [deck, hydrated, notify]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select") || exportOpen || tgcOpen || resetOpen || bulkOpen || helpOpen || bugOpen) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
      if (["+", "=", "-", "_"].includes(event.key)) { event.preventDefault(); changeCanvasZoom(canvasZoom * (event.key === "-" || event.key === "_" ? .88 : 1.14)); return; }
      if (event.key === "0") { event.preventDefault(); fitCanvas(); return; }
      if (event.key === "1") { event.preventDefault(); showPrintSize(); return; }
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

  function updateDeck(patch: Partial<DeckSettings>) { commit((current) => ({ ...current, ...patch })); }
  function updateCard(patch: Partial<CardDesign>) { commit((current) => ({ ...current, cards: { ...current.cards, [currentKey]: { ...(current.cards[currentKey] || blankCard()), ...patch } } })); }
  function updateCardLive(patch: Partial<CardDesign>) { updateLive((current) => ({ ...current, cards: { ...current.cards, [currentKey]: { ...(current.cards[currentKey] || blankCard()), ...patch } } })); }

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
    const validationError = imageValidationError(file);
    if (validationError) { notify(validationError, "error"); return; }
    const { key, persisted, url } = await storeImage(file);
    if (!persisted) notify("Artwork was added for this session but could not be saved on this device.", "error");
    setImages((current) => ({ ...current, [key]: url }));
    updateCard({ imageKey: key, imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0, flipX: false, flipY: false });
  }

  async function removeImage() {
    if (!card.imageKey) return;
    updateCard({ imageKey: undefined, imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0, flipX: false, flipY: false });
  }

  async function addCustomIcon(file: File) { const validationError = imageValidationError(file); if (validationError) { notify(validationError, "error"); return; } const { key, persisted, url } = await storeImage(file); if (!persisted) notify("The custom suit sheet is available now but could not be saved on this device.", "error"); setImages((current)=>({...current,[key]:url})); updateDeck({customIconKey:key,iconPreset:"custom"}); }
  function removeCustomIcon(){updateDeck({customIconKey:undefined,iconPreset:"unicode"})}

  async function applyBulk(assignments: BulkArtworkAssignment[]) {
    const prepared = await Promise.all(assignments.map(async (assignment) => ({ assignment, ...await storeImage(assignment.file) })));
    const unsaved = prepared.filter((item) => !item.persisted).length;
    if (unsaved) notify(`${unsaved} artwork file${unsaved === 1 ? "" : "s"} could not be saved permanently but remain available in this session.`, "error");
    setImages((current) => ({ ...current, ...Object.fromEntries(prepared.map((item) => [item.key, item.url])) }));
    commit((current) => {
      const cards = { ...current.cards };
      for (const { assignment, key } of prepared) {
        const target = cardKey(assignment.suit, assignment.rank, assignment.copy);
        cards[target] = { ...(cards[target] || blankCard()), imageKey: key };
      }
      return { ...current, cards };
    });
    setBulkOpen(false);
    notify(`${prepared.length} artwork file${prepared.length === 1 ? "" : "s"} applied.`, "success");
  }

  function resetPanelSettings(panelId: PanelId) {
    const defaults = createDefaultDeck();
    const groups: Partial<Record<PanelId, Array<keyof DeckSettings>>> = {
      type: ["rankFont", "rankSize", "rankWeight", "rankColorMode", "rankColor", "suitColors", "rankOpacity", "rankEffect", "rankEffectColor", "rankEffectOpacity", "rankEffectBlur", "rankShadowX", "rankShadowY", "rankOutline", "rankOutlineWidth", "rankOutlineColor", "rankOutlinePosition", "blackColor", "redColor", "cornerOrder"],
      icons: ["iconPreset", "customIconKey", "iconColorMode", "iconColor", "iconOpacity", "iconScale", "iconEffect", "iconEffectColor", "iconEffectOpacity", "iconEffectBlur", "iconShadowX", "iconShadowY", "iconOutline", "iconOutlineWidth", "iconOutlineColor", "iconOutlinePosition"],
      pips: ["showPips", "pipsOverArtwork", "pipScale", "aceScale", "pipTop", "pipInnerTop", "pipCenter", "pipInnerBottom", "pipBottom", "pipLeft", "pipCenterX", "pipRight"],
      text: ["textPlacement", "textMirror", "textAlign", "textWidth", "textHeightMode", "textFixedHeight", "textOverflow", "textBackground", "textBackgroundOpacity", "textHeaderFont", "textHeaderWeight", "textHeaderSize", "textBodyFont", "textBodyWeight", "textBodySize", "textColor", "textOpacity"],
      layout: ["background", "backgroundAccent", "backgroundStyle", "edgeRadius", "edgeStrokeWidth", "edgeStrokeColor", "edgeStrokeInset", "cornerRankOffsetX", "cornerRankOffsetY", "cornerSuitOffsetX", "cornerSuitOffsetY", "mirrorCorners", "showGuides", "showBleedGuide", "showSafeGuide", "showCenterGuide", "showPipGuides", "showCornerGuides", "showImageBounds", "safeZoneInset"],
    };
    const keys = groups[panelId];
    if (!keys) return;
    const patch: Partial<DeckSettings> = {};
    for (const key of keys) Object.assign(patch, { [key]: defaults[key] });
    updateDeck(patch);
  }

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
    try {
      const blob = await renderBlob(suit, rank, copy);
      downloadBlob(blob, `${safeFilename(rank.startsWith("__JOKER_") ? `joker-${rank.match(/\d+/)?.[0] || 1}` : `${rank}-${suit}${copy > 1 ? `-copy-${copy}` : ""}`)}.png`);
    } catch {
      notify("The current card could not be rendered. Your deck remains unchanged.", "error");
    }
  }

  async function exportZip() {
    cancelExport.current = false;
    setExportProgress({ current: 0, total: sequence.length });
    try {
      const archive = await createPrintArchive(sequence, renderBlob, (current, total) => setExportProgress({ current, total }), () => cancelExport.current);
      if (archive) downloadBlob(archive, `${safeFilename(deck.title)}-print-files.zip`);
    } catch {
      notify("The print ZIP could not be completed. You can retry without losing any deck changes.", "error");
    } finally {
      setExportProgress({ current: 0, total: 0 });
    }
  }

  async function exportBackup() {
    try {
      const backup = await createProjectBackup(deck);
      downloadBlob(backup.blob, `${safeFilename(deck.title)}-deckforged-project.zip`);
      if (backup.missing) notify(`Backup created without ${backup.missing} unavailable artwork file${backup.missing === 1 ? "" : "s"}.`, "error");
    } catch {
      notify("The project backup could not include all saved assets. No deck data was changed.", "error");
    }
  }

  async function importBackup(file: File) {
    try {
      const imported = await importProjectBackup(file);
      revokeImageUrls(images);
      setImages(imported.images);
      replaceDeck(imported.deck); setRank(imported.deck.ranks[0]); setCopy(1); setSuit("spades");
      if (imported.unsaved) notify(`Project imported, but ${imported.unsaved} artwork file${imported.unsaved === 1 ? " is" : "s are"} only available for this session.`, "error");
      else notify("Project backup imported.", "success");
    } catch { notify("That file is not a valid Deck Forged project backup.", "error"); }
  }

  async function resetDeck() {
    setResetBusy(true);
    revokeImageUrls(images);
    let assetsCleared = true;
    try { await clearImages(); } catch { assetsCleared = false; }
    const draftCleared = clearDraft();
    setImages({}); replaceDeck(createDefaultDeck()); setSuit("spades"); setRank("A"); setCopy(1); setResetOpen(false); setResetBusy(false);
    if (!assetsCleared || !draftCleared) notify("The new deck is ready, but some older browser data could not be removed.", "error");
    else notify("New deck started.", "success");
  }

  const cardLabel = rank.startsWith("__JOKER_")
    ? `Joker ${rank.match(/\d+/)?.[0] || 1}`
    : `${rank} of ${suitMeta.name}${copy > 1 ? ` · copy ${copy}` : ""}`;

  return (
    <main className="builder-shell">
      <header className="builder-topbar">
        <div className="builder-brand-group"><Link href="/" className="builder-back" aria-label="Back to Deck Forged home"><ArrowLeft /></Link><Link href="/" className="builder-brand"><img src="/deckforged-mark.png" alt="" /><span className="brand-wordmark"><strong>Deck</strong><em>Forged</em></span></Link><span className="top-divider" /><input className="deck-title-input" aria-label="Deck name" value={deck.title} maxLength={80} onChange={(e) => updateDeck({ title: e.target.value })} /></div>
        <div className="builder-top-actions"><span className={`save-indicator ${saveState}`}><span />{saveState === "saving" ? "Saving…" : saveState === "error" ? "Not saved" : "Saved on this device"}</span><button className="top-action compact" onClick={() => setHelpOpen(true)} aria-label="Editor help"><CircleHelp /></button><button className="top-action compact" disabled={!canUndo} onClick={undo} aria-label="Undo"><Undo2 /></button><button className="top-action compact" disabled={!canRedo} onClick={redo} aria-label="Redo"><Redo2 /></button><button className="top-action" onClick={() => setExportOpen(true)}><FileDown /> Export</button><button className="top-action primary" onClick={() => setTgcOpen(true)}><Printer /> Print deck</button></div>
      </header>

      <div className="builder-workspace">
        <nav className="tool-rail" aria-label="Builder tools">{tools.map((tool) => <button key={tool.id} className={panel === tool.id ? "active" : ""} onClick={() => setPanel(panel === tool.id ? null : tool.id)} aria-pressed={panel === tool.id}>{tool.icon}<span>{tool.label}</span></button>)}<div className="rail-spacer" /><button onClick={() => setBugOpen(true)}><Bug /><span>Report</span></button><button onClick={() => setResetOpen(true)}><Trash2 /><span>Reset</span></button></nav>
        {panel && <ToolPanel panel={panel} deck={deck} suit={suit} rank={rank} copy={copy} card={card} imageUrl={card.imageKey ? images[card.imageKey] : undefined} onClose={() => setPanel(null)} onDeck={updateDeck} onCard={updateCard} onSelect={(nextSuit, nextRank, nextCopy = 1) => { setSuit(nextSuit); setRank(nextRank); setCopy(nextCopy); }} onImage={(file) => void addImage(file)} onRemoveImage={() => void removeImage()} onRanks={updateRanks} onBulk={() => setBulkOpen(true)} onCustomIcon={(file) => void addCustomIcon(file)} onRemoveCustomIcon={removeCustomIcon} onSampleColor={() => sampleCanvasColor(canvasRef.current)} onResetPanel={resetPanelSettings} />}

        <section className="canvas-stage" aria-label="Card design canvas">
          <div className="stage-toolbar-row">
            <div className="stage-meta"><span className="card-position">Card {index + 1} of {sequence.length}</span><span>{CARD_WIDTH} × {CARD_HEIGHT} px · poker card with bleed</span></div>
            <div className="canvas-zoom-toolbar" role="toolbar" aria-label="Canvas zoom">
              <button type="button" onClick={() => changeCanvasZoom(canvasZoom * .88)} aria-label="Zoom out" title="Zoom out (-)"><Minus /></button>
              <output aria-live="polite">{Math.round(canvasZoom * 100)}%</output>
              <button type="button" onClick={() => changeCanvasZoom(canvasZoom * 1.14)} aria-label="Zoom in" title="Zoom in (+)"><Plus /></button>
              <button type="button" className={canvasZoomMode === "fit" ? "active" : ""} onClick={fitCanvas} aria-label="Fit card to workspace" title="Fit the whole card in the workspace (0)"><Maximize2 /><span className="fit-label">Fit</span></button>
              <button type="button" className={canvasZoom === 1 ? "active" : ""} onClick={showPrintSize} aria-label="Show card at 300 dpi print size" title="One screen pixel per 300 dpi output pixel (1)"><span>300 DPI</span></button>
            </div>
          </div>
          <div
            className="canvas-viewport"
            ref={canvasViewportRef}
            onWheel={(event) => {
              event.preventDefault();
              changeCanvasZoom(canvasZoom * Math.exp(-event.deltaY * .0014), { clientX: event.clientX, clientY: event.clientY });
            }}
          >
            <div className="canvas-frame"><CardCanvas deck={deck} suit={suit} rank={rank} card={card} imageUrl={card.imageKey ? images[card.imageKey] : undefined} iconUrl={deck.customIconKey ? images[deck.customIconKey] : undefined} onTransform={updateCardLive} onTransformStart={beginContinuousEdit} onTransformEnd={endContinuousEdit} onDelete={() => void removeImage()} viewZoom={canvasZoom} onViewZoom={changeCanvasZoom} onFitView={fitCanvas} onPrintView={showPrintSize} onRenderError={() => { if (!renderFailureShown.current) { renderFailureShown.current = true; notify("The card preview could not be fully rendered. Try another image or font before exporting.", "error"); } }} canvasRef={canvasRef} /></div>
          </div>
          <div className="card-navigator"><button onClick={() => navigate(-1)} aria-label="Previous card"><ChevronLeft /></button><div><span className={suitMeta.red && !rank.startsWith("__JOKER_") ? "red-suit" : ""}>{rank.startsWith("__JOKER_") ? "★" : suitMeta.symbol}</span><strong>{rank.startsWith("__JOKER_") ? `Joker ${rank.match(/\d+/)?.[0] || 1}` : `${rank} of ${suitMeta.name}${rankCopyCount(deck, rank) > 1 ? ` · copy ${copy}` : ""}`}</strong><small>{card.imageKey ? "Artwork placed" : "Uses deck style"}</small></div><button onClick={() => navigate(1)} aria-label="Next card"><ChevronRight /></button></div>
        </section>
      </div>

      {exportOpen && <ExportModal cardLabel={cardLabel} deck={deck} progress={exportProgress} onClose={() => setExportOpen(false)} onCancelExport={() => { cancelExport.current = true; setExportProgress({ current: 0, total: 0 }); }} onDownloadCurrent={downloadCurrent} onExportZip={exportZip} onExportBackup={exportBackup} onImport={importBackup} onPrint={() => { setExportOpen(false); setTgcOpen(true); }} />}
      {bulkOpen && <BulkArtworkModal deck={deck} onApply={applyBulk} onClose={() => setBulkOpen(false)} onNotice={(message) => notify(message, "error")} />}
      {tgcOpen && <TgcModal deck={deck} renderBlob={renderBlob} onClose={() => setTgcOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} onReportBug={() => { setHelpOpen(false); setBugOpen(true); }} />}
      {bugOpen && <BugReportModal deck={deck} onClose={() => setBugOpen(false)} />}
      {resetOpen && <ResetDeckModal busy={resetBusy} onClose={() => setResetOpen(false)} onReset={resetDeck} />}
      <NotificationRegion notices={notices} onDismiss={dismiss} />
    </main>
  );
}

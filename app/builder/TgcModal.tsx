"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, LogOut, Plus, Printer, RefreshCw, X } from "lucide-react";
import type { DeckSettings, SuitId } from "./types";
import { rankCopyCount, SUITS } from "./types";

type TgcItem = { id: string; name: string };
type Status = { authenticated: boolean; configured: boolean; message?: string };
type Collision = "replace" | "skip" | "copy";
type ProofItem = { key: string; suit: SuitId; rank: string; copy: number; label: string; filename: string; joker: boolean };

type Props = {
  deck: DeckSettings;
  onClose: () => void;
  renderBlob: (suit: SuitId, rank: string, copy?: number) => Promise<Blob>;
};

async function postJson<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/tgc", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
  const json = await response.json();
  if (!response.ok || json.error) throw new Error(json.error?.message || json.message || "The Game Crafter request failed.");
  return json as T;
}

function tgcName(item: ProofItem) {
  const rank = item.joker ? `JOKER ${item.rank.match(/\d+/)?.[0] || 1}` : `${item.rank}${item.copy > 1 ? ` COPY ${item.copy}` : ""}`.toUpperCase();
  const suit = item.joker ? "Joker" : `${item.suit.charAt(0).toUpperCase()}${item.suit.slice(1)}`;
  return `${rank} of ${suit}`.toLowerCase();
}

export default function TgcModal({ deck, onClose, renderBlob }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [designers, setDesigners] = useState<TgcItem[]>([]);
  const [games, setGames] = useState<TgcItem[]>([]);
  const [decks, setDecks] = useState<TgcItem[]>([]);
  const [designerId, setDesignerId] = useState("");
  const [gameId, setGameId] = useState("");
  const [deckId, setDeckId] = useState("");
  const [newGame, setNewGame] = useState("");
  const [newDeck, setNewDeck] = useState("");
  const [defaultCollision, setDefaultCollision] = useState<Collision>("replace");
  const [collisionByCard, setCollisionByCard] = useState<Record<string, Collision>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [failures, setFailures] = useState<string[]>([]);
  const [doneUrl, setDoneUrl] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [proofProgress, setProofProgress] = useState({ current: 0, total: 0 });
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  const proofItems = useMemo<ProofItem[]>(() => {
    const items: ProofItem[] = [];
    for (const suit of SUITS) for (const rank of deck.ranks) for (let copy = 1; copy <= rankCopyCount(deck, rank); copy += 1) {
      items.push({ key: `${suit.id}:${rank}:${copy}`, suit: suit.id, rank, copy, label: `${rank} of ${suit.name}${copy > 1 ? `, copy ${copy}` : ""}`, filename: `${rank}-${suit.id}${copy > 1 ? `-copy-${copy}` : ""}.png`, joker: false });
    }
    if (deck.includeJokers) for (let index = 1; index <= deck.jokerCount; index += 1) items.push({ key: `joker:${index}`, suit: "spades", rank: `__JOKER_${index}__`, copy: 1, label: `Joker ${index}`, filename: `joker-${index}.png`, joker: true });
    return items;
  }, [deck]);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/tgc?action=status", { credentials: "same-origin" });
      const json = await response.json() as Status;
      setStatus(json);
      if (json.authenticated) {
        setBusy("Loading your account…");
        const result = await postJson<{ items: TgcItem[]; defaultId?: string }>({ action: "designers" });
        setDesigners(result.items);
        setDesignerId(result.defaultId || result.items[0]?.id || "");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not connect."); }
    finally { setBusy(""); }
  }, []);

  useEffect(() => { void loadStatus(); }, [loadStatus]);
  useEffect(() => () => Object.values(previews).forEach((url) => URL.revokeObjectURL(url)), [previews]);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "deckforged:tgc-authenticated") return;
      void loadStatus();
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [loadStatus]);

  useEffect(() => {
    if (!designerId) { setGames([]); return; }
    setBusy("Loading games…"); setError(""); setGameId(""); setDecks([]);
    void postJson<{ items: TgcItem[] }>({ action: "games", designerId }).then((result) => { setGames(result.items); setGameId(result.items[0]?.id || ""); }).catch((reason) => setError(reason.message)).finally(() => setBusy(""));
  }, [designerId]);

  useEffect(() => {
    if (!gameId) { setDecks([]); setDeckId(""); return; }
    setBusy("Loading decks…"); setError(""); setDeckId("");
    void postJson<{ items: TgcItem[] }>({ action: "decks", gameId }).then((result) => { setDecks(result.items); setDeckId(result.items[0]?.id || ""); }).catch((reason) => setError(reason.message)).finally(() => setBusy(""));
  }, [gameId]);

  useEffect(() => {
    setExistingNames(new Set());
    setCollisionByCard({});
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews({});
    // Proofs are destination-specific because conflict detection depends on the selected deck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const proofsReady = proofItems.length > 0 && Object.keys(previews).length === proofItems.length;
  const canUpload = Boolean(deckId && proofsReady && !busy && progress.total === 0 && proofProgress.total === 0);
  const selectedGame = useMemo(() => games.find((item) => item.id === gameId), [games, gameId]);

  async function createGame() {
    if (!newGame.trim() || !designerId) return;
    setBusy("Creating game…"); setError("");
    try {
      const result = await postJson<{ item: TgcItem }>({ action: "create_game", designerId, name: newGame.trim() });
      setGames((items) => [...items, result.item]); setGameId(result.item.id); setNewGame("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the game."); }
    finally { setBusy(""); }
  }

  async function createDeck() {
    if (!newDeck.trim() || !gameId) return;
    setBusy("Creating poker deck…"); setError("");
    try {
      const result = await postJson<{ item: TgcItem }>({ action: "create_deck", gameId, name: newDeck.trim() });
      setDecks((items) => [...items, result.item]); setDeckId(result.item.id); setNewDeck("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not create the deck."); }
    finally { setBusy(""); }
  }

  async function refreshProofs() {
    if (!deckId || proofProgress.total) return;
    setError(""); setDoneUrl(""); setProofProgress({ current: 0, total: proofItems.length });
    try {
      const existing = await postJson<{ items: TgcItem[] }>({ action: "existing_cards", deckId });
      setExistingNames(new Set(existing.items.map((item) => item.name.toLowerCase())));
      const next: Record<string, string> = {};
      for (let index = 0; index < proofItems.length; index += 1) {
        const item = proofItems[index];
        next[item.key] = URL.createObjectURL(await renderBlob(item.suit, item.rank, item.copy));
        setProofProgress({ current: index + 1, total: proofItems.length });
      }
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
      setPreviews(next);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Proofs could not be generated."); }
    finally { setProofProgress({ current: 0, total: 0 }); }
  }

  async function upload() {
    if (!canUpload) return;
    setError(""); setDoneUrl(""); setFailures([]); setProgress({ current: 0, total: proofItems.length, failed: 0 });
    let failed = 0;
    const failedLabels: string[] = [];
    for (let index = 0; index < proofItems.length; index += 1) {
      const item = proofItems[index];
      try {
        const blob = await renderBlob(item.suit, item.rank, item.copy);
        const form = new FormData();
        form.append("action", "upload_card");
        form.append("deckId", deckId);
        form.append("rank", item.joker ? `Joker ${item.rank.match(/\d+/)?.[0] || 1}` : item.copy > 1 ? `${item.rank} copy ${item.copy}` : item.rank);
        form.append("suit", item.joker ? "joker" : item.suit);
        form.append("collision", collisionByCard[item.key] || defaultCollision);
        form.append("file", blob, item.filename);
        const response = await fetch("/api/tgc", { method: "POST", credentials: "same-origin", body: form });
        const json = await response.json();
        if (!response.ok || json.error) throw new Error(json.error?.message || "Upload failed");
      } catch { failed += 1; failedLabels.push(item.label); }
      setFailures([...failedLabels]);
      setProgress({ current: index + 1, total: proofItems.length, failed });
    }
    if (!failed) setDoneUrl(gameId ? `https://www.thegamecrafter.com/games/${gameId}` : "https://www.thegamecrafter.com/make/games");
    else setError(`${failed} card${failed === 1 ? "" : "s"} could not be uploaded. The other cards were left in the selected deck.`);
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !progress.total && !proofProgress.total) onClose(); }}>
    <section className="builder-modal tgc-modal" role="dialog" aria-modal="true" aria-labelledby="tgc-title">
      <header><div className="modal-title-row"><img src="/tgc.png" alt="" /><div><span className="panel-kicker">Professional printing</span><h2 id="tgc-title">Send to The Game Crafter</h2></div></div><button className="icon-control" onClick={onClose} aria-label="Close"><X /></button></header>

      {!status ? <div className="modal-loading"><span className="brand-spinner" aria-hidden="true" /> Checking connection…</div> : !status.configured ? <div className="connection-panel"><Printer /><h3>Connection setup is required</h3><p>{status.message || "Add the Deck Forged API key in the site settings before using direct upload."}</p><a href="https://www.thegamecrafter.com/developer/APIKey.html" target="_blank" rel="noreferrer">The Game Crafter API keys <ExternalLink size={15} /></a></div> : !status.authenticated ? <div className="connection-panel"><Printer /><h3>Connect your printing account</h3><p>The login opens at The Game Crafter. Deck Forged receives a short-lived session and never sees your password.</p><button className="button button-primary" onClick={() => window.open("/api/tgc?action=sso_start", "deckforged-tgc", "width=720,height=760,noopener=no")}>Log in with The Game Crafter <ExternalLink size={16} /></button></div> : <>
        <div className="tgc-scroll-body">
          <div className="tgc-grid">
            <div className="tgc-column"><span className="step-chip">1</span><h3>Designer</h3><select value={designerId} onChange={(event) => setDesignerId(event.target.value)} disabled={Boolean(progress.total)}>{designers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="tgc-column"><span className="step-chip">2</span><h3>Game</h3><select value={gameId} onChange={(event) => setGameId(event.target.value)} disabled={Boolean(progress.total)}><option value="">Select a game</option>{games.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="create-inline"><input value={newGame} onChange={(event) => setNewGame(event.target.value)} placeholder="New game name" maxLength={100} /><button onClick={createGame} disabled={!newGame.trim() || Boolean(busy)} aria-label="Create game"><Plus /></button></div></div>
            <div className="tgc-column"><span className="step-chip">3</span><h3>Poker deck</h3><select value={deckId} onChange={(event) => setDeckId(event.target.value)} disabled={!gameId || Boolean(progress.total)}><option value="">Select a deck</option>{decks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="create-inline"><input value={newDeck} onChange={(event) => setNewDeck(event.target.value)} placeholder="New deck name" maxLength={100} disabled={!gameId} /><button onClick={createDeck} disabled={!newDeck.trim() || !gameId || Boolean(busy)} aria-label="Create deck"><Plus /></button></div></div>
          </div>

          <div className="upload-summary"><div><strong>{proofItems.length} card faces</strong><span>{selectedGame ? `${selectedGame.name} · ` : ""}${decks.find((item) => item.id === deckId)?.name || "Choose a destination"}</span></div><label>Default for existing cards<select value={defaultCollision} onChange={(event) => setDefaultCollision(event.target.value as Collision)} disabled={Boolean(progress.total)}><option value="replace">Replace matching</option><option value="skip">Skip matching</option><option value="copy">Create copies</option></select></label><button className="panel-button proof-refresh" onClick={() => void refreshProofs()} disabled={!deckId || Boolean(proofProgress.total) || Boolean(progress.total)}><RefreshCw /> {Object.keys(previews).length ? "Refresh proofs" : "Generate proofs"}</button></div>
          {busy && <div className="inline-status"><span className="brand-spinner" aria-hidden="true" /> {busy}</div>}
          {proofProgress.total > 0 && <div className="upload-progress"><div><span style={{ width: `${Math.round(proofProgress.current / proofProgress.total * 100)}%` }} /></div><p>Rendering proof {Math.min(proofProgress.current + 1, proofProgress.total)} of {proofProgress.total}…</p></div>}
          {Object.keys(previews).length > 0 && <section className="proof-section" aria-labelledby="proof-title"><div className="proof-heading"><div><span className="step-chip">4</span><h3 id="proof-title">Review proofs and conflicts</h3></div><p>{existingNames.size ? `${existingNames.size} existing card names found in this deck.` : "No matching card names found."}</p></div><div className="proof-grid">{proofItems.map((item) => {
            const conflict = existingNames.has(tgcName(item));
            return <article key={item.key} className={conflict ? "proof-card has-conflict" : "proof-card"}><img src={previews[item.key]} alt={`Proof of ${item.label}`} /><div><strong>{item.label}</strong><span>{conflict ? "Existing card found" : "New card"}</span>{conflict && <select aria-label={`Conflict action for ${item.label}`} value={collisionByCard[item.key] || defaultCollision} onChange={(event) => setCollisionByCard((current) => ({ ...current, [item.key]: event.target.value as Collision }))}><option value="replace">Replace</option><option value="skip">Skip</option><option value="copy">Create copy</option></select>}</div></article>;
          })}</div></section>}
          {progress.total > 0 && <div className="upload-progress"><div><span style={{ width: `${Math.round(progress.current / progress.total * 100)}%` }} /></div><p>{progress.current < progress.total ? `Uploading ${progress.current + 1} of ${progress.total}…` : progress.failed ? "Upload finished with errors." : "Deck upload complete."}</p>{failures.length > 0 && <details><summary>Failed cards</summary><ul>{failures.map((label) => <li key={label}>{label}</li>)}</ul></details>}</div>}
          {doneUrl && <div className="success-banner"><CheckCircle2 /><div><strong>All card faces uploaded</strong><a href={doneUrl} target="_blank" rel="noreferrer">Open the game and review proofs <ExternalLink size={14} /></a></div></div>}
          {error && <p className="modal-error" role="alert">{error}</p>}
        </div>
        <footer><button className="panel-button" onClick={async () => { await postJson({ action: "logout" }); setStatus({ authenticated: false, configured: true }); }} disabled={Boolean(progress.total)}><LogOut /> Disconnect</button><p>{Object.keys(previews).length ? "Review every proof and choose any per-card conflict actions before upload." : "Generate proofs before uploading so print problems can be caught first."}</p><button className="button button-primary" onClick={upload} disabled={!canUpload}>{progress.total ? progress.current < progress.total ? "Uploading…" : "Upload finished" : `Upload ${proofItems.length} cards`}</button></footer>
      </>}
    </section>
  </div>;
}

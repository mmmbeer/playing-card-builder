"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, LogOut, Plus, Printer, X } from "lucide-react";
import type { DeckSettings, SuitId } from "./types";
import { deckCardCount, rankCopyCount, SUITS } from "./types";

type TgcItem = { id: string; name: string };
type Status = { authenticated: boolean; configured: boolean; message?: string };

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
  const [collision, setCollision] = useState<"replace" | "skip" | "copy">("replace");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [doneUrl, setDoneUrl] = useState("");

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

  const totalCards = deckCardCount(deck);
  const canUpload = Boolean(deckId && !busy && progress.total === 0);
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

  async function upload() {
    if (!canUpload) return;
    setError(""); setDoneUrl(""); setProgress({ current: 0, total: totalCards, failed: 0 });
    let current = 0;
    let failed = 0;
    for (const suit of SUITS) {
      for (const rank of deck.ranks) {
        for (let copy = 1; copy <= rankCopyCount(deck, rank); copy += 1) {
          try {
            const blob = await renderBlob(suit.id, rank, copy);
            const form = new FormData();
            form.append("action", "upload_card");
            form.append("deckId", deckId);
            form.append("rank", copy > 1 ? `${rank} copy ${copy}` : rank);
            form.append("suit", suit.id);
            form.append("collision", collision);
            form.append("file", blob, `${rank}-${suit.id}${copy > 1 ? `-copy-${copy}` : ""}.png`);
            const response = await fetch("/api/tgc", { method: "POST", credentials: "same-origin", body: form });
            const json = await response.json();
            if (!response.ok || json.error) throw new Error(json.error?.message || "Upload failed");
          } catch { failed += 1; }
          current += 1;
          setProgress({ current, total: totalCards, failed });
        }
      }
    }
    if (deck.includeJokers) {
      for (let joker = 1; joker <= deck.jokerCount; joker += 1) {
        try {
          const blob = await renderBlob("spades", `__JOKER_${joker}__`);
          const form = new FormData(); form.append("action", "upload_card"); form.append("deckId", deckId); form.append("rank", `Joker ${joker}`); form.append("suit", "joker"); form.append("collision", collision); form.append("file", blob, `joker-${joker}.png`);
          const response = await fetch("/api/tgc", { method: "POST", credentials: "same-origin", body: form }); const json = await response.json(); if (!response.ok || json.error) throw new Error(json.error?.message || "Upload failed");
        } catch { failed += 1; }
        current += 1; setProgress({ current, total: totalCards, failed });
      }
    }
    if (failed === 0) setDoneUrl(gameId ? `https://www.thegamecrafter.com/games/${gameId}` : "https://www.thegamecrafter.com/make/games");
    else setError(`${failed} card${failed === 1 ? "" : "s"} could not be uploaded. The other cards were left in the selected deck.`);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !progress.total) onClose(); }}>
      <section className="builder-modal tgc-modal" role="dialog" aria-modal="true" aria-labelledby="tgc-title">
        <header><div className="modal-title-row"><img src="/tgc.png" alt="" /><div><span className="panel-kicker">Professional printing</span><h2 id="tgc-title">Send to The Game Crafter</h2></div></div><button className="icon-control" onClick={onClose} aria-label="Close"><X /></button></header>

        {!status ? <div className="modal-loading"><span className="brand-spinner" aria-hidden="true" /> Checking connection…</div> : !status.configured ? <div className="connection-panel"><Printer /><h3>Connection setup is required</h3><p>{status.message || "Add the Deck Forged API key in the site settings before using direct upload."}</p><a href="https://www.thegamecrafter.com/developer/APIKey.html" target="_blank" rel="noreferrer">The Game Crafter API keys <ExternalLink size={15} /></a></div> : !status.authenticated ? <div className="connection-panel"><Printer /><h3>Connect your printing account</h3><p>The login opens at The Game Crafter. Deck Forged receives a short-lived session and never sees your password.</p><button className="button button-primary" onClick={() => window.open("/api/tgc?action=sso_start", "deckforged-tgc", "width=720,height=760,noopener=no")}>Log in with The Game Crafter <ExternalLink size={16} /></button></div> : <>
          <div className="tgc-grid">
            <div className="tgc-column"><span className="step-chip">1</span><h3>Designer</h3><select value={designerId} onChange={(e) => setDesignerId(e.target.value)} disabled={Boolean(progress.total)}>{designers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div className="tgc-column"><span className="step-chip">2</span><h3>Game</h3><select value={gameId} onChange={(e) => setGameId(e.target.value)} disabled={Boolean(progress.total)}><option value="">Select a game</option>{games.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="create-inline"><input value={newGame} onChange={(e) => setNewGame(e.target.value)} placeholder="New game name" maxLength={100} /><button onClick={createGame} disabled={!newGame.trim() || Boolean(busy)} aria-label="Create game"><Plus /></button></div></div>
            <div className="tgc-column"><span className="step-chip">3</span><h3>Poker deck</h3><select value={deckId} onChange={(e) => setDeckId(e.target.value)} disabled={!gameId || Boolean(progress.total)}><option value="">Select a deck</option>{decks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="create-inline"><input value={newDeck} onChange={(e) => setNewDeck(e.target.value)} placeholder="New deck name" maxLength={100} disabled={!gameId} /><button onClick={createDeck} disabled={!newDeck.trim() || !gameId || Boolean(busy)} aria-label="Create deck"><Plus /></button></div></div>
          </div>

          <div className="upload-summary"><div><strong>{totalCards} card faces</strong><span>{selectedGame ? `${selectedGame.name} · ` : ""}${decks.find((item) => item.id === deckId)?.name || "Choose a destination"}</span></div><label>Existing cards<select value={collision} onChange={(e) => setCollision(e.target.value as typeof collision)} disabled={Boolean(progress.total)}><option value="replace">Replace matching</option><option value="skip">Skip matching</option><option value="copy">Create copies</option></select></label></div>
          {busy && <div className="inline-status"><span className="brand-spinner" aria-hidden="true" /> {busy}</div>}
          {progress.total > 0 && <div className="upload-progress"><div><span style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} /></div><p>{progress.current < progress.total ? `Uploading ${progress.current + 1} of ${progress.total}…` : progress.failed ? "Upload finished with errors." : "Deck upload complete."}</p></div>}
          {doneUrl && <div className="success-banner"><CheckCircle2 /><div><strong>All card faces uploaded</strong><a href={doneUrl} target="_blank" rel="noreferrer">Open the game and review proofs <ExternalLink size={14} /></a></div></div>}
          {error && <p className="modal-error" role="alert">{error}</p>}
          <footer><button className="panel-button" onClick={async () => { await postJson({ action: "logout" }); setStatus({ authenticated: false, configured: true }); }} disabled={Boolean(progress.total)}><LogOut /> Disconnect</button><button className="button button-primary" onClick={upload} disabled={!canUpload}>{progress.total ? progress.current < progress.total ? "Uploading…" : "Upload finished" : `Upload ${totalCards} cards`}</button></footer>
        </>}
      </section>
    </div>
  );
}

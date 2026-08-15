"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Keyboard, LifeBuoy, X } from "lucide-react";
import type { DeckSettings } from "./types";

export function HelpModal({ onClose, onReportBug }: { onClose: () => void; onReportBug: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="builder-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <header><div><span className="panel-kicker">Editor guide</span><h2 id="help-title">Build a print-ready deck</h2><p>The builder saves continuously on this device. Export a project backup before changing browsers.</p></div><button className="icon-control" onClick={onClose} aria-label="Close"><X /></button></header>
      <div className="help-body">
        <section><LifeBuoy /><div><h3>Recommended workflow</h3><ol><li>Set ranks, copies, and jokers in Deck.</li><li>Choose shared typography, icons, pips, and layout.</li><li>Add artwork and card-specific text.</li><li>Review safe-area and trim guides.</li><li>Export a backup, print ZIP, or send proofs to The Game Crafter.</li></ol></div></section>
        <section><Keyboard /><div><h3>Canvas shortcuts</h3><dl><div><dt>Wheel or pinch</dt><dd>Zoom canvas</dd></div><div><dt>0 / 1</dt><dd>Fit / 300 DPI</dd></div><div><dt>Arrow keys</dt><dd>Nudge artwork</dd></div><div><dt>Alt + / −</dt><dd>Scale artwork</dd></div><div><dt>[ / ]</dt><dd>Rotate artwork</dd></div><div><dt>Ctrl/⌘ Z</dt><dd>Undo</dd></div></dl></div></section>
        <section><AlertTriangle /><div><h3>Production checks</h3><p>Keep critical ranks, suits, faces, and text inside the blue safe-area guide. Trim and safe-area guides never appear in exported files.</p><p>Bulk filenames such as <code>A-spades.png</code> and <code>10-hearts-copy2.jpg</code> map automatically, and every assignment can be corrected before applying.</p></div></section>
      </div>
      <footer><p><Link href="/terms" target="_blank">Terms <ExternalLink /></Link><Link href="/privacy" target="_blank">Privacy <ExternalLink /></Link></p><button className="button button-quiet" onClick={onReportBug}>Report a problem</button></footer>
    </section>
  </div>;
}

export function BugReportModal({ deck, onClose }: { deck: DeckSettings; onClose: () => void }) {
  const [summary, setSummary] = useState("");
  const [happened, setHappened] = useState("");
  const [steps, setSteps] = useState("");
  const [details, setDetails] = useState("");
  const [includeState, setIncludeState] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending"); setError("");
    try {
      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ summary, happened, steps, details, appState: includeState ? deck : null, website: "" }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error || "The report could not be saved.");
      setStatus("sent");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The report could not be saved.");
      setStatus("error");
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && status !== "sending") onClose(); }}>
    <section className="builder-modal bug-modal" role="dialog" aria-modal="true" aria-labelledby="bug-title">
      <header><div><span className="panel-kicker">Support</span><h2 id="bug-title">Report a problem</h2><p>Describe what failed and how to reproduce it. Artwork files are never attached.</p></div><button className="icon-control" onClick={onClose} disabled={status === "sending"} aria-label="Close"><X /></button></header>
      {status === "sent" ? <div className="bug-success"><CheckCircle2 /><h3>Report saved</h3><p>Your report is ready for review.</p><button className="button button-primary" onClick={onClose}>Done</button></div> : <form onSubmit={submit}>
        <label><span>Summary</span><input required minLength={6} maxLength={140} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What is broken?" /></label>
        <label><span>What happened?</span><textarea required minLength={10} maxLength={3000} rows={5} value={happened} onChange={(event) => setHappened(event.target.value)} placeholder="What did you expect, and what happened instead?" /></label>
        <label><span>Steps to reproduce</span><textarea required minLength={10} maxLength={3000} rows={5} value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="1. Open…&#10;2. Choose…&#10;3. Click…" /></label>
        <label><span>Technical details <small>optional</small></span><textarea maxLength={2000} rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Browser, device, error message, or other useful details" /></label>
        <label className="bug-state"><input type="checkbox" checked={includeState} onChange={(event) => setIncludeState(event.target.checked)} /><span><strong>Include deck configuration</strong><small>Includes ranks, settings, and card text. It does not include artwork files.</small></span></label>
        <input className="report-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" />
        {error && <p className="modal-error" role="alert">{error}</p>}
        <footer><p>Reports are stored with the Site for troubleshooting.</p><button className="button button-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Submit report"}</button></footer>
      </form>}
    </section>
  </div>;
}

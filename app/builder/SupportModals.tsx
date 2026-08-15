"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Keyboard, LifeBuoy } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { errorText, postJson } from "@/app/lib/api-client";
import type { DeckSettings } from "./types";

export function HelpModal({ onClose, onReportBug }: { onClose: () => void; onReportBug: () => void }) {
  return <Modal className="help-modal" kicker="Editor guide" title="Build a print-ready deck" description="The builder saves continuously on this device. Export a project backup before changing browsers." onClose={onClose} footer={<><p><Link href="/terms" target="_blank">Terms <ExternalLink /></Link><Link href="/privacy" target="_blank">Privacy <ExternalLink /></Link></p><button className="button button-quiet" onClick={onReportBug}>Report a problem</button></>}>
      <div className="help-body">
        <section><LifeBuoy /><div><h3>Recommended workflow</h3><ol><li>Set ranks, copies, and jokers in Deck.</li><li>Choose shared typography, icons, pips, and layout.</li><li>Add artwork and card-specific text.</li><li>Review safe-area and trim guides.</li><li>Export a backup, print ZIP, or send proofs to The Game Crafter.</li></ol></div></section>
        <section><Keyboard /><div><h3>Canvas shortcuts</h3><dl><div><dt>Wheel or pinch</dt><dd>Zoom canvas</dd></div><div><dt>0 / 1</dt><dd>Fit / 300 DPI</dd></div><div><dt>Arrow keys</dt><dd>Nudge artwork</dd></div><div><dt>Alt + / −</dt><dd>Scale artwork</dd></div><div><dt>[ / ]</dt><dd>Rotate artwork</dd></div><div><dt>Ctrl/⌘ Z</dt><dd>Undo</dd></div></dl></div></section>
        <section><AlertTriangle /><div><h3>Production checks</h3><p>Keep critical ranks, suits, faces, and text inside the blue safe-area guide. Trim and safe-area guides never appear in exported files.</p><p>Bulk filenames such as <code>A-spades.png</code> and <code>10-hearts-copy2.jpg</code> map automatically, and every assignment can be corrected before applying.</p></div></section>
      </div>
  </Modal>;
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
      await postJson("/api/bug-report", { summary, happened, steps, details, appState: includeState ? deck : null, website: "" });
      setStatus("sent");
    } catch (reason) {
      setError(errorText(reason, "The report could not be saved."));
      setStatus("error");
    }
  }

  return <Modal className="bug-modal" kicker="Support" title="Report a problem" description="Describe what failed and how to reproduce it. Artwork files are never attached." onClose={onClose} closeDisabled={status === "sending"}>
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
  </Modal>;
}

"use client";

import { useRef } from "react";
import { ChevronRight, Download, FileDown, Printer, Save, Upload } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { deckCardCount, type DeckSettings } from "./types";

type Props = {
  cardLabel: string;
  deck: DeckSettings;
  onCancelExport: () => void;
  onClose: () => void;
  onDownloadCurrent: () => Promise<void>;
  onExportBackup: () => Promise<void>;
  onExportZip: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
  onPrint: () => void;
  progress: { current: number; total: number };
};

export default function ExportModal({ cardLabel, deck, onCancelExport, onClose, onDownloadCurrent, onExportBackup, onExportZip, onImport, onPrint, progress }: Props) {
  const importRef = useRef<HTMLInputElement | null>(null);
  const close = () => {
    if (progress.total) onCancelExport();
    onClose();
  };
  return <Modal className="export-modal" kicker="Files and backups" title={`Export ${deck.title || "your deck"}`} onClose={close} footer={<><p>Print guides are visible in the builder but are excluded from exported files.</p><button className="button button-primary" onClick={onPrint}><Printer /> Send to The Game Crafter</button></>}>
    <div className="export-options">
      <button onClick={() => void onDownloadCurrent()}><div className="export-icon"><Download /></div><div><strong>Current card PNG</strong><span>{cardLabel} · 825 × 1125 px</span></div><ChevronRight /></button>
      <button onClick={() => void onExportZip()} disabled={Boolean(progress.total)}><div className="export-icon"><FileDown /></div><div><strong>Complete print ZIP</strong><span>{deckCardCount(deck)} named PNG files with bleed</span></div><ChevronRight /></button>
      <button onClick={() => void onExportBackup()}><div className="export-icon"><Save /></div><div><strong>Complete project backup</strong><span>ZIP with settings, card artwork, and custom suit sheets</span></div><ChevronRight /></button>
      <button onClick={() => importRef.current?.click()}><div className="export-icon"><Upload /></div><div><strong>Import project backup</strong><span>Restore a Deck Forged project ZIP or legacy JSON file</span></div><ChevronRight /></button>
      <input ref={importRef} type="file" hidden accept="application/zip,.zip,application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImport(file); event.currentTarget.value = ""; }} />
    </div>
    {progress.total > 0 && <div className="export-progress"><div><span style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} /></div><p>Rendering card {Math.min(progress.current + 1, progress.total)} of {progress.total}…</p><button className="panel-button" onClick={onCancelExport}>Cancel export</button></div>}
  </Modal>;
}

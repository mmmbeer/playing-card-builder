"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Images, Trash2 } from "lucide-react";
import Modal from "@/app/components/ui/Modal";
import { imageValidationError } from "./deck-assets";
import type { DeckSettings, SuitId } from "./types";
import { rankCopyCount, SUITS } from "./types";

export type BulkArtworkAssignment = {
  id: string;
  file: File;
  previewUrl: string;
  enabled: boolean;
  suit: SuitId;
  rank: string;
  copy: number;
};

type Props = {
  deck: DeckSettings;
  onApply: (assignments: BulkArtworkAssignment[]) => Promise<void>;
  onClose: () => void;
  onNotice: (message: string) => void;
};

function inferTarget(file: File, deck: DeckSettings) {
  const name = file.name.toLowerCase().replace(/\.[^.]+$/, "");
  const jokerMatch = name.match(/joker[-_ ]?(\d+)?/);
  if (jokerMatch && deck.includeJokers) {
    const joker = Math.min(deck.jokerCount, Math.max(1, Number(jokerMatch[1] || 1)));
    return { suit: "spades" as SuitId, rank: `__JOKER_${joker}__`, copy: 1 };
  }
  const suit = SUITS.find((item) => name.includes(item.id) || name.includes(item.id.slice(0, -1)) || new RegExp(`(^|[-_ ])${item.id[0]}($|[-_ ])`).test(name));
  const rank = [...deck.ranks].sort((left, right) => right.length - left.length).find((item) => new RegExp(`(^|[-_ ])${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()}($|[-_ ])`).test(name));
  if (!suit || !rank) return null;
  const copyMatch = name.match(/(?:copy|c)[-_ ]?(\d+)/);
  return { suit: suit.id, rank, copy: Math.min(rankCopyCount(deck, rank), Math.max(1, Number(copyMatch?.[1] || 1))) };
}

function targetLabel(item: BulkArtworkAssignment) {
  if (item.rank.startsWith("__JOKER_")) return `Joker ${item.rank.match(/\d+/)?.[0] || 1}`;
  const suit = SUITS.find((entry) => entry.id === item.suit)?.name || item.suit;
  return `${item.rank} of ${suit}${item.copy > 1 ? `, copy ${item.copy}` : ""}`;
}

export default function BulkArtworkModal({ deck, onApply, onClose, onNotice }: Props) {
  const [items, setItems] = useState<BulkArtworkAssignment[]>([]);
  const [applying, setApplying] = useState(false);
  const previewUrls = useRef<string[]>([]);
  const validCount = items.filter((item) => item.enabled).length;
  const rankOptions = useMemo(() => [
    ...deck.ranks.map((rank) => ({ value: rank, label: rank })),
    ...(deck.includeJokers ? Array.from({ length: deck.jokerCount }, (_, index) => ({ value: `__JOKER_${index + 1}__`, label: `Joker ${index + 1}` })) : []),
  ], [deck]);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function chooseFiles(files: File[]) {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const valid = files.filter((file) => !imageValidationError(file));
    if (valid.length !== files.length) onNotice(`${files.length - valid.length} unsupported or oversized file${files.length - valid.length === 1 ? " was" : "s were"} skipped.`);
    const next = valid.map((file) => {
      const inferred = inferTarget(file, deck);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        enabled: Boolean(inferred),
        suit: inferred?.suit || "spades",
        rank: inferred?.rank || deck.ranks[0] || "A",
        copy: inferred?.copy || 1,
      };
    });
    previewUrls.current = next.map((item) => item.previewUrl);
    setItems(next);
  }

  function update(id: string, patch: Partial<BulkArtworkAssignment>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  return <Modal className="bulk-modal" kicker="Batch artwork" title="Map artwork to cards" description="Filename matching is automatic. Review or change every destination before applying." onClose={onClose} closeDisabled={applying} footer={<><p>{validCount} of {items.length} files will be applied. If two rows target the same card, the later row wins.</p><button className="button button-primary" disabled={!validCount || applying} onClick={async () => { setApplying(true); try { await onApply(items.filter((item) => item.enabled)); } catch { onNotice("Artwork could not be applied. The current deck was left intact."); } finally { setApplying(false); } }}>{applying ? "Applying artwork…" : `Apply ${validCount} files`}</button></>}>
      <div className="bulk-body">
        <label className="art-drop"><Images /><strong>Choose artwork files</strong><span>PNG, JPG, or WebP up to 20 MB each</span><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseFiles([...(event.target.files || [])])} /></label>
        {items.length > 0 && <div className="bulk-mapping-table" role="table" aria-label="Artwork destinations">
          <div className="bulk-mapping-head" role="row"><span>Use</span><span>Preview</span><span>File</span><span>Rank</span><span>Suit</span><span>Copy</span><span /></div>
          {items.map((item) => {
            const joker = item.rank.startsWith("__JOKER_");
            const copies = joker ? 1 : rankCopyCount(deck, item.rank);
            return <div className="bulk-mapping-row" role="row" key={item.id}>
              <label className="bulk-use"><input type="checkbox" checked={item.enabled} onChange={(event) => update(item.id, { enabled: event.target.checked })} /><span className="sr-only">Use {item.file.name}</span></label>
              <img src={item.previewUrl} alt="" />
              <span className="bulk-file" title={item.file.name}>{item.file.name}<small>{targetLabel(item)}</small></span>
              <select aria-label={`Rank for ${item.file.name}`} value={item.rank} onChange={(event) => update(item.id, { rank: event.target.value, copy: 1, enabled: true })}>{rankOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              <select aria-label={`Suit for ${item.file.name}`} value={item.suit} disabled={joker} onChange={(event) => update(item.id, { suit: event.target.value as SuitId, enabled: true })}>{SUITS.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>
              <select aria-label={`Copy for ${item.file.name}`} value={Math.min(item.copy, copies)} disabled={joker || copies === 1} onChange={(event) => update(item.id, { copy: Number(event.target.value), enabled: true })}>{Array.from({ length: copies }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select>
              <button type="button" className="bulk-remove" onClick={() => { URL.revokeObjectURL(item.previewUrl); previewUrls.current = previewUrls.current.filter((url) => url !== item.previewUrl); setItems((current) => current.filter((entry) => entry.id !== item.id)); }} aria-label={`Remove ${item.file.name}`}><Trash2 /></button>
            </div>;
          })}
        </div>}
      </div>
  </Modal>;
}

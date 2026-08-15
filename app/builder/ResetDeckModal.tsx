"use client";

import Modal from "@/app/components/ui/Modal";

export default function ResetDeckModal({ busy, onClose, onReset }: { busy: boolean; onClose: () => void; onReset: () => Promise<void> }) {
  return <Modal className="confirm-modal" kicker="Permanent on this device" title="Start a new deck?" role="alertdialog" onClose={onClose} closeDisabled={busy} footer={<><button className="button button-quiet" onClick={onClose} disabled={busy}>Keep this deck</button><button className="button danger-button" onClick={() => void onReset()} disabled={busy}>{busy ? "Clearing…" : "Clear and start over"}</button></>}>
    <p>This clears the saved deck, artwork, and settings from this browser. Export a backup first if you may need them again.</p>
  </Modal>;
}

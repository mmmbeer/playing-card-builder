import JSZip from "jszip";
import { collectImageKeys } from "./deck-assets";
import { getImage, putImage } from "./storage";
import { migrateDeck, type DeckSettings, type ImageUrls, type SuitId } from "./types";

export type ExportCard = { copy: number; joker: boolean; rank: string; suit: SuitId };

export function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "card";
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function createProjectBackup(deck: DeckSettings) {
  const zip = new JSZip();
  let missing = 0;
  zip.file("deck.json", JSON.stringify(deck, null, 2));
  await Promise.all(collectImageKeys(deck).map(async (key) => {
    try {
      const blob = await getImage(key);
      if (blob) zip.file(`assets/${key}`, blob);
      else missing += 1;
    } catch {
      missing += 1;
    }
  }));
  zip.file("README.txt", "Deck Forged project backup\n\nImport this ZIP from the editor to restore deck settings, card artwork, and a custom suit sheet.");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return { blob, missing };
}

export async function createPrintArchive(
  cards: ExportCard[],
  render: (suit: SuitId, rank: string, copy?: number) => Promise<Blob>,
  onProgress: (current: number, total: number) => void,
  isCancelled: () => boolean,
) {
  const zip = new JSZip();
  for (let index = 0; index < cards.length; index += 1) {
    if (isCancelled()) return null;
    const card = cards[index];
    const blob = await render(card.suit, card.rank, card.copy);
    const filename = card.joker
      ? `joker-${card.rank.match(/\d+/)?.[0] || 1}.png`
      : `${safeFilename(card.rank)}-${card.suit}${card.copy > 1 ? `-copy-${card.copy}` : ""}.png`;
    zip.file(filename, blob);
    onProgress(index + 1, cards.length);
  }
  if (isCancelled()) return null;
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function importProjectBackup(file: File) {
  let deck: DeckSettings;
  const images: ImageUrls = {};
  let unsaved = 0;
  if (file.name.toLowerCase().endsWith(".zip") || file.type.includes("zip")) {
    const zip = await JSZip.loadAsync(file);
    const deckFile = zip.file("deck.json");
    if (!deckFile) throw new Error("This backup is missing deck.json.");
    deck = migrateDeck(JSON.parse(await deckFile.async("text")));
    await Promise.all(collectImageKeys(deck).map(async (key) => {
      const asset = zip.file(`assets/${key}`);
      if (!asset) return;
      const blob = await asset.async("blob");
      try { await putImage(key, blob); } catch { unsaved += 1; }
      images[key] = URL.createObjectURL(blob);
    }));
  } else {
    deck = migrateDeck(JSON.parse(await file.text()));
    await Promise.all(collectImageKeys(deck).map(async (key) => {
      try {
        const blob = await getImage(key);
        if (blob) images[key] = URL.createObjectURL(blob);
      } catch {
        unsaved += 1;
      }
    }));
  }
  return { deck, images, unsaved };
}

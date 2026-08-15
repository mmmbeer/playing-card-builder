import type { DeckSettings } from "./types";
import { createDefaultDeck, migrateDeck } from "./types";

const DRAFT_KEY = "deckforged:draft:v5";
const LEGACY_KEYS = ["deckforged:draft:v4", "deckforged:draft:v3", "deckforged:draft:v2"];
const DB_NAME = "deckforged-assets";
const STORE_NAME = "card-images";

export function loadDraft(): DeckSettings {
  if (typeof window === "undefined") return createDefaultDeck();
  try {
    const raw = localStorage.getItem(DRAFT_KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    return raw ? migrateDeck(JSON.parse(raw)) : createDefaultDeck();
  } catch {
    return createDefaultDeck();
  }
}

export function saveDraft(deck: DeckSettings) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(deck));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Artwork storage could not be opened."));
    request.onblocked = () => reject(new Error("Artwork storage is blocked by another tab."));
  });
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      let value: T | undefined;
      if (request) {
        request.onsuccess = () => { value = request.result; };
        request.onerror = () => reject(request.error || new Error("Artwork storage failed."));
      }
      transaction.oncomplete = () => resolve(value);
      transaction.onerror = () => reject(transaction.error || new Error("Artwork storage failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Artwork storage was interrupted."));
    });
  } finally {
    db.close();
  }
}

export async function putImage(key: string, file: Blob) {
  await withStore("readwrite", (store) => store.put(file, key));
}

export async function getImage(key: string) {
  return withStore<Blob>("readonly", (store) => store.get(key));
}

export async function deleteImage(key: string) {
  await withStore("readwrite", (store) => store.delete(key));
}

export async function clearImages() {
  await withStore("readwrite", (store) => store.clear());
}

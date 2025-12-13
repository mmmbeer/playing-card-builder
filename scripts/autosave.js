import {
  settings,
  deck,
  activeRanks,
  initDeck,
  resetSettingsToDefaults,
  resetDeckState,
  DEFAULT_SETTINGS,
  JOKER_SUIT_ID
} from "./state.js";
import {
  saveImageFromSource,
  getImageRecord,
  deleteImageDatabase
} from "./indexedDB.js";
import { SUITS } from "./config.js";
import {
  finishProgressError,
  finishProgressSuccess,
  isProgressCancelled,
  onProgressCancel,
  setProgressOperation,
  showProgress,
  updateProgress
} from "./ui/controls/progressOverlay.js";

let badge;
function getBadge() {
  if (!badge) badge = document.getElementById("autosaveStatus");
  return badge;
}
function setStatusSaving() {
  const b = getBadge();
  if (!b) return;
  b.textContent = "Saving 🔃";
  b.className = "autosave-badge saving";
}
function setStatusSaved() {
  const b = getBadge();
  if (!b) return;
  b.textContent = "Saved ✓";
  b.className = "autosave-badge saved";
}
function setStatusError() {
  const b = getBadge();
  if (!b) return;
  b.textContent = "Save failed ⚠️";
  b.className = "autosave-badge error";
}

function applyNewSettingDefaults(target) {
  if (!target) return;
  Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
    if (typeof target[key] === "undefined") target[key] = value;
  });
}

function dataURLToImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

function revokeIfBlob(url) {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

async function loadImageRecord(imageId) {
  if (!imageId) return { image: null, url: null };
  const record = await getImageRecord(imageId);
  if (!record?.blob) return { image: null, url: null };
  const url = URL.createObjectURL(record.blob);
  const img = await dataURLToImage(url);
  if (img.decode) {
    try { await img.decode(); } catch (_) {}
  }
  return { image: img, url };
}

async function ensureCardImageId(card) {
  if (!card) return null;
  if (card.faceImageId) return card.faceImageId;

  if (card.faceImage) {
    const id = await saveImageFromSource(card.faceImage, "face");
    card.faceImageId = id;
    return id;
  }

  if (card.faceImageUrl && card.faceImageUrl.startsWith("data:image")) {
    try {
      const img = await dataURLToImage(card.faceImageUrl);
      const id = await saveImageFromSource(img, "face");
      card.faceImageId = id;
      card.faceImage = img;
      return id;
    } catch (err) {
      console.warn("Failed to store legacy face image:", err);
    }
  }

  return null;
}

async function ensureIconImageId() {
  if (settings.iconPresetId) return null;
  if (!settings.iconSheet) return settings.customIconImageId || null;
  const id = await saveImageFromSource(
    settings.iconSheet,
    "suit",
    settings.customIconImageId || null
  );
  settings.customIconImageId = id;
  return id;
}

function countSerializedCards(serial = {}) {
  let total = 0;

  Object.values(serial).forEach(ranks => {
    Object.values(ranks || {}).forEach(entry => {
      if (Array.isArray(entry)) {
        total += entry.length;
      } else if (entry) {
        total += 1;
      }
    });
  });

  return total;
}

function describeCardLabel(suitId, rank, copyIndex = 1, totalCopies = 1) {
  if (suitId === JOKER_SUIT_ID) {
    const jokerIndex = Number((rank || "").split("_")[1]) || copyIndex;
    const suffix = totalCopies > 1 ? ` ${jokerIndex} of ${totalCopies}` : "";
    return `Restoring Joker${suffix}`;
  }

  const suitLabel = SUITS.find(s => s.id === suitId)?.label || suitId;
  const copySuffix = totalCopies > 1 ? ` (copy ${copyIndex} of ${totalCopies})` : "";
  return `Restoring ${rank} of ${suitLabel}${copySuffix}`;
}

async function serializeDeck() {
  const out = {};

  for (const suitId in deck) {
    out[suitId] = {};

    for (const rank in deck[suitId]) {
      const entry = deck[suitId][rank];

      if (Array.isArray(entry)) {
        out[suitId][rank] = [];
        for (const card of entry) {
          out[suitId][rank].push(await serializeCard(card));
        }
      } else {
        out[suitId][rank] = await serializeCard(entry);
      }
    }
  }

  return out;
}

async function serializeCard(card) {
  const imageId = await ensureCardImageId(card);

  return {
    offsetX: card?.offsetX,
    offsetY: card?.offsetY,
    scale: card?.scale,
    rotation: card?.rotation,
    flipH: card?.flipH,
    flipV: card?.flipV,
    mirrorCorners: card?.mirrorCorners ?? null,
    faceImageId: imageId || null,
    abilityMarkdown: card?.abilityMarkdown || ""
  };
}

function buildSettingsPayload() {
  const { iconSheet, ...settingsWithoutImage } = settings;
  return { ...settingsWithoutImage };
}

async function restoreDeck(serial, progress = null) {
  if (!serial) return 0;

  let processed = 0;

  for (const suitId in serial) {
    if (!deck[suitId]) continue;

    for (const rank in serial[suitId]) {
      if (progress?.shouldAbort?.()) return processed;

      const savedEntry = serial[suitId][rank];
      const target = deck[suitId][rank];
      if (!target || !savedEntry) continue;

      if (Array.isArray(savedEntry)) {
        const targets = Array.isArray(target) ? target : [target];
        const limit = Math.min(savedEntry.length, targets.length);
        for (let i = 0; i < limit; i++) {
          if (progress?.shouldAbort?.()) return processed;

          const label = describeCardLabel(suitId, rank, i + 1, savedEntry.length);
          progress?.onCard?.(label, processed + 1);

          await applySavedCard(targets[i], savedEntry[i]);

          processed += 1;
          progress?.onCardComplete?.(processed);
        }
      } else if (Array.isArray(target)) {
        if (target[0]) {
          const label = describeCardLabel(suitId, rank, 1, target.length);
          progress?.onCard?.(label, processed + 1);
          await applySavedCard(target[0], savedEntry);
          processed += 1;
          progress?.onCardComplete?.(processed);
        }
      } else {
        const label = describeCardLabel(suitId, rank, 1, 1);
        progress?.onCard?.(label, processed + 1);
        await applySavedCard(target, savedEntry);
        processed += 1;
        progress?.onCardComplete?.(processed);
      }
    }
  }

  return processed;
}

async function applySavedCard(card, saved) {
  if (!card || !saved) return;

  card.offsetX = saved.offsetX ?? 0;
  card.offsetY = saved.offsetY ?? 0;
  card.scale = saved.scale ?? 1;
  card.rotation = saved.rotation ?? 0;
  card.flipH = saved.flipH ?? false;
  card.flipV = saved.flipV ?? false;
  card.mirrorCorners = saved.mirrorCorners ?? null;
  card.abilityMarkdown = saved.abilityMarkdown ?? "";

  const savedImageId = saved.faceImageId || null;
  let resolvedImageId = savedImageId;

  if (!resolvedImageId && saved.faceImageUrl) {
    try {
      const img = await dataURLToImage(saved.faceImageUrl);
      resolvedImageId = await saveImageFromSource(img, "face");
    } catch (err) {
      console.warn("Failed to restore face image:", err);
    }
  }

  if (resolvedImageId) {
    const { image, url } = await loadImageRecord(resolvedImageId);
    card.faceImageId = resolvedImageId;
    card.faceImage = image;
    revokeIfBlob(card.faceImageUrl);
    card.faceImageUrl = url;
  } else {
    revokeIfBlob(card.faceImageUrl);
    card.faceImageId = null;
    card.faceImage = null;
    card.faceImageUrl = null;
  }
}

let saveTimeout = null;
async function persistState() {
  const deckSerialized = await serializeDeck();
  const settingsPayload = buildSettingsPayload();
  const suitIconImageId = (await ensureIconImageId()) || settings.customIconImageId || null;

  const payload = {
    settings: settingsPayload,
    deck: deckSerialized,
    activeRanks,
    suitIconImageId,
    timestamp: Date.now()
  };

  localStorage.setItem("cardDesignerAutosave", JSON.stringify(payload));
}

function scheduleSave() {
  clearTimeout(saveTimeout);
  setStatusSaving();
  saveTimeout = setTimeout(async () => {
    try {
      await persistState();
      setStatusSaved();
    } catch (err) {
      console.error("Autosave failed:", err);
      setStatusError();
    }
  }, 500);
}

export function markDirty() {
  window.dispatchEvent(new CustomEvent("appDirty"));
}

export async function forceSave() {
  setStatusSaving();
  try {
    await persistState();
    setStatusSaved();
  } catch (err) {
    console.error("Autosave failed:", err);
    setStatusError();
  }
}

export async function importSave(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await applyRestorePayload(data);
    window.dispatchEvent(new CustomEvent("saveImported"));
  } catch (err) {
    console.error("Failed to import save:", err);
    setStatusError();
  }
}

async function applyRestorePayload(data, options = {}) {
  const { progress = null } = options;

  const restoredSettings = data.settings || {};

  let legacyIconImage = null;
  if (restoredSettings.customIconDataURL && !restoredSettings.customIconImageId) {
    const img = await dataURLToImage(restoredSettings.customIconDataURL);
    restoredSettings.customIconImageId = await saveImageFromSource(img, "suit");
    legacyIconImage = img;
  }

  delete restoredSettings.customIconDataURL;
  applyNewSettingDefaults(restoredSettings);

  Object.assign(settings, restoredSettings);
  settings.customIconImageId = data.suitIconImageId || restoredSettings.customIconImageId || null;

  if (Array.isArray(data.activeRanks)) {
    activeRanks.length = 0;
    data.activeRanks.forEach(r => activeRanks.push(r));
  }

  initDeck();

  const iconSheetPromise = restoreIconSheet(
    settings.customIconImageId,
    settings.iconPresetId,
    legacyIconImage
  );

  if (progress?.shouldAbort?.()) return { cancelled: true };

  const progressHooks = progress
    ? {
        onCard: progress.onCard,
        onCardComplete: progress.onCardComplete,
        shouldAbort: progress.shouldAbort
      }
    : null;

  await restoreDeck(data.deck, progressHooks);

  if (progress?.shouldAbort?.()) return { cancelled: true };

  settings.iconSheet = (await iconSheetPromise) || settings.iconSheet;

  requestAnimationFrame(() =>
    window.dispatchEvent(new CustomEvent("forceSyncAndRender"))
  );

  setStatusSaved();

  return { cancelled: false };
}

async function restoreIconSheet(imageId, presetId, fallbackImage = null) {
  if (fallbackImage) return fallbackImage;

  if (imageId) {
    const { image } = await loadImageRecord(imageId);
    return image;
  }

  if (presetId) return null; // UI preset loader will hydrate
  return null;
}

export async function initAutosave() {
  const raw = localStorage.getItem("cardDesignerAutosave");
  if (raw) {
    await restoreFromAutosave(raw);
  }

  window.addEventListener("appDirty", scheduleSave);

  window.addEventListener("beforeunload", () => {
    if (saveTimeout) forceSave();
  });
}

function createRestoreProgress(totalCards) {
  const total = Math.max(1, totalCards || 0);
  let current = 0;

  return {
    start(title = "Restoring your last session…") {
      showProgress({ total, title });
      updateProgress(0);
    },
    onCard(label) {
      setProgressOperation(label);
    },
    onCardComplete(count) {
      current = Number(count) || 0;
      updateProgress(current);
    },
    shouldAbort() {
      return isProgressCancelled();
    }
  };
}

function createRestoreCancelHandler() {
  return async () => {
    const confirmed = confirm(
      "Cancel restoring your autosave and reset everything to defaults?"
    );

    if (!confirmed) return false;

    setProgressOperation("Resetting deck to factory defaults…");
    await resetAllState();
    finishProgressSuccess("Autosave cleared. Starting fresh.");
    return true;
  };
}

async function restoreFromAutosave(raw) {
  try {
    const data = JSON.parse(raw);
    const totalCards = countSerializedCards(data.deck);
    const progress = createRestoreProgress(totalCards);

    progress.start();
    setProgressOperation("Preparing saved settings…");
    onProgressCancel(createRestoreCancelHandler());

    const result = await applyRestorePayload(data, { progress });

    if (!result?.cancelled && !progress.shouldAbort()) {
      finishProgressSuccess("Restored your last session.");
    }
  } catch (err) {
    console.warn("Autosave load failed:", err);
    finishProgressError("Autosave restore failed. Starting with defaults.");
    setStatusError();
  }
}

export async function resetAllState() {
  clearTimeout(saveTimeout);
  localStorage.removeItem("cardDesignerAutosave");
  await deleteImageDatabase();
  resetSettingsToDefaults();
  resetDeckState();
  requestAnimationFrame(() =>
    window.dispatchEvent(new CustomEvent("forceSyncAndRender"))
  );
  setStatusSaved();
}

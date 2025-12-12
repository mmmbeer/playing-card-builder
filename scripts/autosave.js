import { settings, deck, activeRanks, initDeck } from "./state.js";

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

async function ensureDataURL(value) {
  if (!value) return null;
  if (typeof value === "string" && value.startsWith("data:image")) return value;
  if (value instanceof HTMLImageElement) {
    const w = value.naturalWidth || value.width;
    const h = value.naturalHeight || value.height;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(value, 0, 0);
    return canvas.toDataURL("image/png");
  }
  return null;
}

function dataURLToImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

async function serializeDeck() {
  const out = {};
  for (const suitId in deck) {
    out[suitId] = {};
    for (const rank in deck[suitId]) {
      const card = deck[suitId][rank];
      const storedDataUrl =
        (await ensureDataURL(card.faceImageUrl)) ||
        (await ensureDataURL(card.faceImage)) ||
        null;
      out[suitId][rank] = {
        offsetX: card.offsetX,
        offsetY: card.offsetY,
        scale: card.scale,
        rotation: card.rotation,
        flipH: card.flipH,
        flipV: card.flipV,
        mirrorCorners: card.mirrorCorners ?? null,
        faceImageUrl: storedDataUrl,
        abilityMarkdown: card.abilityMarkdown || ''
      };
    }
  }
  return out;
}

async function buildSettingsPayload() {
  const { iconSheet, customIconDataURL, iconPresetId, ...settingsWithoutImage } = settings;

  const resolvedCustomUrl = iconPresetId
    ? null
    : customIconDataURL || (await ensureDataURL(iconSheet));

  return {
    ...settingsWithoutImage,
    customIconDataURL: resolvedCustomUrl || null,
    iconPresetId: iconPresetId || null
  };
}

async function rebuildIconSheetFromSettings(savedSettings) {
  if (!savedSettings?.customIconDataURL) return null;

  const img = await dataURLToImage(savedSettings.customIconDataURL);
  if (img.decode) {
    try { await img.decode(); } catch (_) {}
  }

  return img;
}

async function restoreDeck(serial) {
  if (!serial) return;

  for (const suitId in serial) {
    if (!deck[suitId]) continue;

    for (const rank in serial[suitId]) {
      const saved = serial[suitId][rank];
      const card = deck[suitId][rank];
      if (!card) continue;

      card.offsetX = saved.offsetX ?? 0;
      card.offsetY = saved.offsetY ?? 0;
      card.scale = saved.scale ?? 1;
      card.rotation = saved.rotation ?? 0;
      card.flipH = saved.flipH ?? false;
      card.flipV = saved.flipV ?? false;
      card.mirrorCorners = saved.mirrorCorners ?? null;
      card.abilityMarkdown = saved.abilityMarkdown ?? '';

      if (saved.faceImageUrl) {
        const img = await dataURLToImage(saved.faceImageUrl);
        if (img.decode) {
          try { await img.decode(); } catch (_) {}
        }
        card.faceImage = img;
        card.faceImageUrl = saved.faceImageUrl;
      } else {
        card.faceImage = null;
        card.faceImageUrl = null;
      }
    }
  }
}

let saveTimeout = null;
function scheduleSave() {
  clearTimeout(saveTimeout);
  setStatusSaving();
  saveTimeout = setTimeout(async () => {
    try {
      const deckSerialized = await serializeDeck();
      const settingsPayload = await buildSettingsPayload();

      const payload = {
        settings: settingsPayload,
        deck: deckSerialized,
        activeRanks,
        timestamp: Date.now()
      };

      localStorage.setItem(
        "cardDesignerAutosave",
        JSON.stringify(payload)
      );
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
  const deckSerialized = await serializeDeck();
  const settingsPayload = await buildSettingsPayload();
  const payload = {
    settings: settingsPayload,
    deck: deckSerialized,
    activeRanks,
    timestamp: Date.now()
  };
  localStorage.setItem("cardDesignerAutosave", JSON.stringify(payload));
  setStatusSaved();
}

export async function importSave(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const restoredSheet = await rebuildIconSheetFromSettings(data.settings);
    const currentSheet = settings.iconSheet;
    Object.assign(settings, data.settings);
    settings.iconSheet = restoredSheet || currentSheet;
    await restoreDeck(data.deck);
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("forceSyncAndRender"));
    });
    setStatusSaved();
    window.dispatchEvent(new CustomEvent("saveImported"));
  } catch (err) {
    console.error("Failed to import save:", err);
    setStatusError();
  }
}

export async function initAutosave() {
  const raw = localStorage.getItem("cardDesignerAutosave");
  if (raw) {
    try {
      const data = JSON.parse(raw);

      const restoredSheetPromise = rebuildIconSheetFromSettings(data.settings);

      // Restore settings immediately so UI hydration uses saved values
      const currentSheet = settings.iconSheet;
      Object.assign(settings, data.settings);
      settings.customIconDataURL = data.settings.customIconDataURL || null;
      settings.iconPresetId = data.settings.iconPresetId || null;

      // 1) Restore activeRanks first (this defines which cards should exist)
      if (Array.isArray(data.activeRanks)) {
        activeRanks.length = 0;
        data.activeRanks.forEach(r => activeRanks.push(r));
      }

      // 2) Ensure deck structure exists for these suits/ranks
      //    This creates proxied card objects in deck[suitId][rank]
      initDeck();

      const restoredSheet = await restoredSheetPromise;
      settings.iconSheet = restoredSheet || currentSheet;

      // 3) Now safely apply saved per-card state (including faceImageUrl)
      await restoreDeck(data.deck);

      // Force UI sync & redraw using your existing mechanism
      requestAnimationFrame(() =>
        window.dispatchEvent(new CustomEvent("forceSyncAndRender"))
      );

      setStatusSaved();
    } catch (err) {
      console.warn("Autosave load failed:", err);
      setStatusError();
    }
  }

  // Keep existing autosave wiring
  window.addEventListener("appDirty", scheduleSave);

  window.addEventListener("beforeunload", () => {
    if (saveTimeout) forceSave();
  });
}

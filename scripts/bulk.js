// bulk.js
import { deck, settings, activeRanks } from "./state.js";
import { SAFE_HEIGHT, SUITS as SUIT_OBJECTS } from "./config.js";

// convert config SUITS = [{id:"spades"},...] → ["spades","hearts"...]
const SUITS = SUIT_OBJECTS.map(s => s.id);

let bulkModal;
let bulkInput;
let bulkTable;
let applyButton;
let cancelButton;
let closeButton;
let renderFn;

let pendingFiles = [];

// ------------------------------------------------
// Parse filename → { rank, suit }
// ------------------------------------------------
export function parseFilename(name) {
  const lower = name.toLowerCase().replace(/\.[a-z0-9]+$/, "");
  const parts = lower.split(/[^a-z0-9]+/g).filter(Boolean);

  const suit = parts.find(p => SUITS.includes(p));
  const rankRaw = parts.find(p => activeRanks.includes(p.toUpperCase()));

  return {
    suit: suit || "",
    rank: rankRaw ? rankRaw.toUpperCase() : ""
  };
}

// ------------------------------------------------
// Create table row for an image mapping
// ------------------------------------------------
function createRow(file, parsed) {
  const tr = document.createElement("tr");
  tr.className = "bulk-row";

  // Thumbnail
  const imgTd = document.createElement("td");
  const img = document.createElement("img");
  img.className = "bulk-thumb";
  img.src = URL.createObjectURL(file);
  imgTd.appendChild(img);

  // Rank selector
  const rankTd = document.createElement("td");
  const rankSelect = document.createElement("select");

  const blankRank = document.createElement("option");
  blankRank.value = "";
  blankRank.textContent = "—";
  rankSelect.appendChild(blankRank);

  activeRanks.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    if (r === parsed.rank) opt.selected = true;
    rankSelect.appendChild(opt);
  });

  rankTd.appendChild(rankSelect);

  // Suit selector
  const suitTd = document.createElement("td");
  const suitSelect = document.createElement("select");

  const blankSuit = document.createElement("option");
  blankSuit.value = "";
  blankSuit.textContent = "—";
  suitSelect.appendChild(blankSuit);

  SUITS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === parsed.suit) opt.selected = true;
    suitSelect.appendChild(opt);
  });

  suitTd.appendChild(suitSelect);

  tr.appendChild(imgTd);
  tr.appendChild(rankTd);
  tr.appendChild(suitTd);

  return {
    tr,
    img,
    rankSelect,
    suitSelect
  };
}

// ------------------------------------------------
// Apply all mappings to deck
// ------------------------------------------------
async function applyMappings() {
  for (let i = 0; i < pendingFiles.length; i++) {
    const entry = pendingFiles[i];
    const file = entry.file;

    const rank = entry.rankSelect.value.trim();
    const suit = entry.suitSelect.value.trim();

    if (!rank || !suit) continue;

    const card = deck[suit]?.[rank];
    if (!card) continue;

    const url = URL.createObjectURL(file);
    const img = await loadImageAsync(url);

    card.faceImage = img;
    card.faceImageUrl = url;

    // Auto-scale vertically into safe area
    const baseScale = SAFE_HEIGHT / img.height;
    card.scale = baseScale;

    // Reset transforms
    card.offsetX = 0;
    card.offsetY = 0;
    card.rotation = 0;
    card.flipH = false;
    card.flipV = false;
  }

  closeBulkModal();

  if (renderFn) renderFn();
}

// ------------------------------------------------
function loadImageAsync(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

// ------------------------------------------------
// Open modal
// ------------------------------------------------
export function openBulkModal(renderCurrentCardFn) {
  renderFn = renderCurrentCardFn;

  bulkModal.classList.remove("hidden");
  bulkTable.innerHTML = "";
  pendingFiles = [];
}

// ------------------------------------------------
// Close modal
// ------------------------------------------------
function closeBulkModal() {
  bulkModal.classList.add("hidden");
  bulkInput.value = "";
  bulkTable.innerHTML = "";
  pendingFiles = [];
}

// ------------------------------------------------
// Handle file selection
// ------------------------------------------------
function handleFiles(fileList) {
  pendingFiles = [];

  for (const file of fileList) {
    const parsed = parseFilename(file.name);
    const row = createRow(file, parsed);

    pendingFiles.push({
      file,
      ...row
    });

    bulkTable.appendChild(row.tr);
  }
}

// ------------------------------------------------
// Initialize references + wiring
// ------------------------------------------------
export function initBulkLoader() {
  bulkModal = document.getElementById("bulkFaceModal");
  bulkInput = document.getElementById("bulkFaceInput");
  bulkTable = document.getElementById("bulkFaceTable");
  applyButton = document.getElementById("bulkApplyButton");
  cancelButton = document.getElementById("bulkCancelButton");
  closeButton = document.getElementById("bulkCloseBtn");

  bulkInput.addEventListener("change", () =>
    handleFiles(Array.from(bulkInput.files))
  );

  applyButton.addEventListener("click", applyMappings);
  cancelButton.addEventListener("click", closeBulkModal);
  closeButton.addEventListener("click", closeBulkModal);

  // Standardized modal behavior:
  // Close on ESC
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && !bulkModal.classList.contains("hidden")) {
      closeBulkModal();
    }
  });

  // Close when clicking outside modal-content
  bulkModal.addEventListener("click", e => {
    if (e.target === bulkModal) closeBulkModal();
  });
}

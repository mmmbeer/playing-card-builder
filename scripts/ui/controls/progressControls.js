// ui/controls/progressControls.js
// Provides "Save Progress" and "Import" functionality in the Export panel.
// This uses the same autosave payload format (cardDesignerAutosave in localStorage)
// and wraps it into / extracts it from a ZIP file.

import { forceSave, importSave } from "../../autosave.js";

const AUTOSAVE_KEY = "cardDesignerAutosave";
const DEFAULT_ZIP_NAME = "card-designer-progress.zip";
const DEFAULT_ENTRY_NAME = "cardDesignerAutosave.json";

/**
 * Wire up the Export panel badges for saving/loading progress.
 */
export function initProgressControls() {
  const saveBadge = document.getElementById("saveProgressBadge");
  const importBadge = document.getElementById("importProgressBadge");
  const importInput = document.getElementById("importProgressInput");

  if (!saveBadge || !importBadge || !importInput) {
    // Export panel not present; nothing to do.
    return;
  }

  saveBadge.addEventListener("click", () => {
    handleSaveProgress().catch(err => {
      console.error("[SaveProgress] Failed to save progress:", err);
      alert("Could not save progress. Check the console for details.");
    });
  });

  importBadge.addEventListener("click", () => {
    // Trigger the hidden file input
    importInput.click();
  });

  importInput.addEventListener("change", evt => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    handleImportProgress(file)
      .catch(err => {
        console.error("[SaveProgress] Failed to import progress:", err);
        alert("Could not import progress. Check the console for details.");
      })
      .finally(() => {
        // Allow re-selecting the same file later
        importInput.value = "";
      });
  });
}

async function handleSaveProgress() {
  const JSZipLib = window.JSZip;
  if (!JSZipLib) {
    alert("JSZip library is not available. Cannot save progress.");
    return;
  }

  // Ensure the latest state has been persisted to localStorage
  await forceSave();

  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) {
    alert("No progress data found to save yet.");
    return;
  }

  const zip = new JSZipLib();
  zip.file(DEFAULT_ENTRY_NAME, raw);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = DEFAULT_ZIP_NAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

async function handleImportProgress(file) {
  const JSZipLib = window.JSZip;
  if (!JSZipLib) {
    alert("JSZip library is not available. Cannot import progress.");
    return;
  }

  const zip = await JSZipLib.loadAsync(file);

  // Prefer our canonical entry name, but fall back to any JSON file
  let entry =
    zip.file(DEFAULT_ENTRY_NAME) ||
    zip.file("card-designer-progress.json") ||
    (zip.file(/\.json$/i)[0] ?? null);

  if (!entry) {
    alert("The selected ZIP file does not contain a progress JSON file.");
    return;
  }

  const jsonText = await entry.async("string");

  // importSave expects a File/Blob with a .text() method; Blob is fine.
  const blob = new Blob([jsonText], { type: "application/json" });
  await importSave(blob);
}

// ui/sync.js
//
// Fully updated drop-in replacement.
// Ensures autosaved face images correctly appear in UI.
// Syncs sliders, flips, and label based on restored card state.

// ui/sync.js
export function syncControls(card, settings, dom) {
  if (!card) return;

  dom.mirrorCardCheckbox.checked =
    typeof card.mirrorCorners === "boolean"
      ? card.mirrorCorners
      : settings.mirrorDefault;

  if (card.faceImageUrl) {
    dom.faceImageLabel.textContent = "(image loaded)";
  } else {
    dom.faceImageLabel.textContent = "Click to add…";
  }

  dom.faceScaleInput.value = card.scale ?? 1;
  dom.faceRotationInput.value = card.rotation ?? 0;

  dom.faceFlipHCheckbox.checked = !!card.flipH;
  dom.faceFlipVCheckbox.checked = !!card.flipV;
}

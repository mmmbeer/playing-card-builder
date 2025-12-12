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

  if (dom.abilityMarkdownInput) {
    dom.abilityMarkdownInput.value = card.abilityMarkdown || '';
  }

  if (dom.abilityPlacementSelect) {
    dom.abilityPlacementSelect.value = settings.abilityPlacement;
  }
  if (dom.abilityMirrorCheckbox) {
    dom.abilityMirrorCheckbox.checked = !!settings.abilityMirror;
  }
  if (dom.abilityAlignmentSelect) {
    dom.abilityAlignmentSelect.value = settings.abilityAlignment || 'center';
  }
  if (dom.abilityWidthInput) {
    dom.abilityWidthInput.value = settings.abilityWidthPercent;
  }
  if (dom.abilityHeightModeSelect) {
    dom.abilityHeightModeSelect.value = settings.abilityHeightMode;
  }
  if (dom.abilityFixedHeightInput) {
    dom.abilityFixedHeightInput.value = settings.abilityFixedHeight;
    dom.abilityFixedHeightInput.disabled = settings.abilityHeightMode !== 'fixed';
  }
  if (dom.abilityOverflowSelect) {
    dom.abilityOverflowSelect.value = settings.abilityOverflow;
    dom.abilityOverflowSelect.disabled = settings.abilityHeightMode !== 'fixed';
  }
  if (dom.abilityBackgroundInput) {
    dom.abilityBackgroundInput.value = settings.abilityBackground;
  }
  if (dom.abilityBackgroundOpacityInput) {
    dom.abilityBackgroundOpacityInput.value = settings.abilityBackgroundOpacity;
  }
  if (dom.abilityHeaderFontLabel) {
    dom.abilityHeaderFontLabel.textContent = settings.abilityHeaderFontFamily;
  }
  if (dom.abilityBodyFontLabel) {
    dom.abilityBodyFontLabel.textContent = settings.abilityBodyFontFamily;
  }
  if (dom.abilityHeaderFontSizeInput) {
    dom.abilityHeaderFontSizeInput.value = settings.abilityHeaderFontSize;
  }
  if (dom.abilityBodyFontSizeInput) {
    dom.abilityBodyFontSizeInput.value = settings.abilityBodyFontSize;
  }
  if (dom.abilityHeaderFontWeightSelect) {
    dom.abilityHeaderFontWeightSelect.value = settings.abilityHeaderFontWeight;
  }
  if (dom.abilityBodyFontWeightSelect) {
    dom.abilityBodyFontWeightSelect.value = settings.abilityBodyFontWeight;
  }
  if (dom.abilityTextColorInput) {
    dom.abilityTextColorInput.value = settings.abilityTextColor;
  }
  if (dom.abilityTextOpacityInput) {
    dom.abilityTextOpacityInput.value = settings.abilityTextOpacity;
  }
}

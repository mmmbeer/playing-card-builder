import { markDirty } from "../../autosave.js";
import { openFontBrowser } from "../../fonts.js";

function loadFont(family, onActive) {
  if (!family) return;
  WebFont.load({
    google: { families: [family] },
    active: () => onActive && onActive()
  });
}

function updateHeightVisibility(dom, settings) {
  const fixed = settings.abilityHeightMode === 'fixed';
  if (dom.abilityFixedHeightInput) {
    dom.abilityFixedHeightInput.disabled = !fixed;
  }
  if (dom.abilityOverflowSelect) {
    dom.abilityOverflowSelect.disabled = !fixed;
  }
  if (dom.abilityFixedControls) {
    dom.abilityFixedControls.classList.toggle('hidden', !fixed);
  }
}

export function initAbilityControls(dom, settings, getCard, render) {
  if (dom.abilityMarkdownInput) {
    dom.abilityMarkdownInput.addEventListener('input', () => {
      const card = getCard();
      if (!card) return;
      card.abilityMarkdown = dom.abilityMarkdownInput.value;
      markDirty();
      render();
    });
  }

  dom.abilityPlacementSelect?.addEventListener('change', () => {
    settings.abilityPlacement = dom.abilityPlacementSelect.value;
    markDirty();
    render();
  });

  dom.abilityMirrorCheckbox?.addEventListener('change', () => {
    settings.abilityMirror = dom.abilityMirrorCheckbox.checked;
    markDirty();
    render();
  });

  dom.abilityAlignmentSelect?.addEventListener('change', () => {
    settings.abilityAlignment = dom.abilityAlignmentSelect.value;
    markDirty();
    render();
  });

  dom.abilityWidthInput?.addEventListener('input', () => {
    settings.abilityWidthPercent = Number(dom.abilityWidthInput.value);
    markDirty();
    render();
  });

  dom.abilityHeightModeSelect?.addEventListener('change', () => {
    settings.abilityHeightMode = dom.abilityHeightModeSelect.value;
    updateHeightVisibility(dom, settings);
    markDirty();
    render();
  });

  dom.abilityFixedHeightInput?.addEventListener('input', () => {
    settings.abilityFixedHeight = Number(dom.abilityFixedHeightInput.value);
    markDirty();
    render();
  });

  dom.abilityOverflowSelect?.addEventListener('change', () => {
    settings.abilityOverflow = dom.abilityOverflowSelect.value;
    markDirty();
    render();
  });

  dom.abilityBackgroundInput?.addEventListener('input', () => {
    settings.abilityBackground = dom.abilityBackgroundInput.value;
    markDirty();
    render();
  });

  dom.abilityBackgroundOpacityInput?.addEventListener('input', () => {
    settings.abilityBackgroundOpacity = Number(dom.abilityBackgroundOpacityInput.value);
    markDirty();
    render();
  });

  dom.abilityTextColorInput?.addEventListener('input', () => {
    settings.abilityTextColor = dom.abilityTextColorInput.value;
    markDirty();
    render();
  });

  dom.abilityTextOpacityInput?.addEventListener('input', () => {
    settings.abilityTextOpacity = Number(dom.abilityTextOpacityInput.value);
    markDirty();
    render();
  });

  const setHeaderFont = family => {
    settings.abilityHeaderFontFamily = family;
    if (dom.abilityHeaderFontLabel) dom.abilityHeaderFontLabel.textContent = family;
    loadFont(family, render);
    markDirty();
  };

  const setBodyFont = family => {
    settings.abilityBodyFontFamily = family;
    if (dom.abilityBodyFontLabel) dom.abilityBodyFontLabel.textContent = family;
    loadFont(family, render);
    markDirty();
  };

  dom.abilityHeaderFontWrapper?.addEventListener('click', () =>
    openFontBrowser(dom, { onSelect: setHeaderFont })
  );

  dom.abilityBodyFontWrapper?.addEventListener('click', () =>
    openFontBrowser(dom, { onSelect: setBodyFont })
  );

  dom.abilityHeaderFontSizeInput?.addEventListener('input', () => {
    settings.abilityHeaderFontSize = Number(dom.abilityHeaderFontSizeInput.value);
    markDirty();
    render();
  });

  dom.abilityBodyFontSizeInput?.addEventListener('input', () => {
    settings.abilityBodyFontSize = Number(dom.abilityBodyFontSizeInput.value);
    markDirty();
    render();
  });

  dom.abilityHeaderFontWeightSelect?.addEventListener('change', () => {
    settings.abilityHeaderFontWeight = dom.abilityHeaderFontWeightSelect.value;
    markDirty();
    render();
  });

  dom.abilityBodyFontWeightSelect?.addEventListener('change', () => {
    settings.abilityBodyFontWeight = dom.abilityBodyFontWeightSelect.value;
    markDirty();
    render();
  });

  updateHeightVisibility(dom, settings);
}

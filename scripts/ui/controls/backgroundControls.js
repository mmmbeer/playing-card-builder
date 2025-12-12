import { bindColorPicker } from "./colorPicker.js";

export function initBackgroundControls(dom, settings, render) {
  if (!dom.backgroundStyleSelect) return;

  const syncSecondaryVisibility = () => {
    const needsSecond = settings.backgroundStyle !== 'solid';
    if (dom.backgroundSecondaryGroup) {
      dom.backgroundSecondaryGroup.classList.toggle('hidden', !needsSecond);
    }
  };

  dom.backgroundStyleSelect.addEventListener('change', () => {
    settings.backgroundStyle = dom.backgroundStyleSelect.value;
    syncSecondaryVisibility();
    render();
  });

  bindColorPicker({
    input: dom.backgroundPrimaryInput,
    button: dom.backgroundPrimaryEyedropper,
    onChange: value => {
      settings.backgroundColorPrimary = value;
      render();
    },
    onBeforeSample: render
  });

  bindColorPicker({
    input: dom.backgroundSecondaryInput,
    button: dom.backgroundSecondaryEyedropper,
    onChange: value => {
      settings.backgroundColorSecondary = value;
      render();
    },
    onBeforeSample: render
  });

  syncSecondaryVisibility();
}

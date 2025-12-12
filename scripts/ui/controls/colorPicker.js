import { requestColorSample } from "../colorSampler.js";

function normalizeHex(value) {
  if (!value) return '#000000';
  const hex = value.toString().trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.startsWith('#') ? hex : `#${hex}`;
  }
  if (/^#?[0-9a-fA-F]{3}$/.test(hex)) {
    const raw = hex.replace('#', '');
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  return '#000000';
}

export function bindColorPicker({ input, button, onChange, onBeforeSample }) {
  if (!input || typeof onChange !== 'function') return;

  const applyValue = value => {
    const normalized = normalizeHex(value);
    input.value = normalized;
    onChange(normalized);
  };

  input.addEventListener('input', () => applyValue(input.value));

  if (button) {
    button.addEventListener('click', async () => {
      const result = await requestColorSample({ onBeforeSample });
      if (result) applyValue(result);
    });
  }
}

let canvasRef = null;
let pendingResolve = null;

function getCanvasCoords(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

export function registerSamplingCanvas(canvas) {
  if (canvasRef) {
    canvasRef.removeEventListener('click', handleClick, true);
  }
  canvasRef = canvas;
  if (canvasRef) {
    canvasRef.addEventListener('click', handleClick, true);
  }
}

export function isSamplingActive() {
  return !!pendingResolve;
}

export async function requestColorSample({ onBeforeSample } = {}) {
  if (typeof onBeforeSample === 'function') {
    onBeforeSample();
  }

  if (typeof EyeDropper !== 'undefined') {
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) return normalizeHex(result.sRGBHex);
    } catch (_) {
      // fall back to canvas sampling
    }
  }

  if (!canvasRef) return null;
  canvasRef.classList.add('sampling-cursor');

  return new Promise(resolve => {
    pendingResolve = value => {
      canvasRef.classList.remove('sampling-cursor');
      pendingResolve = null;
      resolve(value);
    };
  });
}

function handleClick(evt) {
  if (!pendingResolve || !canvasRef) return;

  evt.stopPropagation();
  evt.preventDefault();

  const { x, y } = getCanvasCoords(canvasRef, evt);
  const ctx = canvasRef.getContext('2d');
  if (!ctx) return finalize(null);

  const data = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  const hex = normalizeHex(rgbToHex(data[0], data[1], data[2]));
  finalize(hex);
}

function finalize(color) {
  if (pendingResolve) {
    const resolver = pendingResolve;
    pendingResolve = null;
    resolver(color);
  }
  if (canvasRef) {
    canvasRef.classList.remove('sampling-cursor');
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => {
      const clamped = Math.max(0, Math.min(255, v || 0));
      return clamped.toString(16).padStart(2, '0');
    })
    .join('');
}

function normalizeHex(value) {
  if (!value) return value;
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

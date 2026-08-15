import { FONT_OPTIONS } from "./types";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const fontLinks = new Map<string, Promise<void>>();

export function loadImage(src: string) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => {
        imageCache.delete(src);
        reject(new Error(`Image could not be loaded: ${src}`));
      };
      image.src = src;
    }));
  }
  return imageCache.get(src)!;
}

export function rgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const expanded = clean.length === 3 ? clean.split("").map((value) => value + value).join("") : clean;
  const color = Number.parseInt(expanded || "000000", 16);
  return `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},${alpha})`;
}

export async function ensureFontLoaded(family: string, weight = 400) {
  if (typeof document === "undefined") return;
  const font = FONT_OPTIONS.find((item) => item.name === family);
  if (font?.source === "google") {
    if (!fontLinks.has(family)) {
      fontLinks.set(family, new Promise<void>((resolve) => {
        const existing = document.querySelector<HTMLLinkElement>(`link[data-deckforged-font="${CSS.escape(family)}"]`);
        if (existing) { resolve(); return; }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.dataset.deckforgedFont = family;
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
      }));
    }
    await fontLinks.get(family);
  }
  try {
    await document.fonts.load(`${weight} 48px "${family}"`);
  } catch {
    // Canvas keeps rendering with the configured fallback font.
  }
}

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const boundedRadius = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + boundedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, boundedRadius);
  ctx.arcTo(x + width, y + height, x, y + height, boundedRadius);
  ctx.arcTo(x, y + height, x, y, boundedRadius);
  ctx.arcTo(x, y, x + width, y, boundedRadius);
  ctx.closePath();
}

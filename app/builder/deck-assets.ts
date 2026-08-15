import type { DeckSettings, ImageUrls } from "./types";
import { getImage, putImage } from "./storage";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE = /^image\/(png|jpeg|webp)$/;

export function imageValidationError(file: File) {
  if (!SUPPORTED_IMAGE.test(file.type)) return "Choose a PNG, JPG, or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Choose an image smaller than 20 MB.";
  return "";
}

export function collectImageKeys(deck: DeckSettings) {
  return [...new Set([
    ...Object.values(deck.cards).map((card) => card.imageKey),
    deck.customIconKey,
  ].filter(Boolean) as string[])];
}

export function revokeImageUrls(images: ImageUrls) {
  Object.values(images).forEach((url) => URL.revokeObjectURL(url));
}

export async function loadImageUrls(deck: DeckSettings) {
  const images: ImageUrls = {};
  const failed: string[] = [];
  await Promise.all(collectImageKeys(deck).map(async (key) => {
    try {
      const blob = await getImage(key);
      if (blob) images[key] = URL.createObjectURL(blob);
    } catch {
      failed.push(key);
    }
  }));
  return { failed, images };
}

export async function storeImage(file: Blob) {
  const key = crypto.randomUUID();
  try {
    await putImage(key, file);
    return { key, persisted: true, url: URL.createObjectURL(file) };
  } catch {
    return { key, persisted: false, url: URL.createObjectURL(file) };
  }
}

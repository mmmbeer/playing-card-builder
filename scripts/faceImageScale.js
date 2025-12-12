export function computeScaleToSafeHeight(image, safeWidth, safeHeight) {
  const imgWidth = image?.naturalWidth || image?.width || 0;
  const imgHeight = image?.naturalHeight || image?.height || 0;

  if (!imgWidth || !imgHeight || !safeWidth || !safeHeight) return 1;

  const baseScale = Math.min(safeWidth / imgWidth, safeHeight / imgHeight);
  if (!Number.isFinite(baseScale) || baseScale <= 0) return 1;

  const targetScale = safeHeight / imgHeight;
  const normalizedScale = targetScale / baseScale;

  return Number.isFinite(normalizedScale) && normalizedScale > 0
    ? normalizedScale
    : 1;
}


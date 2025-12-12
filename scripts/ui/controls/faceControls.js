import { getSafeHeight, getSafeWidth } from "../../cardGeometry.js";
import { saveImageFromSource } from "../../indexedDB.js";

export function initFaceControls(dom, settings, getCard, sync, render) {
  dom.faceImageLabel.addEventListener("click", () => {
    dom.faceImageInput.click();
  });

  dom.faceImageInput.addEventListener("change", evt => {
    const card = getCard();
    if (!card) return;

    const file = evt.target.files && evt.target.files[0];
    if (!file) return;

    dom.faceImageLabel.textContent = file.name;

    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      if (img.decode) {
        try { await img.decode(); } catch (_) {}
      }

      const imageId = await saveImageFromSource(img, "face", card.faceImageId || null);

      if (card.faceImageUrl && card.faceImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(card.faceImageUrl);
      }

      card.faceImage = img;
      card.faceImageId = imageId;
      card.faceImageUrl = blobUrl;

      card.offsetX = 0;
      card.offsetY = 0;
      card.rotation = 0;
      card.flipH = false;
      card.flipV = false;

      const safeHeight = getSafeHeight();
      const safeWidth = getSafeWidth();
      const baseScale = Math.min(safeWidth / img.width, safeHeight / img.height) || 1;
      card.scale = (safeHeight / img.height) / baseScale;

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("appDirty"));
      });

      sync();
      render();
    };

    img.src = blobUrl;
  });

  dom.faceScaleInput.addEventListener("input", () => {
    const card = getCard();
    if (!card) return;
    card.scale = Number(dom.faceScaleInput.value);
    window.dispatchEvent(new CustomEvent("appDirty"));
    render();
  });

  dom.faceRotationInput.addEventListener("input", () => {
    const card = getCard();
    if (!card) return;
    card.rotation = Number(dom.faceRotationInput.value);
    window.dispatchEvent(new CustomEvent("appDirty"));
    render();
  });

  dom.faceFlipHCheckbox.addEventListener("change", () => {
    const card = getCard();
    if (!card) return;
    card.flipH = dom.faceFlipHCheckbox.checked;
    window.dispatchEvent(new CustomEvent("appDirty"));
    render();
  });

  dom.faceFlipVCheckbox.addEventListener("change", () => {
    const card = getCard();
    if (!card) return;
    card.flipV = dom.faceFlipVCheckbox.checked;
    window.dispatchEvent(new CustomEvent("appDirty"));
    render();
  });

  dom.resetFaceTransformButton.addEventListener("click", () => {
    const card = getCard();
    if (!card) return;
    card.offsetX = 0;
    card.offsetY = 0;
    card.scale = 1;
    card.rotation = 0;
    card.flipH = false;
    card.flipV = false;
    window.dispatchEvent(new CustomEvent("appDirty"));
    sync();
    render();
  });
}

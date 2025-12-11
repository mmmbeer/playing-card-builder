import { SAFE_HEIGHT } from "../../config.js";

async function convertImageToDataURL(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

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

      const dataUrl = await convertImageToDataURL(img);

      card.faceImage = img;
      card.faceImageUrl = dataUrl;

      card.offsetX = 0;
      card.offsetY = 0;
      card.rotation = 0;
      card.flipH = false;
      card.flipV = false;

      card.scale = SAFE_HEIGHT / img.height;

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

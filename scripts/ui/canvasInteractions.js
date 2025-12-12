import { isSamplingActive } from "./colorSampler.js";

// ui/canvasInteractions.js
function getCanvasCoords(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

export function initCanvasDrag(dom, getCard, render) {
  let dragging = false;
  let startX, startY, origX, origY;

  dom.canvas.addEventListener("mousedown", evt => {
    if (isSamplingActive()) return;
    const card = getCard();
    if (!card?.faceImage) return;

    dragging = true;

    const p = getCanvasCoords(dom.canvas, evt);
    startX = p.x;
    startY = p.y;
    origX = card.offsetX;
    origY = card.offsetY;
  });

  window.addEventListener("mousemove", evt => {
    if (!dragging) return;

    const card = getCard();
    const p = getCanvasCoords(dom.canvas, evt);

    card.offsetX = origX + (p.x - startX);
    card.offsetY = origY + (p.y - startY);

    render();
  });

  window.addEventListener("mouseup", () => dragging = false);
  window.addEventListener("mouseleave", () => dragging = false);
}

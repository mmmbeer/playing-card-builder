"use client";

import { useEffect, useRef } from "react";
import type { CardDesign, DeckSettings, SuitId } from "./types";
import { CARD_HEIGHT, CARD_WIDTH, renderCard } from "./render-card";

type Props = {
  deck: DeckSettings;
  suit: SuitId;
  rank: string;
  card: CardDesign;
  imageUrl?: string;
  iconUrl?: string;
  onTransform: (patch: Partial<CardDesign>) => void;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onDelete: () => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
};

type Point = { x: number; y: number };
type Gesture = { center: Point; distance: number; angle: number; x: number; y: number; scale: number; rotation: number };

export default function CardCanvas({ deck, suit, rank, card, imageUrl, iconUrl, onTransform, onTransformStart, onTransformEnd, onDelete, canvasRef }: Props) {
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const cardRef = useRef(card);
  const wheelTimer = useRef<number | null>(null);
  const wheelActive = useRef(false);

  useEffect(() => { cardRef.current = card; }, [card]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) void renderCard(ctx, deck, suit, rank, card, imageUrl, deck.showGuides, iconUrl);
  }, [deck, suit, rank, card, imageUrl, iconUrl, canvasRef]);

  useEffect(() => () => {
    if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
  }, []);

  function values() { return [...pointers.current.values()]; }

  function beginGesture() {
    const points = values();
    const current = cardRef.current;
    if (points.length === 1) {
      gesture.current = { center: points[0], distance: 0, angle: 0, x: current.imageX, y: current.imageY, scale: current.imageScale, rotation: current.imageRotation };
    } else if (points.length >= 2) {
      const [first, second] = points;
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      gesture.current = { center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, distance: Math.hypot(dx, dy), angle: Math.atan2(dy, dx), x: current.imageX, y: current.imageY, scale: current.imageScale, rotation: current.imageRotation };
    } else gesture.current = null;
  }

  function finishPointer(pointerId: number) {
    pointers.current.delete(pointerId);
    if (!pointers.current.size) { gesture.current = null; onTransformEnd(); }
    else beginGesture();
  }

  return <canvas
    ref={canvasRef}
    className={imageUrl ? "card-canvas is-draggable" : "card-canvas"}
    width={CARD_WIDTH}
    height={CARD_HEIGHT}
    aria-label={`Preview of ${rank.startsWith("__JOKER_") ? "joker" : `${rank} of ${suit}`}. ${imageUrl ? "Drag artwork to move. Use wheel or pinch to zoom." : "No face artwork is placed."}`}
    tabIndex={0}
    onPointerDown={(event) => {
      if (!imageUrl) return;
      event.preventDefault();
      if (!pointers.current.size) onTransformStart();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      beginGesture();
    }}
    onPointerMove={(event) => {
      if (!imageUrl || !pointers.current.has(event.pointerId) || !gesture.current) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = values();
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = CARD_WIDTH / rect.width;
      const start = gesture.current;
      if (points.length === 1) {
        onTransform({ imageX: start.x + (points[0].x - start.center.x) * ratio, imageY: start.y + (points[0].y - start.center.y) * ratio });
      } else {
        const [first, second] = points;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
        onTransform({
          imageX: start.x + (center.x - start.center.x) * ratio,
          imageY: start.y + (center.y - start.center.y) * ratio,
          imageScale: Math.min(4, Math.max(.2, start.scale * Math.hypot(dx, dy) / Math.max(1, start.distance))),
          imageRotation: start.rotation + (Math.atan2(dy, dx) - start.angle) * 180 / Math.PI,
        });
      }
    }}
    onPointerUp={(event) => finishPointer(event.pointerId)}
    onPointerCancel={(event) => finishPointer(event.pointerId)}
    onWheel={(event) => {
      if (!imageUrl) return;
      event.preventDefault();
      if (!wheelActive.current) { wheelActive.current = true; onTransformStart(); }
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      onTransform({ imageScale: Math.min(4, Math.max(.2, card.imageScale * (1 - event.deltaY * .0015))) });
      wheelTimer.current = window.setTimeout(() => { wheelActive.current = false; onTransformEnd(); }, 180);
    }}
    onDoubleClick={() => {
      if (!imageUrl) return;
      onTransformStart();
      onTransform({ imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0 });
      onTransformEnd();
    }}
    onKeyDown={(event) => {
      if (!imageUrl) return;
      const step = event.shiftKey ? 10 : 2;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        onTransformStart();
        onTransform({ imageX: card.imageX + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0), imageY: card.imageY + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0) });
        onTransformEnd();
      } else if (["+", "=", "-", "_"].includes(event.key)) {
        event.preventDefault();
        onTransformStart();
        onTransform({ imageScale: Math.min(4, Math.max(.2, card.imageScale + (event.key === "-" || event.key === "_" ? -.05 : .05))) });
        onTransformEnd();
      } else if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        onTransformStart();
        onTransform({ imageRotation: card.imageRotation + (event.key === "[" ? -1 : 1) * (event.shiftKey ? 15 : 2) });
        onTransformEnd();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onDelete();
      } else if (event.key === "0") {
        event.preventDefault();
        onTransformStart();
        onTransform({ imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0 });
        onTransformEnd();
      }
    }}
  />;
}

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
  viewZoom: number;
  onViewZoom: (zoom: number) => void;
  onFitView: () => void;
  onPrintView: () => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
};

type Point = { x: number; y: number };
type Gesture = { center: Point; distance: number; x: number; y: number; scale: number; viewZoom: number };

export default function CardCanvas({ deck, suit, rank, card, imageUrl, iconUrl, onTransform, onTransformStart, onTransformEnd, onDelete, viewZoom, onViewZoom, onFitView, onPrintView, canvasRef }: Props) {
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const cardRef = useRef(card);
  const transforming = useRef(false);

  useEffect(() => { cardRef.current = card; }, [card]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) void renderCard(ctx, deck, suit, rank, card, imageUrl, deck.showGuides, iconUrl);
  }, [deck, suit, rank, card, imageUrl, iconUrl, canvasRef]);

  function values() { return [...pointers.current.values()]; }

  function beginGesture() {
    const points = values();
    const current = cardRef.current;
    if (points.length === 1) {
      gesture.current = { center: points[0], distance: 0, x: current.imageX, y: current.imageY, scale: current.imageScale, viewZoom };
    } else if (points.length >= 2) {
      const [first, second] = points;
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      gesture.current = { center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }, distance: Math.hypot(dx, dy), x: current.imageX, y: current.imageY, scale: current.imageScale, viewZoom };
    } else gesture.current = null;
  }

  function finishPointer(pointerId: number) {
    pointers.current.delete(pointerId);
    if (!pointers.current.size) {
      gesture.current = null;
      if (transforming.current) onTransformEnd();
      transforming.current = false;
    } else {
      if (imageUrl && pointers.current.size === 1 && !transforming.current) {
        onTransformStart();
        transforming.current = true;
      }
      beginGesture();
    }
  }

  return <canvas
    ref={canvasRef}
    className={imageUrl ? "card-canvas zoom-controlled is-draggable" : "card-canvas zoom-controlled"}
    width={CARD_WIDTH}
    height={CARD_HEIGHT}
    style={{ width: CARD_WIDTH * viewZoom, height: CARD_HEIGHT * viewZoom }}
    aria-label={`Preview of ${rank.startsWith("__JOKER_") ? "joker" : `${rank} of ${suit}`}. ${imageUrl ? "Drag artwork with one pointer." : "No face artwork is placed."} Use the wheel, plus and minus keys, or a two-finger pinch to zoom the canvas.`}
    tabIndex={0}
    onPointerDown={(event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 1 && imageUrl) {
        onTransformStart();
        transforming.current = true;
      } else if (pointers.current.size >= 2 && transforming.current) {
        onTransformEnd();
        transforming.current = false;
      }
      beginGesture();
    }}
    onPointerMove={(event) => {
      if (!pointers.current.has(event.pointerId) || !gesture.current) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = values();
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = CARD_WIDTH / rect.width;
      const start = gesture.current;
      if (points.length === 1 && imageUrl && transforming.current) {
        onTransform({ imageX: start.x + (points[0].x - start.center.x) * ratio, imageY: start.y + (points[0].y - start.center.y) * ratio });
      } else if (points.length >= 2) {
        const [first, second] = points;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        onViewZoom(Math.min(2.5, Math.max(.1, start.viewZoom * Math.hypot(dx, dy) / Math.max(1, start.distance))));
      }
    }}
    onPointerUp={(event) => finishPointer(event.pointerId)}
    onPointerCancel={(event) => finishPointer(event.pointerId)}
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
      } else if (["+", "=", "-", "_"].includes(event.key) && event.altKey) {
        event.preventDefault();
        onTransformStart();
        onTransform({ imageScale: Math.min(4, Math.max(.2, card.imageScale + (event.key === "-" || event.key === "_" ? -.05 : .05))) });
        onTransformEnd();
      } else if (["+", "=", "-", "_"].includes(event.key)) {
        event.preventDefault();
        onViewZoom(viewZoom * (event.key === "-" || event.key === "_" ? .88 : 1.14));
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
        onFitView();
      } else if (event.key === "1") {
        event.preventDefault();
        onPrintView();
      }
    }}
  />;
}

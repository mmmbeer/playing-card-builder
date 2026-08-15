"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { CARD_HEIGHT, CARD_WIDTH } from "./render-card";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;

export function clampCanvasZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function useCanvasZoom(viewportRef: RefObject<HTMLDivElement | null>) {
  const [zoom, setZoom] = useState(0.5);
  const [mode, setMode] = useState<"fit" | "custom">("fit");

  const calculateFit = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return 0.5;
    return clampCanvasZoom(Math.min((viewport.clientWidth - 56) / CARD_WIDTH, (viewport.clientHeight - 56) / CARD_HEIGHT));
  }, [viewportRef]);

  const fit = useCallback(() => {
    setMode("fit");
    setZoom(calculateFit());
  }, [calculateFit]);

  const printSize = useCallback(() => {
    setMode("custom");
    setZoom(1);
  }, []);

  const change = useCallback((value: number, anchor?: { clientX: number; clientY: number }) => {
    const next = clampCanvasZoom(value);
    const viewport = viewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    const localX = rect && anchor ? anchor.clientX - rect.left : 0;
    const localY = rect && anchor ? anchor.clientY - rect.top : 0;
    const contentX = viewport ? viewport.scrollLeft + localX : 0;
    const contentY = viewport ? viewport.scrollTop + localY : 0;
    setMode("custom");
    setZoom((previous) => {
      if (viewport && anchor && previous > 0) {
        window.requestAnimationFrame(() => {
          const ratio = next / previous;
          viewport.scrollLeft = contentX * ratio - localX;
          viewport.scrollTop = contentY * ratio - localY;
        });
      }
      return next;
    });
  }, [viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      if (mode === "fit") setZoom(calculateFit());
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [calculateFit, mode, viewportRef]);

  return { change, fit, mode, printSize, zoom };
}

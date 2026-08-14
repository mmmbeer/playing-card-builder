type EyeDropperResult = { sRGBHex?: string };
type EyeDropperConstructor = new () => { open: () => Promise<EyeDropperResult> };

export async function sampleCanvasColor(canvas: HTMLCanvasElement | null): Promise<string | null> {
  const EyeDropperApi = (window as typeof window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
  if (EyeDropperApi) {
    try {
      const result = await new EyeDropperApi().open();
      if (result.sRGBHex) return normalizeHex(result.sRGBHex);
    } catch {
      // The card-canvas sampler below also works on browsers without EyeDropper.
    }
  }
  if (!canvas) return null;

  canvas.classList.add("sampling-cursor");
  return new Promise((resolve) => {
    const finish = (color: string | null) => {
      canvas.classList.remove("sampling-cursor");
      canvas.removeEventListener("pointerdown", handlePointer, true);
      window.removeEventListener("keydown", handleKey, true);
      resolve(color);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); finish(null); }
    };
    const handlePointer = (event: PointerEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(canvas.width - 1, Math.round((event.clientX - rect.left) * canvas.width / rect.width)));
      const y = Math.max(0, Math.min(canvas.height - 1, Math.round((event.clientY - rect.top) * canvas.height / rect.height)));
      const data = canvas.getContext("2d")?.getImageData(x, y, 1, 1).data;
      finish(data ? rgbToHex(data[0], data[1], data[2]) : null);
    };
    canvas.addEventListener("pointerdown", handlePointer, true);
    window.addEventListener("keydown", handleKey, true);
  });
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
}

function normalizeHex(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`;
  if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.split("").map((character) => character.repeat(2)).join("")}`;
  return null;
}

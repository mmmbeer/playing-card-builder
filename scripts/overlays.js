// overlays.js
import {
  getSettings,
  pipGuidelineYs
} from './state.js'

export function renderOverlays(ctx, { cardWidth, cardHeight, bleed, safeWidth, safeHeight }) {
  const s = getSettings()
  if (!s.showGuidelines) return

  ctx.save()

  //
  // ---------------------------------------------------------
  // REAL TECHNICAL SAFE ZONE (BLEED-BASED)
  // Editor-only. Never saved.
  // ---------------------------------------------------------
  ctx.setLineDash([10, 8])
  ctx.strokeStyle = 'rgba(148,163,184,0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(bleed, bleed, safeWidth, safeHeight)



  //
  // ---------------------------------------------------------
  // OPTIONAL DESIGNER INSET GUIDE
  // Only drawn when safeZoneInset is set.
  // ---------------------------------------------------------
  if (s.safeZoneInset != null) {
    const inset = s.safeZoneInset
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      inset,
      inset,
      cardWidth - inset * 2,
      cardHeight - inset * 2
    )
  }



  //
  // ---------------------------------------------------------
  // PIP PLACEMENT GUIDELINES (horizontal alignment lines)
  // From computePipGuidelines → state.pipGuidelineYs
  // ---------------------------------------------------------
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(80,80,80,0.3)'
  ctx.lineWidth = 1
  ctx.font = "14px sans-serif"
  ctx.fillStyle = "rgba(0,0,0,0.45)"
  ctx.textBaseline = "middle"

  pipGuidelineYs.forEach((y, i) => {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(cardWidth, y)
    ctx.stroke()

    // Label next to the guide
    ctx.fillText(`Y${i + 1}: ${Math.round(y)}`, 8, y)
  })

  ctx.restore()
}

"use client";

import { useState } from "react";
import { Images, Pipette, RotateCcw, Trash2, Upload, X } from "lucide-react";
import type { CardDesign, ColorMode, DeckSettings, EffectMode, OutlinePosition, SuitId } from "./types";
import { deckCardCount, FONT_OPTIONS, ICON_PRESETS, rankCopyCount, SUITS } from "./types";

export type PanelId = "cards" | "art" | "type" | "icons" | "pips" | "text" | "layout" | "deck";

type Props = {
  panel: PanelId;
  deck: DeckSettings;
  suit: SuitId;
  rank: string;
  copy: number;
  card: CardDesign;
  imageUrl?: string;
  onClose: () => void;
  onDeck: (patch: Partial<DeckSettings>) => void;
  onCard: (patch: Partial<CardDesign>) => void;
  onSelect: (suit: SuitId, rank: string, copy?: number) => void;
  onImage: (file: File) => void;
  onRemoveImage: () => void;
  onRanks: (value: string) => void;
  onBulk: () => void;
  onCustomIcon: (file: File) => void;
  onRemoveCustomIcon: () => void;
  onSampleColor: () => Promise<string | null>;
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="builder-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Switch({ title, copy, checked, onChange }: { title: string; copy?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="switch-line"><span><strong>{title}</strong>{copy && <small>{copy}</small>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function FontField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const active = FONT_OPTIONS.find((font) => font.name === value);
  const listId = `font-options-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return <Field label={label} hint={`${active?.category || "Custom font"}${active?.source === "google" ? " · loaded from Google Fonts" : " · device font"}`}>
    <input list={listId} value={value} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: value }} autoComplete="off" />
    <datalist id={listId}>{FONT_OPTIONS.map((font) => <option key={font.name} value={font.name}>{font.category}</option>)}</datalist>
  </Field>;
}

function Slider({ label, value, min, max, step = 1, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void }) {
  return <Field label={`${label} · ${Number.isInteger(value) ? value : value.toFixed(2)}${suffix}`}><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></Field>;
}

function ColorInput({ value, onChange, onSample }: { value: string; onChange: (value: string) => void; onSample: () => Promise<string | null> }) {
  return <div className="color-control"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><button type="button" onClick={async () => { const sampled = await onSample(); if (sampled) onChange(sampled); }} aria-label="Sample color from the card"><Pipette /></button></div>;
}

function ColorModeFields({ deck, mode, single, onDeck, prefix, onSample }: { deck: DeckSettings; mode: ColorMode | "original"; single: string; onDeck: (patch: Partial<DeckSettings>) => void; prefix: "rank" | "icon"; onSample: () => Promise<string | null> }) {
  return <>
    <Field label="Color mode"><select value={mode} onChange={(event) => onDeck({ [`${prefix}ColorMode`]: event.target.value } as Partial<DeckSettings>)}>
      {prefix === "icon" && <option value="original">Original artwork</option>}
      <option value="single">Single color</option><option value="black-red">Black / red</option><option value="per-suit">Per suit</option>
    </select></Field>
    {mode === "single" && <Field label="Color"><ColorInput value={single} onChange={(value) => onDeck({ [`${prefix}Color`]: value } as Partial<DeckSettings>)} onSample={onSample} /></Field>}
    {mode === "black-red" && <div className="split-fields"><Field label="Black suits"><ColorInput value={deck.blackColor} onChange={(value) => onDeck({ blackColor: value })} onSample={onSample} /></Field><Field label="Red suits"><ColorInput value={deck.redColor} onChange={(value) => onDeck({ redColor: value })} onSample={onSample} /></Field></div>}
    {mode === "per-suit" && <div className="color-grid">{SUITS.map((item) => <Field key={item.id} label={item.name}><ColorInput value={deck.suitColors[item.id]} onChange={(value) => onDeck({ suitColors: { ...deck.suitColors, [item.id]: value } })} onSample={onSample} /></Field>)}</div>}
  </>;
}

function EffectFields({ mode, color, opacity, blur, shadowX, shadowY, onChange, onSample }: { mode: EffectMode; color: string; opacity: number; blur: number; shadowX: number; shadowY: number; onChange: (patch: { mode?: EffectMode; color?: string; opacity?: number; blur?: number; shadowX?: number; shadowY?: number }) => void; onSample: () => Promise<string | null> }) {
  return <>
    <Field label="Effect"><select value={mode} onChange={(event) => onChange({ mode: event.target.value as EffectMode })}><option value="none">None</option><option value="shadow">Drop shadow</option><option value="glow">Glow</option></select></Field>
    {mode !== "none" && <>
      <div className="split-fields"><Field label="Effect color"><ColorInput value={color} onChange={(value) => onChange({ color: value })} onSample={onSample} /></Field><Slider label="Opacity" value={opacity} min={0} max={1} step={.05} onChange={(value) => onChange({ opacity: value })} /></div>
      <Slider label="Blur" value={blur} min={0} max={40} onChange={(value) => onChange({ blur: value })} />
      {mode === "shadow" && <div className="split-fields"><Field label="Shadow X"><input type="number" min="-30" max="30" value={shadowX} onChange={(event) => onChange({ shadowX: Number(event.target.value) })} /></Field><Field label="Shadow Y"><input type="number" min="-30" max="30" value={shadowY} onChange={(event) => onChange({ shadowY: Number(event.target.value) })} /></Field></div>}
    </>}
  </>;
}

function OutlineFields({ enabled, width, color, position, onChange, onSample }: { enabled: boolean; width: number; color: string; position: OutlinePosition; onChange: (patch: { enabled?: boolean; width?: number; color?: string; position?: OutlinePosition }) => void; onSample: () => Promise<string | null> }) {
  return <>
    <Switch title="Outline / border" checked={enabled} onChange={(value) => onChange({ enabled: value })} />
    {enabled && <><div className="split-fields"><Field label="Outline color"><ColorInput value={color} onChange={(value) => onChange({ color: value })} onSample={onSample} /></Field><Field label="Width"><input type="number" min="1" max="16" value={width} onChange={(event) => onChange({ width: Number(event.target.value) })} /></Field></div><Field label="Placement"><select value={position} onChange={(event) => onChange({ position: event.target.value as OutlinePosition })}><option value="inside">Inside</option><option value="center">Centered</option><option value="outside">Outside</option></select></Field></>}
  </>;
}

function RankEditor({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);

  function commitDraft() {
    if (!dirty || !draft.split(",").some((item) => item.trim())) return;
    onCommit(draft);
    setDirty(false);
  }

  return <>
    <Field label="Ranks and copies" hint="Repeat a rank to add distinct card copies. Changes apply when you leave the field or press Ctrl/⌘ + Enter.">
      <textarea
        rows={6}
        value={draft}
        onChange={(event) => { setDraft(event.target.value); setDirty(true); }}
        onBlur={commitDraft}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            commitDraft();
          }
        }}
      />
    </Field>
    <div className="rank-draft-status" aria-live="polite">
      <span>{dirty ? "Unapplied rank changes" : "Ranks are up to date"}</span>
      <button type="button" disabled={!dirty} onMouseDown={(event) => event.preventDefault()} onClick={commitDraft}>Apply ranks</button>
    </div>
  </>;
}

const titles: Record<PanelId, { title: string; copy: string }> = {
  cards: { title: "Cards", copy: "Select every suit, rank, and copy in the deck." },
  art: { title: "Artwork", copy: "Fit and position this card’s face artwork." },
  type: { title: "Typography", copy: "Style ranks and corner indexes." },
  icons: { title: "Suit icons", copy: "Choose and style a complete suit library." },
  pips: { title: "Pip layout", copy: "Set patterns, sizing, and exact anchors." },
  text: { title: "Card text", copy: "Format rules, captions, and abilities." },
  layout: { title: "Layout & guides", copy: "Control surfaces, edges, spacing, and guides." },
  deck: { title: "Deck setup", copy: "Define ranks, copies, and jokers." },
};

export default function ToolPanel(props: Props) {
  const { panel, deck, suit, rank, copy, card, imageUrl, onClose, onDeck, onCard, onSelect, onImage, onRemoveImage, onRanks, onBulk, onCustomIcon, onRemoveCustomIcon, onSampleColor } = props;
  const meta = titles[panel];
  const copies = rankCopyCount(deck, rank);
  const rankList = deck.ranks.flatMap((item) => Array.from({ length: rankCopyCount(deck, item) }, () => item)).join(", ");

  return <aside className="tool-popover" role="dialog" aria-modal="false" aria-labelledby="tool-panel-title">
    <header><div><span className="panel-kicker">Editor</span><h2 id="tool-panel-title">{meta.title}</h2><p>{meta.copy}</p></div><button className="icon-control" onClick={onClose} aria-label="Close editor"><X /></button></header>

    {panel === "cards" && <div className="panel-body">
      <div className="suit-tabs" role="tablist" aria-label="Suits">{SUITS.map((item) => <button key={item.id} className={suit === item.id ? "active" : ""} onClick={() => onSelect(item.id, rank, copy)} role="tab" aria-selected={suit === item.id}><span className={item.red ? "red-suit" : ""}>{item.symbol}</span>{item.name}</button>)}</div>
      <div className="rank-grid" aria-label="Ranks">{deck.ranks.map((item) => <button key={item} className={rank === item ? "active" : ""} onClick={() => onSelect(suit, item, 1)}>{item}{rankCopyCount(deck, item) > 1 && <small>×{rankCopyCount(deck, item)}</small>}</button>)}</div>
      {deck.includeJokers && <div className="joker-grid" aria-label="Jokers">{Array.from({ length: deck.jokerCount }, (_, index) => <button key={index} className={rank === `__JOKER_${index + 1}__` ? "active" : ""} onClick={() => onSelect("spades", `__JOKER_${index + 1}__`, 1)}>★ Joker {index + 1}</button>)}</div>}
      {copies > 1 && <Field label="Card copy"><div className="copy-grid">{Array.from({ length: copies }, (_, index) => <button key={index} className={copy === index + 1 ? "active" : ""} onClick={() => onSelect(suit, rank, index + 1)}>Copy {index + 1}</button>)}</div></Field>}
      <button className="panel-button panel-button-primary" onClick={onBulk}><Images />Bulk add artwork</button>
      <div className="panel-note"><strong>{deckCardCount(deck)} cards</strong><span>{Object.values(deck.cards).filter((item) => item.imageKey).length} with artwork</span></div>
    </div>}

    {panel === "art" && <div className="panel-body">
      <label className="art-drop"><Upload /><strong>{imageUrl ? "Replace artwork" : "Add artwork"}</strong><span>PNG, JPG, or WebP up to 20 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImage(file); event.currentTarget.value = ""; }} /></label>
      <p className="interaction-hint">Drag artwork to move · wheel or pinch to zoom the canvas · Alt +/− scales artwork · [ ] rotates · arrows nudge · Delete removes</p>
      {imageUrl && <>
        <Field label="Fit mode"><div className="segmented"><button className={card.imageFit === "cover" ? "active" : ""} onClick={() => onCard({ imageFit: "cover", imageScale: 1, imageX: 0, imageY: 0 })}>Cover</button><button className={card.imageFit === "contain" ? "active" : ""} onClick={() => onCard({ imageFit: "contain", imageScale: 1, imageX: 0, imageY: 0 })}>Contain</button><button className={card.imageFit === "stretch" ? "active" : ""} onClick={() => onCard({ imageFit: "stretch", imageScale: 1, imageX: 0, imageY: 0 })}>Stretch</button></div></Field>
        <Slider label="Zoom" suffix="×" value={card.imageScale} min={.2} max={4} step={.02} onChange={(value) => onCard({ imageScale: value })} />
        <Slider label="Opacity" suffix="%" value={Math.round(card.imageOpacity * 100)} min={5} max={100} onChange={(value) => onCard({ imageOpacity: value / 100 })} />
        <Field label="Blend mode"><select value={card.imageBlendMode} onChange={(event) => onCard({ imageBlendMode: event.target.value as GlobalCompositeOperation })}><option value="source-over">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option><option value="darken">Darken</option><option value="lighten">Lighten</option><option value="luminosity">Luminosity</option></select></Field>
        <Field label="Rotation"><div className="input-with-unit"><input type="number" min="-180" max="180" value={Math.round(card.imageRotation)} onChange={(event) => onCard({ imageRotation: Number(event.target.value) })} /><span>°</span></div></Field>
        <div className="toggle-row"><label><input type="checkbox" checked={card.flipX} onChange={(event) => onCard({ flipX: event.target.checked })} /> Flip horizontally</label><label><input type="checkbox" checked={card.flipY} onChange={(event) => onCard({ flipY: event.target.checked })} /> Flip vertically</label></div>
        <button className="panel-button" onClick={() => onCard({ imageScale: 1, imageRotation: 0, imageX: 0, imageY: 0, imageOpacity: 1, imageBlendMode: "source-over", flipX: false, flipY: false })}><RotateCcw />Reset transform</button>
        <button className="panel-button danger-text" onClick={onRemoveImage}><Trash2 />Remove artwork</button>
      </>}
    </div>}

    {panel === "type" && <div className="panel-body">
      <FontField label="Rank / index font" value={deck.rankFont} onChange={(value) => onDeck({ rankFont: value })} />
      <div className="split-fields"><Field label="Size"><input type="number" min="28" max="180" value={deck.rankSize} onChange={(event) => onDeck({ rankSize: Number(event.target.value) })} /></Field><Field label="Weight"><select value={deck.rankWeight} onChange={(event) => onDeck({ rankWeight: Number(event.target.value) })}>{[300, 400, 500, 600, 700, 800, 900].map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></Field></div>
      <ColorModeFields deck={deck} mode={deck.rankColorMode} single={deck.rankColor} onDeck={onDeck} prefix="rank" onSample={onSampleColor} />
      <Slider label="Opacity" suffix="%" value={Math.round(deck.rankOpacity * 100)} min={5} max={100} onChange={(value) => onDeck({ rankOpacity: value / 100 })} />
      <details className="control-group" open><summary>Effects and outline</summary><EffectFields mode={deck.rankEffect} color={deck.rankEffectColor} opacity={deck.rankEffectOpacity} blur={deck.rankEffectBlur} shadowX={deck.rankShadowX} shadowY={deck.rankShadowY} onChange={(patch) => onDeck({ rankEffect: patch.mode ?? deck.rankEffect, rankEffectColor: patch.color ?? deck.rankEffectColor, rankEffectOpacity: patch.opacity ?? deck.rankEffectOpacity, rankEffectBlur: patch.blur ?? deck.rankEffectBlur, rankShadowX: patch.shadowX ?? deck.rankShadowX, rankShadowY: patch.shadowY ?? deck.rankShadowY })} onSample={onSampleColor} /><OutlineFields enabled={deck.rankOutline} width={deck.rankOutlineWidth} color={deck.rankOutlineColor} position={deck.rankOutlinePosition} onChange={(patch) => onDeck({ rankOutline: patch.enabled ?? deck.rankOutline, rankOutlineWidth: patch.width ?? deck.rankOutlineWidth, rankOutlineColor: patch.color ?? deck.rankOutlineColor, rankOutlinePosition: patch.position ?? deck.rankOutlinePosition })} onSample={onSampleColor} /></details>
      <Field label="Corner arrangement"><div className="segmented"><button className={deck.cornerOrder === "rank-first" ? "active" : ""} onClick={() => onDeck({ cornerOrder: "rank-first" })}>Rank / suit</button><button className={deck.cornerOrder === "suit-first" ? "active" : ""} onClick={() => onDeck({ cornerOrder: "suit-first" })}>Suit / rank</button><button className={deck.cornerOrder === "inline" ? "active" : ""} onClick={() => onDeck({ cornerOrder: "inline" })}>Inline</button></div></Field>
      <Switch title="Mirror this card’s lower corner" copy="Overrides the deck default for the selected card only." checked={card.mirrorCorners ?? deck.mirrorCorners} onChange={(value) => onCard({ mirrorCorners: value })} />
      {card.mirrorCorners !== undefined && <button className="panel-button" onClick={() => onCard({ mirrorCorners: undefined })}><RotateCcw />Use deck mirror default</button>}
    </div>}

    {panel === "icons" && <div className="panel-body">
      <Field label="Built-in suit set"><select value={deck.customIconKey ? "custom" : deck.iconPreset} onChange={(event) => onDeck({ iconPreset: event.target.value, customIconKey: undefined })}>{deck.customIconKey && <option value="custom">Custom suit sheet</option>}{ICON_PRESETS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field>
      <div className="preset-preview" aria-hidden="true">{deck.iconPreset === "unicode" || deck.iconPreset === "custom" ? <div className="suit-preview">{SUITS.map((item) => <span key={item.id}>{item.symbol}</span>)}</div> : <img src={`/suits/${deck.iconPreset}.png`} alt="" />}</div>
      <label className="panel-button custom-icon-upload"><Upload />Upload 2 × 2 suit sheet<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) onCustomIcon(file); event.currentTarget.value = ""; }} /></label>
      {deck.customIconKey && <button className="panel-button danger-text" onClick={onRemoveCustomIcon}><Trash2 />Remove custom sheet</button>}
      <ColorModeFields deck={deck} mode={deck.iconColorMode} single={deck.iconColor} onDeck={onDeck} prefix="icon" onSample={onSampleColor} />
      <Slider label="Icon scale" suffix="%" value={Math.round(deck.iconScale * 100)} min={35} max={220} onChange={(value) => onDeck({ iconScale: value / 100 })} />
      <Slider label="Opacity" suffix="%" value={Math.round(deck.iconOpacity * 100)} min={5} max={100} onChange={(value) => onDeck({ iconOpacity: value / 100 })} />
      <details className="control-group" open><summary>Effects and outline</summary><EffectFields mode={deck.iconEffect} color={deck.iconEffectColor} opacity={deck.iconEffectOpacity} blur={deck.iconEffectBlur} shadowX={deck.iconShadowX} shadowY={deck.iconShadowY} onChange={(patch) => onDeck({ iconEffect: patch.mode ?? deck.iconEffect, iconEffectColor: patch.color ?? deck.iconEffectColor, iconEffectOpacity: patch.opacity ?? deck.iconEffectOpacity, iconEffectBlur: patch.blur ?? deck.iconEffectBlur, iconShadowX: patch.shadowX ?? deck.iconShadowX, iconShadowY: patch.shadowY ?? deck.iconShadowY })} onSample={onSampleColor} /><OutlineFields enabled={deck.iconOutline} width={deck.iconOutlineWidth} color={deck.iconOutlineColor} position={deck.iconOutlinePosition} onChange={(patch) => onDeck({ iconOutline: patch.enabled ?? deck.iconOutline, iconOutlineWidth: patch.width ?? deck.iconOutlineWidth, iconOutlineColor: patch.color ?? deck.iconOutlineColor, iconOutlinePosition: patch.position ?? deck.iconOutlinePosition })} onSample={onSampleColor} /></details>
    </div>}

    {panel === "pips" && <div className="panel-body">
      <Switch title="Show center pips" checked={deck.showPips} onChange={(value) => onDeck({ showPips: value })} />
      <Switch title="Pips over artwork" copy="Keep numeric pips visible when face artwork is present." checked={deck.pipsOverArtwork} onChange={(value) => onDeck({ pipsOverArtwork: value })} />
      {Number.isFinite(Number.parseInt(rank, 10)) && <div className="panel-note"><strong>{Number.parseInt(rank, 10)}-pip pattern</strong><span>{Number.parseInt(rank, 10) > 10 ? "Generated across 3–5 columns" : "Traditional layout"}</span></div>}
      <Slider label="Pip scale" suffix="%" value={Math.round(deck.pipScale * 100)} min={35} max={180} onChange={(value) => onDeck({ pipScale: value / 100 })} />
      <Slider label="Ace scale" suffix="%" value={Math.round(deck.aceScale * 100)} min={50} max={240} onChange={(value) => onDeck({ aceScale: value / 100 })} />
      <h3 className="panel-subheading">Vertical row anchors</h3>
      {[["Top", "pipTop"], ["Inner top", "pipInnerTop"], ["Center", "pipCenter"], ["Inner bottom", "pipInnerBottom"], ["Bottom", "pipBottom"]].map(([label, key]) => <Slider key={key} label={label} value={deck[key as keyof DeckSettings] as number} min={.1} max={.9} step={.01} onChange={(value) => onDeck({ [key]: value } as Partial<DeckSettings>)} />)}
      <h3 className="panel-subheading">Horizontal anchors</h3>
      {[["Left", "pipLeft"], ["Center", "pipCenterX"], ["Right", "pipRight"]].map(([label, key]) => <Slider key={key} label={label} value={deck[key as keyof DeckSettings] as number} min={.15} max={.85} step={.01} onChange={(value) => onDeck({ [key]: value } as Partial<DeckSettings>)} />)}
    </div>}

    {panel === "text" && <div className="panel-body">
      <Field label="Card text" hint="Use # Heading, - bullets, and ::suit::, ::heart::, ::spade::, ::club::, or ::diamond:: tags."><textarea rows={8} maxLength={1600} value={card.note} onChange={(event) => onCard({ note: event.target.value })} placeholder="# Ability name&#10;Draw two cards.&#10;- Discard one card.&#10;- Gain ::suit:: power." /></Field>
      <div className="split-fields"><FontField label="Heading font" value={deck.textHeaderFont} onChange={(value) => onDeck({ textHeaderFont: value })} /><FontField label="Body font" value={deck.textBodyFont} onChange={(value) => onDeck({ textBodyFont: value })} /></div>
      <div className="four-fields"><Field label="Heading size"><input type="number" min="12" max="82" value={deck.textHeaderSize} onChange={(event) => onDeck({ textHeaderSize: Number(event.target.value) })} /></Field><Field label="Heading weight"><select value={deck.textHeaderWeight} onChange={(event) => onDeck({ textHeaderWeight: Number(event.target.value) })}>{[300, 400, 500, 600, 700, 800, 900].map((weight) => <option key={weight}>{weight}</option>)}</select></Field><Field label="Body size"><input type="number" min="10" max="64" value={deck.textBodySize} onChange={(event) => onDeck({ textBodySize: Number(event.target.value) })} /></Field><Field label="Body weight"><select value={deck.textBodyWeight} onChange={(event) => onDeck({ textBodyWeight: Number(event.target.value) })}>{[300, 400, 500, 600, 700, 800, 900].map((weight) => <option key={weight}>{weight}</option>)}</select></Field></div>
      <Field label="Alignment"><div className="segmented">{(["left", "center", "right"] as const).map((value) => <button key={value} className={deck.textAlign === value ? "active" : ""} onClick={() => onDeck({ textAlign: value })}>{value}</button>)}</div></Field>
      <Slider label="Panel width" suffix="%" value={deck.textWidth} min={35} max={96} onChange={(value) => onDeck({ textWidth: value })} />
      <Field label="Panel height"><div className="segmented"><button className={deck.textHeightMode === "auto" ? "active" : ""} onClick={() => onDeck({ textHeightMode: "auto" })}>Automatic</button><button className={deck.textHeightMode === "fixed" ? "active" : ""} onClick={() => onDeck({ textHeightMode: "fixed" })}>Fixed</button></div></Field>
      {deck.textHeightMode === "fixed" && <><Slider label="Fixed height" suffix="px" value={deck.textFixedHeight} min={70} max={420} onChange={(value) => onDeck({ textFixedHeight: value })} /><Field label="Overflow"><select value={deck.textOverflow} onChange={(event) => onDeck({ textOverflow: event.target.value as DeckSettings["textOverflow"] })}><option value="shrink">Shrink to fit</option><option value="clip">Clip overflow</option></select></Field></>}
      <div className="split-fields"><Field label="Text color"><ColorInput value={deck.textColor} onChange={(value) => onDeck({ textColor: value })} onSample={onSampleColor} /></Field><Field label="Panel color"><ColorInput value={deck.textBackground} onChange={(value) => onDeck({ textBackground: value })} onSample={onSampleColor} /></Field></div>
      <Slider label="Panel opacity" suffix="%" value={Math.round(deck.textBackgroundOpacity * 100)} min={0} max={100} onChange={(value) => onDeck({ textBackgroundOpacity: value / 100 })} />
      <Field label="Placement"><div className="segmented"><button className={deck.textPlacement === "top" ? "active" : ""} onClick={() => onDeck({ textPlacement: "top" })}>Top</button><button className={deck.textPlacement === "bottom" ? "active" : ""} onClick={() => onDeck({ textPlacement: "bottom" })}>Bottom</button></div></Field>
      <Switch title="Mirror text panel" checked={deck.textMirror} onChange={(value) => onDeck({ textMirror: value })} />
    </div>}

    {panel === "layout" && <div className="panel-body">
      <Field label="Card surface"><select value={deck.backgroundStyle} onChange={(event) => onDeck({ backgroundStyle: event.target.value as DeckSettings["backgroundStyle"] })}><option value="solid">Solid color</option><option value="horizontal">Horizontal gradient</option><option value="vertical">Vertical gradient</option><option value="diagonal-down">Diagonal gradient ↘</option><option value="diagonal-up">Diagonal gradient ↗</option><option value="radial">Radial gradient</option><option value="sunburst">Sunburst</option></select></Field>
      <div className="split-fields"><Field label="Primary"><ColorInput value={deck.background} onChange={(value) => onDeck({ background: value })} onSample={onSampleColor} /></Field><Field label="Accent"><ColorInput value={deck.backgroundAccent} onChange={(value) => onDeck({ backgroundAccent: value })} onSample={onSampleColor} /></Field></div>
      <details className="control-group"><summary>Decorative edge</summary><div className="split-fields"><Field label="Stroke color"><ColorInput value={deck.edgeStrokeColor} onChange={(value) => onDeck({ edgeStrokeColor: value })} onSample={onSampleColor} /></Field><Field label="Stroke width"><input type="number" min="0" max="30" value={deck.edgeStrokeWidth} onChange={(event) => onDeck({ edgeStrokeWidth: Number(event.target.value) })} /></Field><Field label="Corner radius"><input type="number" min="0" max="120" value={deck.edgeRadius} onChange={(event) => onDeck({ edgeRadius: Number(event.target.value) })} /></Field><Field label="Edge inset"><input type="number" min="0" max="180" value={deck.edgeStrokeInset} onChange={(event) => onDeck({ edgeStrokeInset: Number(event.target.value) })} /></Field></div></details>
      <details className="control-group" open><summary>Corner spacing</summary><div className="split-fields"><Field label="Rank X"><input type="number" min="-90" max="90" value={deck.cornerRankOffsetX} onChange={(event) => onDeck({ cornerRankOffsetX: Number(event.target.value) })} /></Field><Field label="Rank Y"><input type="number" min="-90" max="90" value={deck.cornerRankOffsetY} onChange={(event) => onDeck({ cornerRankOffsetY: Number(event.target.value) })} /></Field><Field label="Suit X"><input type="number" min="-90" max="90" value={deck.cornerSuitOffsetX} onChange={(event) => onDeck({ cornerSuitOffsetX: Number(event.target.value) })} /></Field><Field label="Suit Y"><input type="number" min="-90" max="90" value={deck.cornerSuitOffsetY} onChange={(event) => onDeck({ cornerSuitOffsetY: Number(event.target.value) })} /></Field></div></details>
      <Switch title="Mirror new cards by default" copy="Individual cards can override this in Typography." checked={deck.mirrorCorners} onChange={(value) => onDeck({ mirrorCorners: value })} />
      <Slider label="Safe-zone inset" suffix="px" value={deck.safeZoneInset} min={80} max={190} onChange={(value) => onDeck({ safeZoneInset: value })} />
      <Switch title="Show editor guides" copy="Guides never appear in PNG or ZIP exports." checked={deck.showGuides} onChange={(value) => onDeck({ showGuides: value })} />
      {deck.showGuides && <div className="guide-grid"><Switch title="Trim / bleed" checked={deck.showBleedGuide} onChange={(value) => onDeck({ showBleedGuide: value })} /><Switch title="Safe area" checked={deck.showSafeGuide} onChange={(value) => onDeck({ showSafeGuide: value })} /><Switch title="Center axes" checked={deck.showCenterGuide} onChange={(value) => onDeck({ showCenterGuide: value })} /><Switch title="Pip anchors" checked={deck.showPipGuides} onChange={(value) => onDeck({ showPipGuides: value })} /><Switch title="Corner boxes" checked={deck.showCornerGuides} onChange={(value) => onDeck({ showCornerGuides: value })} /><Switch title="Artwork bounds" checked={deck.showImageBounds} onChange={(value) => onDeck({ showImageBounds: value })} /></div>}
    </div>}

    {panel === "deck" && <div className="panel-body">
      <Field label="Deck name"><input type="text" maxLength={80} value={deck.title} onChange={(event) => onDeck({ title: event.target.value })} /></Field>
      <RankEditor key={rankList} value={rankList} onCommit={onRanks} />
      <button className="panel-button" onClick={() => onRanks("A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K")}><RotateCcw />Restore standard ranks</button>
      <Switch title="Include jokers / wild cards" checked={deck.includeJokers} onChange={(value) => onDeck({ includeJokers: value })} />
      {deck.includeJokers && <>
        <Field label="Joker count"><input type="number" min="1" max="8" value={deck.jokerCount} onChange={(event) => onDeck({ jokerCount: Math.max(1, Math.min(8, Number(event.target.value))) })} /></Field>
        <div className="split-fields"><Field label="Label"><input type="text" maxLength={24} value={deck.jokerLabel} onChange={(event) => onDeck({ jokerLabel: event.target.value })} /></Field><Field label="Subtitle"><input type="text" maxLength={36} value={deck.jokerSubtitle} onChange={(event) => onDeck({ jokerSubtitle: event.target.value })} /></Field></div>
        <Switch title="Mark as wild" checked={deck.jokerWild} onChange={(value) => onDeck({ jokerWild: value })} />
        <Slider label="Label size" suffix="px" value={deck.jokerFontSize} min={28} max={150} onChange={(value) => onDeck({ jokerFontSize: value })} />
        <Field label="Label orientation"><div className="segmented"><button className={deck.jokerOrientation === "vertical" ? "active" : ""} onClick={() => onDeck({ jokerOrientation: "vertical" })}>Vertical</button><button className={deck.jokerOrientation === "horizontal" ? "active" : ""} onClick={() => onDeck({ jokerOrientation: "horizontal" })}>Horizontal</button></div></Field>
        <Field label="Suit layout"><select value={deck.jokerSuitStyle} onChange={(event) => onDeck({ jokerSuitStyle: event.target.value as DeckSettings["jokerSuitStyle"] })}><option value="center-circle">Center circle</option><option value="square">Square</option><option value="diamond">Diamond</option><option value="rows">Horizontal row</option></select></Field>
      </>}
      <div className="panel-note"><strong>{deckCardCount(deck)} cards total</strong><span>{deck.ranks.length} unique ranks</span></div>
    </div>}
  </aside>;
}

# Playing Card Builder

Design full card decks in the browser and export print-ready assets. The app ships as a static site with optional The Game Crafter export handled through the bundled PHP proxy.

## Quick start
- Serve the project root with any static server (for example `python -m http.server 8000`).
- Open `http://localhost:8000` and start configuring cards.
- PHP is only required for The Game Crafter export; other features run client side.

## Core features
- Build standard or custom decks with per-card face art.
- Drag a face image on the canvas, zoom, rotate, and flip it. Reset transforms per card when needed.
- Mirror rank and suit corners per card or set a mirrored default for new cards.
- Choose rank text: Google Font picker, weight, size, color, opacity, outline, glow, or shadow overlay.
- Swap suit icons: pick from built-in 2×2 sprite sheets or upload your own sheet; recolor and scale icons.
- Adjust corner layout (rank above suit, suit above rank, side by side) and nudge corner offsets.
- Toggle pip patterns on card bodies and fine-tune pip row positions as percentages of the safe area.
- Configure ranks with a custom comma-separated list. Include Jokers with label, count (up to 8), and wild tag.
- Bulk import face images and map filenames to suits and ranks before applying.
- Autosave to local storage with status indicator. Import or export progress as a ZIP snapshot.

## User interface
- **Card selection**: suit and rank pickers plus next/previous buttons to move through the deck. A checkbox mirrors corners for the active card. Autosave status and per-card download live near the canvas.
- **Face image panel**: clickable drop zone for the current card, zoom and rotation sliders, horizontal and vertical flip, and a reset button. Drag on the canvas to reposition the face art. Badge opens the bulk loader modal for multi-file mapping.
- **Rank/Index font**: collapsible section with font family picker tied to Google Fonts, weight and size inputs, color and opacity controls, overlay type, outline toggle with width and color.
- **Suit icons**: choose a preset sprite sheet or upload a 2×2 grid image. Adjust icon color, opacity, and scale. Built-in presets live in `/suits`.
- **Deck and ranks**: optional custom rank string, joker toggle with count, label, and wild flag. Hints explain expected formats.
- **Layout and options**: pill buttons set corner arrangement. Toggles for pip visibility and default mirroring. Number inputs tweak rank and suit offsets. Sliders adjust pip row percentages with a guideline overlay toggle. Safe zone and canvas dimensions display above the preview.
- **Export**: buttons for full deck ZIP export and The Game Crafter upload. Save/Import badges wrap autosave data into a ZIP for backup or transfer.

## Exports
- **Single card PNG**: download the active card from the preview toolbar.
- **Deck ZIP**: export every configured suit and rank plus optional Jokers as individual 825×1125 PNG files with 80 px bleed. Filenames follow `{rank}{suitSymbol}.png` and `JOKER.png` (with suffix when multiple Jokers are present).
- **The Game Crafter**: start SSO login, pick or create a designer, game, and deck, preview generated cards, then upload directly. The PHP proxy at `api/tgc.php` expects `DEVELOPER_ID` and `DEVELOPER_KEY` in `/home/fairwayg/.secrets/tgc.ini`.
- **Progress ZIP**: save the current autosave payload to a ZIP for sharing, then import it later to restore all settings, icon choices, and face art.

## Tips
- Face image auto-scale uses the safe area height as a baseline after bulk import; fine-tune position and scale per card as needed.
- Sprite sheets list suits in order: top-left Spades, top-right Hearts, bottom-left Clubs, bottom-right Diamonds.
- Keep the guideline overlay on while adjusting pip rows to match your print bleed preferences.

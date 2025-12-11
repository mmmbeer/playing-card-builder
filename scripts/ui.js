import {
  CARD_WIDTH,
  CARD_HEIGHT,
  BLEED,
  SAFE_WIDTH,
  SAFE_HEIGHT,
  ICON_PRESETS,
  SUITS
} from './config.js'

import {
  settings,
  deck,
  activeRanks,
  initDeck,
  updateActiveRanksFromSettings,
  getCurrentCard
} from './state.js'

import {
  renderCard,
  renderCardForPreview,
  renderCardForExport,
  renderJokerCard
} from './drawing.js'


import { injectFontFamily, initFontBrowser, openFontBrowser } from './fonts.js'
import { downloadSingleCard, exportFullDeck } from "./save.js";
import { openBulkModal, initBulkLoader } from "./bulk.js";

import { markDirty } from "./autosave.js";


let canvas
let ctx
let currentSuitId = 'spades'
let currentRank = 'A'

let prevCardBtn
let nextCardBtn


// Drag state for face image
let isDraggingFace = false
let dragStartX = 0
let dragStartY = 0
let dragStartOffsetX = 0
let dragStartOffsetY = 0

// DOM references
let suitSelect
let rankSelect
let mirrorCardCheckbox

let customRanksInput
let includeJokersCheckbox
let jokerCountInput
let jokerLabelInput
let jokerWildCheckbox

let fontFamilyWrapper
let applyFontButton
let fontSizeInput
let fontWeightSelect
let fontColorInput
let fontOpacityInput
let overlayTypeSelect
let outlineCheckbox
let outlineWidthInput
let outlineColorInput

let openFontBrowserButton

let downloadCardButton



let iconPresetSelect
let iconSheetInput
let iconColorInput
let iconOpacityInput
let iconScaleInput

let layoutButtonsContainer
let showPipsCheckbox
let mirrorDefaultCheckbox

let showGuidelinesCheckbox

let rankOffsetXInput
let rankOffsetYInput
let suitOffsetXInput
let suitOffsetYInput

let pipTopInput
let pipInnerTopInput
let pipCenterInput
let pipInnerBottomInput
let pipBottomInput

let faceImageInput

let faceImageLabel;
let faceImageWrapper;



let faceScaleInput
let faceRotationInput
let faceFlipHCheckbox
let faceFlipVCheckbox
let resetFaceTransformButton

let exportDeckButton


function renderCurrentCard() {
  if (!currentRank || !currentSuitId) return
  renderCardForPreview(ctx, currentSuitId, currentRank)
}

function getCanvasEventCoords(evt) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (evt.clientX - rect.left) * scaleX
  const y = (evt.clientY - rect.top) * scaleY
  return { x, y }
}

function initIconPresets() {
  iconPresetSelect.innerHTML = ''

  ICON_PRESETS.forEach(preset => {
    const opt = document.createElement('option')
    opt.value = preset.id
    opt.textContent = preset.label
    iconPresetSelect.appendChild(opt)
  })

  const customOpt = document.createElement('option')
  customOpt.value = 'custom'
  customOpt.textContent = 'Custom upload…'
  iconPresetSelect.appendChild(customOpt)

  if (ICON_PRESETS.length > 0) {
    iconPresetSelect.value = ICON_PRESETS[0].id
    loadIconPresetById(ICON_PRESETS[0].id)
  } else {
    iconPresetSelect.value = 'custom'
  }
}

function loadIconPresetById(id) {
  const preset = ICON_PRESETS.find(p => p.id === id)
  if (!preset) return

  const img = new Image()
  img.onload = () => {
    settings.iconSheet = img
    renderCurrentCard()
  }
  img.src = preset.file
}

function refreshRankSelect() {
  const prev = currentRank
  rankSelect.innerHTML = ''

  activeRanks.forEach(rank => {
    const opt = document.createElement('option')
    opt.value = rank
    opt.textContent = rank
    rankSelect.appendChild(opt)
  })

  if (activeRanks.includes(prev)) {
    currentRank = prev
  } else if (activeRanks.length > 0) {
    currentRank = activeRanks[0]
  } else {
    currentRank = ''
  }

  if (currentRank) {
    rankSelect.value = currentRank
  }
}

function syncCardControlsFromData() {
  const card = getCurrentCard(currentSuitId, currentRank)
  if (!card) return

  mirrorCardCheckbox.checked = typeof card.mirrorCorners === 'boolean'
    ? card.mirrorCorners
    : settings.mirrorDefault

  faceScaleInput.value = card.scale
  faceRotationInput.value = card.rotation
  faceFlipHCheckbox.checked = card.flipH
  faceFlipVCheckbox.checked = card.flipV
  
  if (card.faceImageUrl) {
	  const url = card.faceImageUrl;
	  const fileName = url.split('/').pop() || 'image';
	  faceImageLabel.textContent = fileName;
	} else {
	  faceImageLabel.textContent = "Click to add…";
	}

}


function wireEvents() {
  // Card selection
  suitSelect.addEventListener('change', () => {
    currentSuitId = suitSelect.value
    syncCardControlsFromData()
    renderCurrentCard()
  })
  
  downloadCardButton.addEventListener("click", () =>
	  downloadSingleCard(currentSuitId, currentRank)
	);


prevCardBtn.addEventListener('click', () => goToCard(-1))
nextCardBtn.addEventListener('click', () => goToCard(1))
  


  rankSelect.addEventListener('change', () => {
    currentRank = rankSelect.value
    syncCardControlsFromData()
    renderCurrentCard()
  })

  mirrorCardCheckbox.addEventListener('change', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.mirrorCorners = mirrorCardCheckbox.checked
    renderCurrentCard()
  })

  // Deck / ranks
  customRanksInput.addEventListener('change', () => {
    settings.customRanksString = customRanksInput.value
    updateActiveRanksFromSettings()
    refreshRankSelect()
    syncCardControlsFromData()
    renderCurrentCard()
  })

  includeJokersCheckbox.addEventListener('change', () => {
    settings.includeJokers = includeJokersCheckbox.checked
  })

  jokerCountInput.addEventListener('input', () => {
    let n = parseInt(jokerCountInput.value, 10)
    if (isNaN(n) || n < 1) n = 1
    if (n > 8) n = 8
    jokerCountInput.value = n
    settings.jokerCount = n
  })

  jokerLabelInput.addEventListener('input', () => {
    settings.jokerLabel = jokerLabelInput.value || 'JOKER'
  })

  jokerWildCheckbox.addEventListener('change', () => {
    settings.jokerWild = jokerWildCheckbox.checked
  })

  // Font controls


  fontSizeInput.addEventListener('input', () => {
    const size = parseInt(fontSizeInput.value, 10)
    if (!isNaN(size) && size > 0) {
      settings.fontSize = size
      renderCurrentCard()
    }
  })

  fontWeightSelect.addEventListener('change', () => {
    settings.fontWeight = fontWeightSelect.value
    renderCurrentCard()
  })

  fontColorInput.addEventListener('input', () => {
    settings.fontColor = fontColorInput.value
    renderCurrentCard()
  })

  fontOpacityInput.addEventListener('input', () => {
    settings.fontOpacity = parseFloat(fontOpacityInput.value)
    renderCurrentCard()
  })

  overlayTypeSelect.addEventListener('change', () => {
    settings.overlayType = overlayTypeSelect.value
    renderCurrentCard()
  })

  outlineCheckbox.addEventListener('change', () => {
    settings.outline = outlineCheckbox.checked
    renderCurrentCard()
  })

  outlineWidthInput.addEventListener('input', () => {
    settings.outlineWidth = parseFloat(outlineWidthInput.value)
    renderCurrentCard()
  })

  outlineColorInput.addEventListener('input', () => {
    settings.outlineColor = outlineColorInput.value
    renderCurrentCard()
  })

  // Icon controls
  iconPresetSelect.addEventListener('change', () => {
    const value = iconPresetSelect.value
    if (value === 'custom') return
    loadIconPresetById(value)
  })

  iconSheetInput.addEventListener('change', evt => {
    const file = evt.target.files && evt.target.files[0]
    if (!file) return

    iconPresetSelect.value = 'custom'

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      settings.iconSheet = img
      renderCurrentCard()
    }
    img.src = url
  })

  iconColorInput.addEventListener('input', () => {
    settings.iconColor = iconColorInput.value
    renderCurrentCard()
  })

  iconOpacityInput.addEventListener('input', () => {
    settings.iconOpacity = parseFloat(iconOpacityInput.value)
    renderCurrentCard()
  })

  iconScaleInput.addEventListener('input', () => {
    settings.iconScale = parseFloat(iconScaleInput.value)
    renderCurrentCard()
  })

  // Layout buttons
  layoutButtonsContainer.addEventListener('click', evt => {
    const btn = evt.target.closest('button[data-layout]')
    if (!btn) return
    const layout = btn.getAttribute('data-layout')
    settings.layout = layout
    layoutButtonsContainer.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b === btn)
    })
    renderCurrentCard()
  })

  showPipsCheckbox.addEventListener('change', () => {
    settings.showPips = showPipsCheckbox.checked
    renderCurrentCard()
  })

  mirrorDefaultCheckbox.addEventListener('change', () => {
    settings.mirrorDefault = mirrorDefaultCheckbox.checked
    renderCurrentCard()
  })
  
  faceImageLabel.addEventListener("click", () => {
	  faceImageInput.click();
	});

  // --- NEW: Guidelines toggle ---
  showGuidelinesCheckbox.addEventListener('change', () => {
    settings.showGuidelines = showGuidelinesCheckbox.checked
    renderCurrentCard()
  })

  // Corner offsets
  rankOffsetXInput.addEventListener('input', () => {
    settings.cornerRankOffsetX = parseFloat(rankOffsetXInput.value) || 0
    renderCurrentCard()
  })

  rankOffsetYInput.addEventListener('input', () => {
    settings.cornerRankOffsetY = parseFloat(rankOffsetYInput.value) || 0
    renderCurrentCard()
  })

  suitOffsetXInput.addEventListener('input', () => {
    settings.cornerSuitOffsetX = parseFloat(suitOffsetXInput.value) || 0
    renderCurrentCard()
  })

  suitOffsetYInput.addEventListener('input', () => {
    settings.cornerSuitOffsetY = parseFloat(suitOffsetYInput.value) || 0
    renderCurrentCard()
  })

  // Pip vertical controls
  function pipSetter(input, key) {
    input.addEventListener('input', () => {
      let v = parseFloat(input.value)
      if (isNaN(v)) v = 0
      if (v < 0) v = 0
      if (v > 100) v = 100
      input.value = v
      settings[key] = v / 100
      renderCurrentCard()
    })
  }

  pipSetter(pipTopInput, 'pipTop')
  pipSetter(pipInnerTopInput, 'pipInnerTop')
  pipSetter(pipCenterInput, 'pipCenter')
  pipSetter(pipInnerBottomInput, 'pipInnerBottom')
  pipSetter(pipBottomInput, 'pipBottom')

  // Face image & transforms
  faceImageInput.addEventListener('change', evt => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    const file = evt.target.files && evt.target.files[0]
    if (!file) return
	
	faceImageLabel.textContent = file.name;


    if (card.faceImageUrl) {
      URL.revokeObjectURL(card.faceImageUrl)
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      card.faceImage = img
		card.faceImageUrl = url
		card.offsetX = 0
		card.offsetY = 0
		card.rotation = 0
		card.flipH = false
		card.flipV = false

		// AUTO-SCALE: fill vertical safe area
		const baseScale = SAFE_HEIGHT / img.height
		card.scale = baseScale

		syncCardControlsFromData()
		renderCurrentCard()
    }
    img.src = url
  })

  faceScaleInput.addEventListener('input', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.scale = parseFloat(faceScaleInput.value)
    renderCurrentCard()
  })

  faceRotationInput.addEventListener('input', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.rotation = parseFloat(faceRotationInput.value)
    renderCurrentCard()
  })

  faceFlipHCheckbox.addEventListener('change', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.flipH = faceFlipHCheckbox.checked
    renderCurrentCard()
  })

  faceFlipVCheckbox.addEventListener('change', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.flipV = faceFlipVCheckbox.checked
    renderCurrentCard()
  })

  resetFaceTransformButton.addEventListener('click', () => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    card.offsetX = 0
    card.offsetY = 0
    card.scale = 1
    card.rotation = 0
    card.flipH = false
    card.flipV = false
    syncCardControlsFromData()
    renderCurrentCard()
  })

  // Canvas drag for face image
  canvas.addEventListener('mousedown', evt => {
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card || !card.faceImage) return
    isDraggingFace = true
    const { x, y } = getCanvasEventCoords(evt)
    dragStartX = x
    dragStartY = y
    dragStartOffsetX = card.offsetX
    dragStartOffsetY = card.offsetY
  })

  window.addEventListener('mousemove', evt => {
    if (!isDraggingFace) return
    const card = getCurrentCard(currentSuitId, currentRank)
    if (!card) return
    const { x, y } = getCanvasEventCoords(evt)
    const dx = x - dragStartX
    const dy = y - dragStartY
    card.offsetX = dragStartOffsetX + dx
    card.offsetY = dragStartOffsetY + dy
    renderCurrentCard()
  })

  window.addEventListener('mouseup', () => {
    isDraggingFace = false
  })

  window.addEventListener('mouseleave', () => {
    isDraggingFace = false
  })

  // Export deck
  exportDeckButton.addEventListener("click", () =>
	  exportFullDeck().catch(err => {
		console.error(err);
		alert("Error exporting deck. See console for details.");
	  })
	);

}

function getCardIndex() {
  const suitIndex = SUITS.findIndex(s => s.id === currentSuitId)
  const rankIndex = activeRanks.indexOf(currentRank)
  return suitIndex * activeRanks.length + rankIndex
}

function goToCard(offset) {
  const total = SUITS.length * activeRanks.length
  let index = getCardIndex() + offset
  if (index < 0) index = total - 1
  if (index >= total) index = 0

  const suitIndex = Math.floor(index / activeRanks.length)
  const rankIndex = index % activeRanks.length

  currentSuitId = SUITS[suitIndex].id
  currentRank = activeRanks[rankIndex]

  suitSelect.value = currentSuitId
  rankSelect.value = currentRank

  syncCardControlsFromData()
  renderCurrentCard()
}


// -------------------------------
// INIT UI
// -------------------------------
export function initUI() {
  canvas = document.getElementById('cardCanvas')
  ctx = canvas.getContext('2d')

  suitSelect = document.getElementById('suitSelect')
  rankSelect = document.getElementById('rankSelect')
  mirrorCardCheckbox = document.getElementById('mirrorCardCheckbox')
  downloadCardButton = document.getElementById('downloadCardButton')

  customRanksInput = document.getElementById('customRanksInput')
  includeJokersCheckbox = document.getElementById('includeJokersCheckbox')
  jokerCountInput = document.getElementById('jokerCountInput')
  jokerLabelInput = document.getElementById('jokerLabelInput')
  jokerWildCheckbox = document.getElementById('jokerWildCheckbox')

  fontFamilyWrapper = document.getElementById("fontFamilyWrapper")
  fontFamilyWrapper.addEventListener("click", () => openFontBrowser())
  


  
  faceImageWrapper = document.getElementById("faceImageWrapper");
  faceImageLabel = document.getElementById("faceImageLabel");

  
  
  applyFontButton = document.getElementById('applyFontButton')
  fontSizeInput = document.getElementById('fontSizeInput')
  fontWeightSelect = document.getElementById('fontWeightSelect')
  fontColorInput = document.getElementById('fontColorInput')
  fontOpacityInput = document.getElementById('fontOpacityInput')
  
  prevCardBtn = document.getElementById('prevCardBtn')
  nextCardBtn = document.getElementById('nextCardBtn')

  
  overlayTypeSelect = document.getElementById('overlayTypeSelect')
  outlineCheckbox = document.getElementById('outlineCheckbox')
  outlineWidthInput = document.getElementById('outlineWidthInput')
  outlineColorInput = document.getElementById('outlineColorInput')

  iconPresetSelect = document.getElementById('iconPresetSelect')
  iconSheetInput = document.getElementById('iconSheetInput')
  iconColorInput = document.getElementById('iconColorInput')
  iconOpacityInput = document.getElementById('iconOpacityInput')
  iconScaleInput = document.getElementById('iconScaleInput')

  layoutButtonsContainer = document.getElementById('layoutButtons')
  showPipsCheckbox = document.getElementById('showPipsCheckbox')
  mirrorDefaultCheckbox = document.getElementById('mirrorDefaultCheckbox')

  showGuidelinesCheckbox = document.getElementById('showGuidelinesCheckbox')  // NEW

  rankOffsetXInput = document.getElementById('rankOffsetXInput')
  rankOffsetYInput = document.getElementById('rankOffsetYInput')
  suitOffsetXInput = document.getElementById('suitOffsetXInput')
  suitOffsetYInput = document.getElementById('suitOffsetYInput')

  pipTopInput = document.getElementById('pipTopInput')
  pipInnerTopInput = document.getElementById('pipInnerTopInput')
  pipCenterInput = document.getElementById('pipCenterInput')
  pipInnerBottomInput = document.getElementById('pipInnerBottomInput')
  pipBottomInput = document.getElementById('pipBottomInput')

  faceImageInput = document.getElementById('faceImageInput')
  faceScaleInput = document.getElementById('faceScaleInput')
  faceRotationInput = document.getElementById('faceRotationInput')
  faceFlipHCheckbox = document.getElementById('faceFlipHCheckbox')
  faceFlipVCheckbox = document.getElementById('faceFlipVCheckbox')
  resetFaceTransformButton = document.getElementById('resetFaceTransformButton')

  exportDeckButton = document.getElementById('exportDeckButton')
  
  const bulkUploadBadge = document.getElementById("bulkUploadBadge");
	bulkUploadBadge.addEventListener("click", () => {
	  openBulkModal(renderCurrentCard);
	});


  initDeck()
  initBulkLoader();

  updateActiveRanksFromSettings()
  refreshRankSelect()

  suitSelect.value = currentSuitId
  
  
  
  fontSizeInput.value = settings.fontSize
  fontColorInput.value = settings.fontColor
  fontOpacityInput.value = settings.fontOpacity
  overlayTypeSelect.value = settings.overlayType
  outlineCheckbox.checked = settings.outline
  outlineWidthInput.value = settings.outlineWidth
  outlineColorInput.value = settings.outlineColor

  includeJokersCheckbox.checked = settings.includeJokers
  jokerCountInput.value = settings.jokerCount
  jokerLabelInput.value = settings.jokerLabel
  jokerWildCheckbox.checked = settings.jokerWild

  iconColorInput.value = settings.iconColor
  iconOpacityInput.value = settings.iconOpacity
  iconScaleInput.value = settings.iconScale

  showPipsCheckbox.checked = settings.showPips
  mirrorDefaultCheckbox.checked = settings.mirrorDefault
  showGuidelinesCheckbox.checked = settings.showGuidelines    // NEW

  rankOffsetXInput.value = settings.cornerRankOffsetX
  rankOffsetYInput.value = settings.cornerRankOffsetY
  suitOffsetXInput.value = settings.cornerSuitOffsetX
  suitOffsetYInput.value = settings.cornerSuitOffsetY

  pipTopInput.value = settings.pipTop * 100
  pipInnerTopInput.value = settings.pipInnerTop * 100
  pipCenterInput.value = settings.pipCenter * 100
  pipInnerBottomInput.value = settings.pipInnerBottom * 100
  pipBottomInput.value = settings.pipBottom * 100

  initIconPresets()
  syncCardControlsFromData()

  // collapsible card panels
	document.querySelectorAll('.panel-header.collapsible').forEach(header => {
	  header.addEventListener('click', () => {
		const panel = header.closest('.panel')
		panel.classList.toggle('collapsed')
	  })
	})
	
	
	document.getElementById('canvasSizeInfo').textContent =
  `${CARD_WIDTH} × ${CARD_HEIGHT} px`

document.getElementById('safeZoneInfo').textContent =
  `${SAFE_WIDTH} × ${SAFE_HEIGHT} px`


  wireEvents()

  initFontBrowser()

  renderCurrentCard()
  
  window.renderCurrentCard = renderCurrentCard;

}

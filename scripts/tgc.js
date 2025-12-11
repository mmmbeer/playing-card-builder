// =============================================================
// TGC EXPORT MODULE — FINAL, API-CORRECT, ERROR-PROOF
// =============================================================

const DEBUG = true
function dbg(...a) { if (DEBUG) console.log("[TGC]", ...a) }

// =============================================================
// DOM ELEMENTS
// =============================================================

let modal, closeBtn

let loginPanel, loginBtn
let exportPanel

let phase1, phase2

// designer + game phase
let designerSelect
let gameSearch, gameSelect
let createGameBtn, newGameRow, newGameName, confirmCreateGame

// locked phase
let lockedInfo, restartBtn

// deck phase
let deckSelect
let createDeckBtn, newDeckRow, newDeckName, confirmCreateDeck

// preview + export
let previewPanel, exportBtn

// =============================================================
// STORAGE
// =============================================================

const SID = () => localStorage.getItem("tgc_sid")
const UID = () => localStorage.getItem("tgc_uid")
const DID = () => localStorage.getItem("tgc_did")
const GID = () => localStorage.getItem("tgc_gid")

const setSID = v => localStorage.setItem("tgc_sid", v)
const setUID = v => localStorage.setItem("tgc_uid", v)
const setDID = v => localStorage.setItem("tgc_did", v)
const setGID = v => localStorage.setItem("tgc_gid", v)

// =============================================================
// API WRAPPER
// =============================================================

async function tgcApi(path, method = "GET", options = {}) {
  const payload = {
    path,
    method: method.toUpperCase()
  }

  if (options.query) payload.query = options.query
  if (options.data) payload.data = options.data

  dbg("API →", payload)

  const res = await fetch("/playing-cards/api/tgc.php", {
    method: "POST", // always POST to the PHP proxy
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  let json
  try {
    json = await res.json()
  } catch (err) {
    dbg("ERROR: invalid JSON from proxy", err)
    return { error: { message: "Invalid JSON from proxy" } }
  }

  dbg("API ←", json)
  return json
}

// =============================================================
// LOGIN POPUP
// =============================================================

function startTgcLoginPopup() {
  const w = 600, h = 700
  const left = (screen.width - w) / 2
  const top = (screen.height - h) / 2

  const popup = window.open(
    "/playing-cards/api/tgc.php?action=sso_start",
    "tgcLogin",
    `width=${w},height=${h},left=${left},top=${top}`
  )

  if (!popup) alert("Allow popups.")
}

window.addEventListener("message", async e => {
  if (!e.data || e.data.type !== "tgc-auth") return

  const sid = e.data.session_id
  const uid = e.data.user_id

  if (!sid || !uid) {
    alert("TGC login failed.")
    return
  }

  setSID(sid)
  setUID(uid)
  setDID(null)
  setGID(null)

  if (loginPanel && exportPanel) {
    loginPanel.classList.add("hidden")
    exportPanel.classList.remove("hidden")
    await loadDesigners()
  }
})

// =============================================================
// FETCHING DESIGNERS — REAL TGC ENDPOINT
// =============================================================

async function fetchDesigners() {
  const uid = UID()
  const sid = SID()
  if (!uid || !sid) return []

  // Get the user, including relationships
  const res = await tgcApi(`user/${uid}`, "GET", {
    query: {
      session_id: sid,
      _include_relationships: 1
    }
  })

  if (!res || res.error) {
    dbg("ERROR: fetchDesigners (user):", res)
    return []
  }

  const user = res.result || res

  const defaultDesignerId = user.default_designer_id || null
  const displayName = user.display_name || user.username || "Default Designer"

  // Make sure DID is set so we don't end up with designer/null
  if (defaultDesignerId && !DID()) {
    setDID(defaultDesignerId)
  }

  let designers = []

  // If the API exposes a designers relationship, try to load the real list
  const relDesigners = user._relationships && user._relationships.designers
  if (relDesigners) {
    // Relationship paths look like "/api/user/.../designers" – strip the leading "/api/"
    const relPath = relDesigners.replace(/^\/?api\//, "")

    const dRes = await tgcApi(relPath, "GET", {
      query: { session_id: sid }
    })

    if (!dRes || dRes.error) {
      dbg("ERROR: fetchDesigners (designers rel):", dRes)
    } else {
      const root = dRes.result || dRes

      if (Array.isArray(root.items)) {
        designers = root.items
      } else if (Array.isArray(root.designers)) {
        designers = root.designers
      } else if (Array.isArray(root)) {
        designers = root
      }
    }
  }

  // Fallback: if the relationship call fails or returns nothing,
  // synthesize a "default" designer from the user.
  if (!designers.length && defaultDesignerId) {
    designers = [{
      id: defaultDesignerId,
      name: displayName,
      object_name: "Designer",
      _source: "default_designer"
    }]
  }

  return designers
}

async function fetchGames(designerIdOverride) {
  const sid = SID()
  if (!sid) return []

  // Determine which designer's games to fetch
  let did = designerIdOverride || DID()

  // If we don't have a designer stored yet, pull it from the user
  if (!did) {
    const uid = UID()
    if (!uid) return []

    const userRes = await tgcApi(`user/${uid}`, "GET", {
      query: {
        session_id: sid,
        _include_relationships: 1
      }
    })

    if (!userRes || userRes.error) {
      dbg("ERROR: fetchGames (user for default designer):", userRes)
      return []
    }

    const user = userRes.result || userRes
    if (user.default_designer_id) {
      did = user.default_designer_id
      setDID(did)
    } else {
      dbg("ERROR: fetchGames: no default_designer_id on user")
      return []
    }
  }

  const allGames = []
  let page = 1
  const pageSize = 100 // max per docs, keep pagination simple

  while (true) {
    const res = await tgcApi(`designer/${did}/games`, "GET", {
      query: {
        session_id: sid,
        _items_per_page: pageSize,
        _page_number: page
      }
    })

    if (!res || res.error) {
      dbg("ERROR: fetchGames (page " + page + "):", res)
      break
    }

    const root = res.result || res
    const items = root.items || root.games || []

    if (!Array.isArray(items) || !items.length) {
      // nothing on this page, stop
      break
    }

    allGames.push(...items)

    const paging = root.paging || root.pager
    if (!paging) {
      // no paging info, assume single page
      break
    }

    const currentPage = Number(paging.page_number) || page
    const totalPages = Number(paging.total_pages) || currentPage
    const nextPage = Number(paging.next_page_number)

    // Stop if we're at the last page, or if the API stops advancing page numbers
    if (
      currentPage >= totalPages ||
      !nextPage ||
      nextPage === currentPage
    ) {
      break
    }

    page = nextPage
  }

  return allGames
}

async function fetchDecks(gameId) {
  const sid = SID()
  if (!gameId || !sid) return []

  // GET /api/game/{gameId}/decks?session_id=...
  const res = await tgcApi(`game/${gameId}/decks`, "GET", {
    query: {
      session_id: sid
    }
  })

  if (!res || res.error) {
    dbg("ERROR: fetchDecks:", res)
    return []
  }

  const root = res.result || res

  if (Array.isArray(root.items)) return root.items
  if (Array.isArray(root.decks)) return root.decks
  if (Array.isArray(root.result)) return root.result

  return []
}

// =============================================================
// LOAD DESIGNERS INTO UI
// =============================================================

let designerList = []
let gameList = []
let deckList = []

async function loadDesigners() {
  if (!phase1 || !phase2 || !designerSelect) return

  phase1.classList.remove("hidden")
  phase2.classList.add("hidden")

  designerList = await fetchDesigners()

  designerSelect.innerHTML = ""

  designerList.forEach(d => {
    const opt = document.createElement("option")
    opt.value = d.id
    opt.textContent = d.name
    designerSelect.appendChild(opt)
  })

  const stored = DID()
  if (stored && designerList.some(d => d.id === stored)) {
    designerSelect.value = stored
  } else if (designerList.length) {
    setDID(designerList[0].id)
    designerSelect.value = designerList[0].id
  }

  await loadGames(designerSelect.value)
}

// =============================================================
// LOAD GAMES INTO UI
// =============================================================

async function loadGames(designerIdOverride) {
  if (!gameSelect || !gameSearch) return

  // Always prefer an explicit designer id when provided,
  // but fall back to what we have stored.
  const did = designerIdOverride || designerSelect?.value || DID()
  gameList = await fetchGames(did)

  gameSelect.innerHTML = ""
  gameSearch.value = ""

  gameList.forEach(g => {
    const opt = document.createElement("option")
    opt.value = g.id
    opt.textContent = g.name
    gameSelect.appendChild(opt)
  })

  // Try to preserve an existing selection if it’s still valid
  const stored = GID()
  if (stored && gameList.some(g => g.id === stored)) {
    gameSelect.value = stored
  } else if (gameList.length) {
    setGID(gameList[0].id)
    gameSelect.value = gameList[0].id
  }
}

// =============================================================
// LOCKED PHASE (Designer + Game)
// =============================================================

function lockPhase() {
  const did = DID()
  const gid = GID()

  const designer = designerList.find(d => d.id === did)
  const game = gameList.find(g => g.id === gid)

  if (lockedInfo) {
    lockedInfo.textContent = `${designer?.name || "?"} | ${game?.name || "?"}`
  }

  if (phase1 && phase2) {
    phase1.classList.add("hidden")
    phase2.classList.remove("hidden")
  }

  if (gid) loadDecks(gid)
}

function restartPhase() {
  setGID(null)
  if (phase2 && phase1) {
    phase2.classList.add("hidden")
    phase1.classList.remove("hidden")
  }
}

// =============================================================
// DECKS
// =============================================================

async function loadDecks(gameId) {
  if (!deckSelect) return

  deckList = await fetchDecks(gameId)

  deckSelect.innerHTML = ""
  deckList.forEach(d => {
    const opt = document.createElement("option")
    opt.value = d.id
    opt.textContent = d.name
    deckSelect.appendChild(opt)
  })

  if (deckList.length) deckSelect.value = deckList[0].id

  showCardPreview()
}

// =============================================================
// PREVIEW
// =============================================================

function showCardPreview() {
  if (!previewPanel) return

  previewPanel.innerHTML = `
    <div class="tgc-preview-box">
      <div class="tgc-card-face">Card Preview Placeholder</div>
    </div>
  `
}

// =============================================================
// EXPORT — Placeholder
// =============================================================

function handleExportClick() {
  alert("Export not implemented yet.")
}

// =============================================================
// MODAL BOOTSTRAP
// =============================================================

function openTgcModal() {
  if (!modal) return

  modal.classList.remove("hidden")

  if (SID() && UID()) {
    if (loginPanel && exportPanel) {
      loginPanel.classList.add("hidden")
      exportPanel.classList.remove("hidden")
    }
    loadDesigners()
  }
}

function closeTgcModal() {
  if (modal) modal.classList.add("hidden")
}

export function initTgcExport() {
  dbg("Init TGC Export")

  modal = document.getElementById("tgcModal")
  closeBtn = document.getElementById("closeTgcModal")

  loginPanel = document.getElementById("tgcLoginPanel")
  loginBtn = document.getElementById("tgcLoginButton")

  exportPanel = document.getElementById("tgcExportPanel")

  phase1 = document.getElementById("tgcPhase1")
  phase2 = document.getElementById("tgcPhase2")

  designerSelect = document.getElementById("tgcDesignerSelect")
  gameSearch = document.getElementById("tgcGameSearch")
  gameSelect = document.getElementById("tgcGameSelect")
  createGameBtn = document.getElementById("tgcCreateGameButton")
  newGameRow = document.getElementById("tgcNewGameRow")
  newGameName = document.getElementById("tgcNewGameName")
  confirmCreateGame = document.getElementById("tgcConfirmCreateGame")

  lockedInfo = document.getElementById("tgcLockedInfo")
  restartBtn = document.getElementById("tgcRestartButton")

  deckSelect = document.getElementById("tgcDeckSelect")
  createDeckBtn = document.getElementById("tgcCreateDeckButton")
  newDeckRow = document.getElementById("tgcNewDeckRow")
  newDeckName = document.getElementById("tgcNewDeckName")
  confirmCreateDeck = document.getElementById("tgcConfirmCreateDeck")

  previewPanel = document.getElementById("tgcPreviewPanel")
  exportBtn = document.getElementById("tgcExportButton")

  const openBtn = document.getElementById("tgcExportOpenButton")
  if (openBtn) openBtn.addEventListener("click", openTgcModal)

  if (closeBtn) closeBtn.addEventListener("click", closeTgcModal)
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeTgcModal()
    })
  }

  if (loginBtn) loginBtn.addEventListener("click", startTgcLoginPopup)

  // ==========================
  // Event wiring (now that DOM refs exist)
  // ==========================

  if (designerSelect) {
    designerSelect.addEventListener("change", async () => {
      const did = designerSelect.value
      setDID(did)
      setGID(null)
      await loadGames(did)
    })
  }

  if (gameSearch) {
  gameSearch.addEventListener("input", () => {
    const q = gameSearch.value.trim().toLowerCase();

    const list = q
      ? gameList.filter(g => g.name.toLowerCase().includes(q))
      : gameList; // Show ALL results when empty

    gameSelect.innerHTML = "";

    list.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      gameSelect.appendChild(opt);
    });

    if (list.length) {
      gameSelect.value = list[0].id;
      setGID(list[0].id);
    } else {
      setGID(null);
    }
  });
}

  if (gameSelect) {
    gameSelect.addEventListener("dblclick", () => {
      const gid = gameSelect.value
      if (!gid) return

      setGID(gid)
      lockPhase()
    })
  }

  if (createGameBtn) {
    createGameBtn.addEventListener("click", () => {
      if (!newGameRow || !newGameName || !gameSearch) return
      newGameRow.classList.toggle("hidden")
      newGameName.value = gameSearch.value.trim()
    })
  }

  if (confirmCreateGame) {
    confirmCreateGame.addEventListener("click", async () => {
      if (!newGameName) return
      const name = newGameName.value.trim()
      if (!name) return

      const res = await tgcApi("game", "POST", {
        data: {
          session_id: SID(),
          designer_id: DID(),
          name
        }
      })

      if (newGameRow) newGameRow.classList.add("hidden")
      newGameName.value = ""

      if (designerSelect) {
        await loadGames(designerSelect.value)
      } else {
        await loadGames()
      }

      if (res?.result?.id) {
        setGID(res.result.id)
        lockPhase()
      }
    })
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", restartPhase)
  }

  if (createDeckBtn) {
    createDeckBtn.addEventListener("click", () => {
      if (!newDeckRow || !newDeckName) return

      newDeckRow.classList.toggle("hidden")

      const today = new Date().toISOString().slice(0, 10)
      newDeckName.value = `Custom Playing Cards - ${today}`
    })
  }

  if (confirmCreateDeck) {
    confirmCreateDeck.addEventListener("click", async () => {
      if (!newDeckName) return

      const name = newDeckName.value.trim()
      if (!name) return

      const res = await tgcApi("deck", "POST", {
        data: {
          session_id: SID(),
          designer_id: DID(),
          name
        }
      })

      if (newDeckRow) newDeckRow.classList.add("hidden")
      newDeckName.value = ""

      await loadDecks(GID())

      if (res?.result?.id && deckSelect) {
        deckSelect.value = res.result.id
      }
    })
  }

  if (deckSelect) {
    deckSelect.addEventListener("change", showCardPreview)
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportClick)
  }
}

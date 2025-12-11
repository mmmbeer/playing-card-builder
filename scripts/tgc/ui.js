import api from "./api.js";
import designers from "./designers.js";
import games from "./games.js";
import decks from "./decks.js";
import auth from "./auth.js";

function updateExportAvailability(dom) {
  const hasDeck =
    dom.deckSelect &&
    dom.deckSelect.options &&
    dom.deckSelect.options.length > 0 &&
    dom.deckSelect.value;

  dom.exportBtn.disabled = !hasDeck;
}

export default {
  init(dom, state, preview, exporter) {

    /* -----------------------------------------
       RESOLVE DOM REFERENCES
    ----------------------------------------- */
    dom.exportDoneLink     = document.getElementById("tgcExportDoneLink");
    dom.refreshPreviewsBtn = document.getElementById("tgcRefreshPreviews");

    /* Conflict modal elements */
    dom.conflictModal      = document.getElementById("tgcConflictModal");
    dom.conflictTitle      = document.getElementById("tgcConflictTitle");
    dom.conflictReplaceBtn = document.getElementById("tgcConflictReplace");
    dom.conflictSkipBtn    = document.getElementById("tgcConflictSkip");
    dom.conflictCopyBtn    = document.getElementById("tgcConflictCopy");

    /* Hide legacy completion link permanently */
    if (dom.exportDoneLink) {
      dom.exportDoneLink.classList.add("hidden");
    }

    /* ★ COLLISION MODE BADGE */
    dom.collisionBadge = document.getElementById("tgcCollisionSetting");
    state.collisionMode = "replace";

    /* -----------------------------------------
       AUTHENTICATION WORKFLOW
    ----------------------------------------- */
    auth.initAuth(() => {
      dom.loginPanel.classList.add("hidden");
      dom.exportPanel.classList.remove("hidden");

      designers.loadDesignersUI(dom, state).then(() =>
        games.loadGamesUI(dom, state, api.DID())
      );
    });

    dom.loginBtn.addEventListener("click", () => auth.startLogin());

    /* -----------------------------------------
       DESIGNER CHANGED
    ----------------------------------------- */
    dom.designerSelect.addEventListener("change", async () => {
      api.setDID(dom.designerSelect.value);
      api.setGID(null);
      await games.loadGamesUI(dom, state, dom.designerSelect.value);
    });

    /* -----------------------------------------
       GAME SEARCH FILTER
    ----------------------------------------- */
    dom.gameSearch.addEventListener("input", () => {
      const q = dom.gameSearch.value.trim().toLowerCase();
      const list = q
        ? state.games.filter(g => g.name.toLowerCase().includes(q))
        : state.games;

      dom.gameSelect.innerHTML = "";

      list.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = g.name;
        dom.gameSelect.appendChild(opt);
      });

      api.setGID(list.length ? list[0].id : null);
    });

    /* -----------------------------------------
       DOUBLE CLICK GAME → LOCK SELECTION
    ----------------------------------------- */
    dom.gameSelect.addEventListener("dblclick", () => {
      const gid = dom.gameSelect.value;
      if (!gid) return;
      api.setGID(gid);
      this.lock(dom, state, preview);
    });

    /* -----------------------------------------
       CREATE GAME
    ----------------------------------------- */
    dom.createGameBtn.addEventListener("click", () => {
      dom.newGameRow.classList.toggle("hidden");
      dom.newGameName.value = dom.gameSearch.value.trim();
    });

    dom.confirmCreateGame.addEventListener("click", async () => {
      const name = dom.newGameName.value.trim();
      if (!name) return;

      const created = await games.createGame(name);

      dom.newGameRow.classList.add("hidden");
      dom.newGameName.value = "";

      await games.loadGamesUI(dom, state, api.DID());

      if (created?.id) {
        api.setGID(created.id);
        this.lock(dom, state, preview);
      }
    });

    /* -----------------------------------------
       RETURN TO PHASE 1
    ----------------------------------------- */
    dom.restartBtn.addEventListener("click", () => {
      api.setGID(null);
      dom.phase2.classList.add("hidden");
      dom.phase1.classList.remove("hidden");
    });

    /* -----------------------------------------
       CREATE DECK
    ----------------------------------------- */
    dom.createDeckBtn.addEventListener("click", () => {
      dom.newDeckRow.classList.toggle("hidden");
      const today = new Date().toISOString().slice(0, 10);
      dom.newDeckName.value = `Custom Playing Cards - ${today}`;
    });

    dom.confirmCreateDeck.addEventListener("click", async () => {
      const name = dom.newDeckName.value.trim();
      if (!name) return;

      const created = await decks.createDeck(name);

      dom.newDeckRow.classList.add("hidden");
      dom.newDeckName.value = "";

      await decks.loadDecksUI(dom, state, api.GID());
      if (created?.id) dom.deckSelect.value = created.id;

      updateExportAvailability(dom);
    });

    /* -----------------------------------------
       DECK SELECTION → PREVIEW GRID
    ----------------------------------------- */
    dom.deckSelect.addEventListener("change", () => {
      preview.reset();
      preview.load();
      updateExportAvailability(dom);
    });

    /* -----------------------------------------
       REFRESH PREVIEW
    ----------------------------------------- */
    dom.refreshPreviewsBtn.addEventListener("click", () => {
      preview.reset();
      preview.load();
    });

    /* -----------------------------------------
       EXPORT BUTTON
    ----------------------------------------- */
    dom.exportBtn.addEventListener("click", () => {
      if (!dom.exportBtn.disabled) {
        exporter.start(dom, state);
      }
    });

    /* -----------------------------------------
       OPEN/CLOSE MODAL
    ----------------------------------------- */
    dom.openBtn.addEventListener("click", () =>
      this.open(dom, state, preview)
    );

    dom.closeBtn.addEventListener("click", () => this.close(dom));

    dom.modal.addEventListener("click", (e) => {
      if (e.target === dom.modal) this.close(dom);
    });

    /* -----------------------------------------
       CONFLICT MODAL BUTTONS
    ----------------------------------------- */
    dom.conflictReplaceBtn.addEventListener("click", () =>
      this.resolveConflict("replace")
    );

    dom.conflictSkipBtn.addEventListener("click", () =>
      this.resolveConflict("skip")
    );

    dom.conflictCopyBtn.addEventListener("click", () =>
      this.resolveConflict("copy")
    );

    /* -----------------------------------------
       ★ COLLISION MODE BADGE CLICK HANDLER
    ----------------------------------------- */
    dom.collisionBadge.addEventListener("click", () => {
      if (state.collisionMode === "replace") {
        state.collisionMode = "skip";
        dom.collisionBadge.textContent = "Skip Existing";
      } else if (state.collisionMode === "skip") {
        state.collisionMode = "copy";
        dom.collisionBadge.textContent = "Keep Both";
      } else {
        state.collisionMode = "replace";
        dom.collisionBadge.textContent = "Replace Existing";
      }
    });

    updateExportAvailability(dom);
  },

  /* ========================================================
     OPEN MODAL
  ======================================================== */
  open(dom, state, preview) {
    dom.modal.classList.remove("hidden");

    if (api.SID() && api.UID()) {
      dom.loginPanel.classList.add("hidden");
      dom.exportPanel.classList.remove("hidden");

      designers.loadDesignersUI(dom, state).then(async () => {
        await games.loadGamesUI(dom, state, api.DID());
        if (api.GID()) {
          this.lock(dom, state, preview);
        }
      });
    }
  },

  /* ========================================================
     CLOSE MODAL
  ======================================================== */
  close(dom) {
    dom.modal.classList.add("hidden");
  },

  /* ========================================================
     LOCK PHASE
  ======================================================== */
  lock(dom, state, preview) {
    const did = api.DID();
    const gid = api.GID();

    const designer = state.designers.find(d => d.id === did);
    const game = state.games.find(g => g.id === gid);

    dom.lockedInfo.textContent =
      `${designer?.name ?? "?"} | ${game?.name ?? "?"}`;

    dom.phase1.classList.add("hidden");
    dom.phase2.classList.remove("hidden");

    decks.loadDecksUI(dom, state, gid).then(() => {
      preview.reset();
      preview.load();

      updateExportAvailability(dom);

      if (!dom.deckSelect || dom.deckSelect.options.length === 0) {
        dom.newDeckRow.classList.remove("hidden");
        const today = new Date().toISOString().slice(0, 10);
        dom.newDeckName.value = `Custom Playing Cards - ${today}`;
        dom.newDeckName.focus();
      }
    });
  },

  /* ========================================================
     CONFLICT MODAL LOGIC
  ======================================================== */
  _conflictResolver: null,

  async promptCardConflict(cardName) {
    const modal = document.getElementById("tgcConflictModal");
    const title = document.getElementById("tgcConflictTitle");

    title.textContent = `Card Exists: ${cardName}`;
    modal.classList.remove("hidden");

    return new Promise(resolve => {
      this._conflictResolver = resolve;
    });
  },

  resolveConflict(answer) {
    const modal = document.getElementById("tgcConflictModal");

    modal.classList.add("hidden");

    if (this._conflictResolver) {
      this._conflictResolver(answer);
      this._conflictResolver = null;
    }
  }
};

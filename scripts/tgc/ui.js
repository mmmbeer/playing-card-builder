// scripts/tgc/ui.js
import api from "./api.js";
import designers from "./designers.js";
import games from "./games.js";
import decks from "./decks.js";
import auth from "./auth.js";

export default {
  init(dom, state, preview, exporter) {

    /* -----------------------------------------
       RESOLVE ALL DOM ELEMENTS FIRST
    ----------------------------------------- */
    dom.exportProgressContainer = document.getElementById("tgcExportProgressContainer");
    dom.exportProgressBar       = document.getElementById("tgcExportProgressBar");
    dom.exportDoneLink          = document.getElementById("tgcExportDoneLink");
    dom.cancelExportButton      = document.getElementById("tgcCancelExportButton");
    dom.refreshPreviewsBtn      = document.getElementById("tgcRefreshPreviews");

    /* -----------------------------------------
       AUTHENTICATION
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
       GAME SEARCH
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

      if (list.length) api.setGID(list[0].id);
      else api.setGID(null);
    });


    /* -----------------------------------------
       DOUBLE-CLICK A GAME → LOCK IN
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
    });


    /* -----------------------------------------
       CHANGE DECK → RELOAD PREVIEW
    ----------------------------------------- */
    dom.deckSelect.addEventListener("change", () => {
      preview.reset();
      preview.load();
    });


    /* -----------------------------------------
       REFRESH PREVIEW BUTTON
    ----------------------------------------- */
    dom.refreshPreviewsBtn.addEventListener("click", () => {
      preview.reset();
      preview.load();
    });


    /* -----------------------------------------
       EXPORT BUTTON
    ----------------------------------------- */
    dom.exportBtn.addEventListener("click", () => exporter.start(dom, state));


    /* -----------------------------------------
       CANCEL UPLOAD
    ----------------------------------------- */
    dom.cancelExportButton.addEventListener("click", () => exporter.cancel());


    /* -----------------------------------------
       OPEN/CLOSE MODAL
    ----------------------------------------- */
    dom.openBtn.addEventListener("click", () => this.open(dom, state, preview));
    dom.closeBtn.addEventListener("click", () => this.close(dom));

    dom.modal.addEventListener("click", (e) => {
      if (e.target === dom.modal) this.close(dom);
    });
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
     LOCK PHASE: Designer | Game → Show Deck UI
  ======================================================== */
  lock(dom, state, preview) {
    const did = api.DID();
    const gid = api.GID();

    const designer = state.designers.find(d => d.id === did);
    const game = state.games.find(g => g.id === gid);

    dom.lockedInfo.textContent = `${designer?.name ?? "?"} | ${game?.name ?? "?"}`;

    dom.phase1.classList.add("hidden");
    dom.phase2.classList.remove("hidden");

    decks.loadDecksUI(dom, state, gid).then(() => {
      preview.reset();
      preview.load();
    });
  }
};

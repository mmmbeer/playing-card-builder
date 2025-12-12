// scripts/tgc/decks.js
import api from "./api.js";
import { settings } from "../state.js";

async function fetchDecks(gameId) {
  const sid = api.SID();
  if (!sid || !gameId) return [];
  const res = await api.tgcApi(`game/${gameId}/decks`, "GET", {
    query: { session_id: sid }
  });
  if (!res || res.error) return [];
  const root = res.result || res;
  return root.items || root.decks || root.result || [];
}

async function loadDecksUI(dom, state, gameId) {
  const { deckSelect } = dom;
  const loader = dom.deckLoading;
  if (loader) loader.classList.remove("hidden");

  const decks = await fetchDecks(gameId);
  state.decks = decks;

  deckSelect.innerHTML = "";
  decks.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    deckSelect.appendChild(opt);
  });

  if (decks.length) deckSelect.value = decks[0].id;

  if (loader) loader.classList.add("hidden");
}

async function createDeck(name) {
  const res = await api.tgcApi("deck", "POST", {
    data: {
      session_id: api.SID(),
      designer_id: api.DID(),
      game_id: api.GID(),
      name,
      identity: settings.deckIdentity
    }
  });
  return res?.result || null;
}

export default {
  fetchDecks,
  loadDecksUI,
  createDeck
};

// scripts/tgc/games.js
import api from "./api.js";

async function fetchGames(designerId) {
  const sid = api.SID();
  if (!sid) return [];

  let did = designerId || api.DID();
  if (!did) {
    const uid = api.UID();
    if (!uid) return [];
    const userRes = await api.tgcApi(`user/${uid}`, "GET", {
      query: { session_id: sid, _include_relationships: 1 }
    });
    if (userRes?.error) return [];
    const user = userRes.result || userRes;
    if (!user.default_designer_id) return [];
    did = user.default_designer_id;
    api.setDID(did);
  }

  const all = [];
  let page = 1;

  while (true) {
    const res = await api.tgcApi(`designer/${did}/games`, "GET", {
      query: {
        session_id: sid,
        _items_per_page: 100,
        _page_number: page
      }
    });

    if (!res || res.error) break;

    const root = res.result || res;
    const items = root.items || root.games || [];
    if (!items.length) break;

    all.push(...items);

    const paging = root.paging || root.pager;
    if (!paging) break;

    const current = Number(paging.page_number) || page;
    const total = Number(paging.total_pages) || current;
    const next = Number(paging.next_page_number);

    if (current >= total || !next || next === current) break;

    page = next;
  }

  return all;
}

async function loadGamesUI(dom, state, designerId) {
  const { gameSelect, gameSearch } = dom;
  const games = await fetchGames(designerId);
  state.games = games;

  gameSelect.innerHTML = "";
  gameSearch.value = "";

  games.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    gameSelect.appendChild(opt);
  });

  const stored = api.GID();
  if (stored && games.some(g => g.id === stored)) {
    gameSelect.value = stored;
  } else if (games.length) {
    api.setGID(games[0].id);
    gameSelect.value = games[0].id;
  }
}

async function createGame(name) {
  const res = await api.tgcApi("game", "POST", {
    data: {
      session_id: api.SID(),
      designer_id: api.DID(),
      name
    }
  });
  return res?.result || null;
}

export default {
  fetchGames,
  loadGamesUI,
  createGame
};

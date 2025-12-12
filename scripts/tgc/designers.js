// scripts/tgc/designers.js
import api from "./api.js";

async function fetchDesigners() {
  const uid = api.UID();
  const sid = api.SID();
  if (!uid || !sid) return [];

  const res = await api.tgcApi(`user/${uid}`, "GET", {
    query: { session_id: sid, _include_relationships: 1 }
  });
  if (!res || res.error) return [];

  const user = res.result || res;
  const defaultId = user.default_designer_id || null;

  if (defaultId && !api.DID()) api.setDID(defaultId);

  let list = [];
  const rel = user._relationships?.designers;

  if (rel) {
    const path = rel.replace(/^\/?api\//, "");
    const dRes = await api.tgcApi(path, "GET", {
      query: { session_id: sid }
    });
    if (!dRes?.error) {
      const root = dRes.result || dRes;
      list = root.items || root.designers || root || [];
    }
  }

  if (!list.length && defaultId) {
    list = [{ id: defaultId, name: user.display_name || user.username || "Designer" }];
  }

  return list;
}

async function loadDesignersUI(dom, state) {
  const { designerSelect, phase1, phase2 } = dom;
  const loader = dom.designerLoading;
  if (loader) loader.classList.remove("hidden");

  const designers = await fetchDesigners();
  state.designers = designers;

  if (loader) loader.classList.add("hidden");

  phase1.classList.remove("hidden");
  phase2.classList.add("hidden");

  designerSelect.innerHTML = "";
  designers.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.name;
    designerSelect.appendChild(opt);
  });

  const stored = api.DID();
  if (stored && designers.some(d => d.id === stored)) {
    designerSelect.value = stored;
  } else if (designers.length) {
    api.setDID(designers[0].id);
    designerSelect.value = designers[0].id;
  }
}

export default {
  fetchDesigners,
  loadDesignersUI
};

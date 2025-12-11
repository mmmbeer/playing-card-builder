// scripts/tgc/api.js
const KEY_SID = "tgc_sid";
const KEY_UID = "tgc_uid";
const KEY_DID = "tgc_did";
const KEY_GID = "tgc_gid";

function get(k) { return localStorage.getItem(k); }
function set(k, v) { localStorage.setItem(k, v); }

async function tgcApi(path, method = "GET", options = {}) {
  const payload = { path, method: method.toUpperCase() };
  if (options.query) payload.query = options.query;
  if (options.data) payload.data = options.data;

  const res = await fetch("/playing-cards/api/tgc.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  try {
    return await res.json();
  } catch {
    return { error: { message: "Invalid JSON" } };
  }
}

export default {
  tgcApi,
  SID: () => get(KEY_SID),
  UID: () => get(KEY_UID),
  DID: () => get(KEY_DID),
  GID: () => get(KEY_GID),
  setSID: v => set(KEY_SID, v),
  setUID: v => set(KEY_UID, v),
  setDID: v => set(KEY_DID, v),
  setGID: v => set(KEY_GID, v)
};

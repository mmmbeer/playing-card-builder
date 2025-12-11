// scripts/tgc/auth.js
import api from "./api.js";

function startLogin() {
  const w = 600, h = 700;
  const left = (screen.width - w) / 2;
  const top = (screen.height - h) / 2;

  window.open(
    "/playing-cards/api/tgc.php?action=sso_start",
    "tgcLogin",
    `width=${w},height=${h},left=${left},top=${top}`
  );
}

function initAuth(onLoggedIn) {
  window.addEventListener("message", e => {
    if (!e.data || e.data.type !== "tgc-auth") return;

    const { session_id, user_id } = e.data;
    if (!session_id || !user_id) return;

    api.setSID(session_id);
    api.setUID(user_id);
    api.setDID(null);
    api.setGID(null);

    onLoggedIn();
  });
}

export default {
  startLogin,
  initAuth
};

const SKIP_KEY = 'tutorial:skip';
const SEEN_KEY = 'tutorial:seen';

function getBool(key) {
  try {
    return localStorage.getItem(key) === 'true';
  } catch (err) {
    return false;
  }
}

function setBool(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch (err) {
    /* ignore */
  }
}

export function shouldAutoStart() {
  return !getBool(SKIP_KEY) && !getBool(SEEN_KEY);
}

export function markSeen() {
  setBool(SEEN_KEY, true);
}

export function setSkipPreference(skip) {
  setBool(SKIP_KEY, !!skip);
}

export function isSkipPreferred() {
  return getBool(SKIP_KEY);
}

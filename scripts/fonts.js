// ----------------------------------------------------------
// fonts.js  —  Google Fonts Browser (Lazy Loading, Debounced Search)
// ----------------------------------------------------------

import { settings, activeRanks } from './state.js';

// Google Fonts metadata (no API key)
const GOOGLE_FONTS_JSON =
  "https://raw.githubusercontent.com/jonathantneal/google-fonts-complete/master/google-fonts.json";

let googleFontsData = null;
let modal, closeBtn, list, searchBox;

// lazy load: 100 at a time
let visibleFonts = 0;
const CHUNK = 100;

// debounce timer
let searchTimer = null;

// ----------------------------------------------------------
// Load Google Fonts metadata once
// ----------------------------------------------------------
async function loadFontMetadata() {
  if (googleFontsData) return googleFontsData;
  const res = await fetch(GOOGLE_FONTS_JSON);
  googleFontsData = await res.json();
  return googleFontsData;
}

// ----------------------------------------------------------
// Insert <link> for the chosen font family
// ----------------------------------------------------------
export function injectFontFamily(family) {
  const encoded = family.replace(/ /g, "+");
  const href =
    `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;500;700&display=swap`;

  const exists = [...document.styleSheets].some(
    sheet => sheet.href && sheet.href.includes(encoded)
  );
  if (exists) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// ----------------------------------------------------------
// Render the FIRST chunk (clears existing)
// ----------------------------------------------------------
async function renderFontList(dom, filter = "") {
  list.innerHTML = "";
  visibleFonts = 0;
  await renderMoreFonts(dom, filter);
}

// ----------------------------------------------------------
// Render the NEXT chunk (infinite scroll)
// ----------------------------------------------------------
async function renderMoreFonts(dom, filter = "") {
  const entries = Object.entries(await loadFontMetadata());

  const filtered = filter
    ? entries.filter(([name]) =>
        name.toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  const slice = filtered.slice(visibleFonts, visibleFonts + CHUNK);
  if (slice.length === 0) return;

  visibleFonts += CHUNK;

  slice.forEach(([family, meta]) => {
    let previewUrl = null;
    const rankPreview = activeRanks.join(" ");

    // Try normal 400 woff2
    if (meta.variants?.normal?.["400"]?.url?.woff2) {
      previewUrl = meta.variants.normal["400"].url.woff2;
    } else {
      const normal = meta.variants?.normal;
      if (normal) {
        const first = Object.keys(normal)[0];
        previewUrl = normal[first]?.url?.woff2 || null;
      }
    }

    // Preload preview font
    if (previewUrl) {
      const ff = new FontFace(family, `url(${previewUrl})`);
      ff.load().then(f => document.fonts.add(f)).catch(() => {});
    }

    // UI item
    const item = document.createElement("div");
    item.className = "font-item";
    item.style.padding = "10px 12px";
    item.style.cursor = "pointer";
    item.style.borderBottom = "1px solid #e5e5e5";

    item.innerHTML = `
      <div style="font-family:'${family}', sans-serif; font-size:20px; font-weight:600;">
        ${family}
        ( <span style="font-family:'${family}', sans-serif; font-size:15px; opacity:0.75;">
          ${rankPreview}
        </span> )
      </div>
    `;

    // ON CLICK
    item.onclick = () => {
      settings.fontFamily = family;

      // Notify fontControls
      document.dispatchEvent(
        new CustomEvent("fontFamilySelected", { detail: family })
      );

      // Update UI (same dom object fontControls receives)
      if (dom.fontFamilyInput) {
        dom.fontFamilyInput.textContent = family;
      }

      injectFontFamily(family);

      // Reliable font activation polling for canvas
      const testString = "HamburgefonsABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const fallback = "Arial";
      const size = 48;

      const can = document.createElement("canvas");
      const ctxTest = can.getContext("2d");

      ctxTest.font = `${size}px ${fallback}`;
      const fallbackWidth = ctxTest.measureText(testString).width;

      let tries = 0;

      function poll() {
        ctxTest.font = `${size}px "${family}", ${fallback}`;
        const newWidth = ctxTest.measureText(testString).width;

        if (newWidth !== fallbackWidth || tries > 50) {
          modal.classList.add("hidden");

          if (window.renderCurrentCard) {
            window.renderCurrentCard();
            requestAnimationFrame(() => window.renderCurrentCard());
          }
          return;
        }

        tries++;
        setTimeout(poll, 50);
      }

      poll();
    };

    list.appendChild(item);
  });
}

// ----------------------------------------------------------
// PUBLIC: open modal
// ----------------------------------------------------------
export async function openFontBrowser(dom) {
  modal.classList.remove("hidden");

  if (!googleFontsData) {
    await loadFontMetadata();
  }

  searchBox.value = "";
  list.scrollTop = 0;
  await renderFontList(dom, "");
  searchBox.focus();
}

// ----------------------------------------------------------
// PUBLIC: init modal wiring (takes domRefs from index.js)
// ----------------------------------------------------------
export function initFontBrowser(dom) {
  modal = document.getElementById("fontModal");
  closeBtn = document.getElementById("closeFontModal");
  list = document.getElementById("fontList");
  searchBox = document.getElementById("fontSearch");

  // Close via "X"
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // Debounced search
  searchBox.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      list.scrollTop = 0;
      renderFontList(dom, searchBox.value);
    }, 180);
  });

  // Infinite scroll
  list.addEventListener("scroll", () => {
    const bottom = list.scrollTop + list.clientHeight;
    if (bottom >= list.scrollHeight - 40) {
      renderMoreFonts(dom, searchBox.value);
    }
  });

  // Close on ESC
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });

  // Close when clicking backdrop
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

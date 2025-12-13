const HELP_TOPICS = [
  { id: "index", title: "Help index", file: "docs/index.md" },
  { id: "face-images", title: "Face images and bulk upload", file: "docs/face-images.md" },
  { id: "font-options", title: "Rank and index fonts", file: "docs/font-options.md" },
  { id: "suit-icons", title: "Suit icons and custom sheets", file: "docs/suit-icons.md" },
  { id: "center-pips", title: "Center pip controls", file: "docs/center-pips.md" },
  { id: "custom-decks", title: "Decks, ranks, and jokers", file: "docs/custom-decks.md" },
  { id: "layout-global-options", title: "Layout and global options", file: "docs/layout-global-options.md" },
  { id: "export-options", title: "Exporting cards", file: "docs/export-options.md" },
  { id: "game-crafter", title: "Publish with The Game Crafter", file: "docs/game-crafter.md" },
  { id: "glossary", title: "Glossary", file: "docs/glossary.md" }
];

const GLOSSARY = [
  { term: "safe zone", definition: "The printable interior area that keeps art and text away from trimming." },
  { term: "bleed", definition: "Extra art past the trim line that avoids white edges after cutting." },
  { term: "pip", definition: "A suit symbol used in the center layout and in the corners." },
  { term: "bulk upload", definition: "A batch upload that maps many face images to suits and ranks." },
  { term: "icon sheet", definition: "A 2×2 sprite sheet that stores suit symbols." },
  { term: "mirror corners", definition: "Copies the top-left rank and suit into the bottom-right corner." },
  { term: "corner spacing", definition: "Rank and suit offset controls for precise index placement." },
  { term: "overlay", definition: "A glow or shadow effect applied to fonts or icons." },
  { term: "outline", definition: "A stroke around text or icons." },
  { term: "wild joker", definition: "A joker flagged as wild to remind players during play." }
];

let modal;
let closeBtn;
let helpButton;
let contentEl;
let topicListEl;
let modalTitleEl;
let tooltipEl;
let activeTopicId = "index";

const glossaryMap = new Map(GLOSSARY.map(entry => [entry.term.toLowerCase(), entry]));
const glossaryPatternSource = GLOSSARY.map(entry => escapeRegExp(entry.term)).join("|");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderMarkdown(markdown) {
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(markdown, { mangle: false, headerIds: false });
  }

  return markdown
    .split("\n\n")
    .map(block => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function buildTopicList() {
  if (!topicListEl) return;

  topicListEl.innerHTML = "";
  HELP_TOPICS.forEach(topic => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "help-topic";
    button.dataset.topicId = topic.id;
    button.textContent = topic.title;
    button.addEventListener("click", () => loadTopic(topic.id));
    topicListEl.appendChild(button);
  });
}

async function loadTopic(topicId = "index") {
  const topic = HELP_TOPICS.find(entry => entry.id === topicId) || HELP_TOPICS[0];
  activeTopicId = topic.id;

  highlightActiveTopic();
  updateModalTitle(topic.title);

  try {
    const response = await fetch(topic.file);
    if (!response.ok) {
      throw new Error(`Help file missing: ${topic.file}`);
    }

    const markdown = await response.text();
    const html = renderMarkdown(markdown);
    contentEl.innerHTML = html;
    applyGlossaryHighlights(contentEl);
    contentEl.scrollTop = 0;
  } catch (err) {
    contentEl.innerHTML = `<p class="help-error">${err.message}</p>`;
  }
}

function highlightActiveTopic() {
  const buttons = topicListEl?.querySelectorAll(".help-topic") || [];
  buttons.forEach(btn => {
    if (btn.dataset.topicId === activeTopicId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function updateModalTitle(title) {
  if (modalTitleEl) {
    modalTitleEl.textContent = title || "Help";
  }
}

function openHelp(topicId = "index") {
  if (!modal) return;
  modal.classList.remove("hidden");
  loadTopic(topicId);
}

function closeHelp() {
  if (!modal) return;
  modal.classList.add("hidden");
}

function handleLinkClicks(event) {
  const anchor = event.target.closest("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href") || "";
  if (href.startsWith("help:")) {
    event.preventDefault();
    const targetId = href.replace("help:", "");
    loadTopic(targetId);
  } else if (href.startsWith("tutorial:")) {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tutorial:start", { detail: { manual: true } }));
    closeHelp();
  }
}

function applyGlossaryHighlights(container) {
  if (!glossaryPatternSource) return;
  const regex = new RegExp(`\\b(${glossaryPatternSource})\\b`, "gi");
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentNode;
        if (!parent || parent.closest(".glossary-term")) return NodeFilter.FILTER_REJECT;
        const parentTag = parent.nodeName.toLowerCase();
        if (parentTag === "code" || parentTag === "pre" || parentTag === "a") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(textNode => {
    const text = textNode.nodeValue;
    regex.lastIndex = 0;
    if (!regex.test(text)) return;
    const localRegex = new RegExp(`\\b(${glossaryPatternSource})\\b`, "gi");
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = localRegex.exec(text)) !== null) {
      const start = match.index;
      const matchedText = match[0];
      const key = matchedText.toLowerCase();
      const entry = glossaryMap.get(key);

      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }

      const span = document.createElement("span");
      span.className = "glossary-term";
      span.dataset.term = entry?.term || matchedText;
      span.dataset.definition = entry?.definition || "";
      span.textContent = matchedText;
      frag.appendChild(span);
      lastIndex = start + matchedText.length;
    }

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(frag);
  });
}

function attachTooltipHandlers() {
  if (!contentEl) return;

  tooltipEl = document.createElement("div");
  tooltipEl.id = "glossaryTooltip";
  document.body.appendChild(tooltipEl);

  contentEl.addEventListener("mouseover", event => {
    const termEl = event.target.closest(".glossary-term");
    if (!termEl) return;
    showTooltip(termEl.dataset.definition || "", event.clientX, event.clientY);
  });

  contentEl.addEventListener("mousemove", event => {
    if (!tooltipEl.classList.contains("visible")) return;
    showTooltip(tooltipEl.textContent, event.clientX, event.clientY);
  });

  contentEl.addEventListener("mouseout", event => {
    const related = event.relatedTarget;
    if (related && related.closest && related.closest(".glossary-term")) return;
    hideTooltip();
  });
}

function showTooltip(text, x, y) {
  if (!tooltipEl) return;
  tooltipEl.textContent = text;
  tooltipEl.style.left = `${x + 14}px`;
  tooltipEl.style.top = `${y + 12}px`;
  tooltipEl.classList.add("visible");
}

function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove("visible");
}

export function initHelp() {
  modal = document.getElementById("helpModal");
  closeBtn = document.getElementById("closeHelpModal");
  helpButton = document.getElementById("helpLauncher");
  contentEl = document.getElementById("helpContent");
  topicListEl = document.getElementById("helpTopicList");
  modalTitleEl = document.getElementById("helpModalTitle");

  if (!modal || !helpButton || !contentEl || !topicListEl) return;

  buildTopicList();
  attachTooltipHandlers();

  helpButton.addEventListener("click", () => openHelp("index"));
  closeBtn?.addEventListener("click", closeHelp);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeHelp();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeHelp();
    }
  });

  contentEl.addEventListener("click", handleLinkClicks);
}

const SUIT_MAP = {
  suit: '♠',
  spade: '♠',
  spades: '♠',
  heart: '♥',
  hearts: '♥',
  club: '♣',
  clubs: '♣',
  diamond: '♦',
  diamonds: '♦'
};

function replaceSuitTokens(text) {
  return text.replace(/::(suit|spades?|hearts?|clubs?|diamonds?)::/gi, (_, key) => {
    const symbol = SUIT_MAP[key.toLowerCase()] || '♠';
    return `<span class="tutorial-pip" data-suit="${key.toLowerCase()}">${symbol}</span>`;
  });
}

function fallbackMarkdown(markdown) {
  return markdown
    .split('\n\n')
    .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

export function renderTutorialMarkdown(markdown) {
  const text = markdown || '';
  if (window.marked && typeof window.marked.parse === 'function') {
    const html = window.marked.parse(text, { mangle: false, headerIds: false });
    return replaceSuitTokens(html);
  }

  return replaceSuitTokens(fallbackMarkdown(text));
}

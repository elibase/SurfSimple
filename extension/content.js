// content.js — runs in the page isolated world
// Depends on lib/elementScanner.js and lib/highlighter.js loaded first.
// Responsibilities:
//   1. Build element registry and post to background worker
//   2. Inject highlight overlays on command from background worker

let _debounceTimer = null;
let _lastUrl = location.href;

// --- Message handler ---

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CLEAR_HIGHLIGHT') {
    clearHighlight();
    sendResponse({ ok: true });
    return;
  }

  if (message.type !== 'HIGHLIGHT') return;

  const el = _findElement(message.label);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showHighlight(el, message.label);
    sendResponse({ found: true });
  } else {
    sendResponse({ found: false });
    _safeSend({ type: 'HIGHLIGHT_NOT_FOUND', label: message.label });
  }
});

// --- Fuzzy element lookup ---

function _findElement(label) {
  const registry = buildRegistry();
  const lower = label.toLowerCase();
  const allEls = Array.from(document.querySelectorAll(INTERACTIVE_SELECTORS));

  // Exact label match
  let hit = registry.find(
    (r) => r.label.toLowerCase() === lower || r.text.toLowerCase() === lower
  );
  if (hit) return allEls[hit.index];

  // Substring match
  hit = registry.find(
    (r) => r.label.toLowerCase().includes(lower) || r.text.toLowerCase().includes(lower)
  );
  if (hit) return allEls[hit.index];

  return null;
}

// --- Safe send — swallows both sync throws and async rejections ---
// chrome.runtime.sendMessage throws synchronously when the extension context
// is invalidated (e.g. after a reload), so .catch() alone is not enough.

function _safeSend(message) {
  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch {
    // Context invalidated — content script will be replaced on next navigation
  }
}

// --- Registry posting ---

function _postRegistry() {
  const registry = buildRegistry();
  const text = extractPageText();
  _safeSend({ type: 'REGISTRY_UPDATE', registry, pageText: text, url: location.href });
}

// --- SPA navigation & DOM mutation ---

function _schedulePost() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(_postRegistry, 300);
}

const _observer = new MutationObserver(_schedulePost);

function _init() {
  _postRegistry();

  _observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  // Intercept history.pushState for SPA navigation
  const _origPush = history.pushState.bind(history);
  history.pushState = function (...args) {
    _origPush(...args);
    _schedulePost();
  };
  window.addEventListener('popstate', _schedulePost);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _init);
} else {
  _init();
}

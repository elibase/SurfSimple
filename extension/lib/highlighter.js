// Loaded before content.js via manifest content_scripts array.
// Defines showHighlight() and clearHighlight() in the content script scope.

const HIGHLIGHT_CLASS = 'surfsimple-highlight';
const TOOLTIP_CLASS = 'surfsimple-tooltip';
const HIGHLIGHT_DURATION_MS = 8000;

let _highlightEl = null;
let _tooltipEl = null;
let _dismissTimer = null;

function _injectHighlightStyles() {
  if (document.getElementById('surfsimple-styles')) return;
  const style = document.createElement('style');
  style.id = 'surfsimple-styles';
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #1a6fc4 !important;
      box-shadow: 0 0 0 6px rgba(26,111,196,0.25) !important;
      animation: surfsimple-pulse 1.2s ease-in-out infinite !important;
      position: relative !important;
      z-index: 2147483640 !important;
    }
    @keyframes surfsimple-pulse {
      0%, 100% { box-shadow: 0 0 0 6px rgba(26,111,196,0.25); }
      50%       { box-shadow: 0 0 0 12px rgba(26,111,196,0.10); }
    }
    .${TOOLTIP_CLASS} {
      position: absolute;
      background: #1a6fc4;
      color: #fff;
      font-size: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 6px 12px;
      border-radius: 6px;
      white-space: nowrap;
      z-index: 2147483647;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      line-height: 1.4;
    }
    .${TOOLTIP_CLASS}::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 16px;
      border: 6px solid transparent;
      border-top-color: #1a6fc4;
    }
  `;
  document.head.appendChild(style);
}

function showHighlight(element, label) {
  clearHighlight();
  _injectHighlightStyles();

  _highlightEl = element;
  element.classList.add(HIGHLIGHT_CLASS);

  _tooltipEl = document.createElement('div');
  _tooltipEl.className = TOOLTIP_CLASS;
  _tooltipEl.textContent = label;
  document.body.appendChild(_tooltipEl);

  // Position tooltip above element
  const rect = element.getBoundingClientRect();
  const topAbs = rect.top + window.scrollY;
  const tooltipTop = Math.max(window.scrollY + 4, topAbs - 48);
  _tooltipEl.style.top = `${tooltipTop}px`;
  _tooltipEl.style.left = `${rect.left + window.scrollX}px`;

  element.addEventListener('click', clearHighlight, { once: true });
  _dismissTimer = setTimeout(clearHighlight, HIGHLIGHT_DURATION_MS);
}

function clearHighlight() {
  if (_highlightEl) {
    _highlightEl.classList.remove(HIGHLIGHT_CLASS);
    _highlightEl = null;
  }
  if (_tooltipEl) {
    _tooltipEl.remove();
    _tooltipEl = null;
  }
  if (_dismissTimer) {
    clearTimeout(_dismissTimer);
    _dismissTimer = null;
  }
}

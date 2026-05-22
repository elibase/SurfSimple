// Loaded before content.js via manifest content_scripts array.
// Defines buildRegistry() and extractPageText() in the content script scope.

const INTERACTIVE_SELECTORS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function deriveLabel(el) {
  const text = el.innerText?.trim();
  if (text && text.length <= 120) return text;
  const aria = el.getAttribute('aria-label')?.trim();
  if (aria) return aria;
  const placeholder = el.getAttribute('placeholder')?.trim();
  if (placeholder) return placeholder;
  const title = el.getAttribute('title')?.trim();
  if (title) return title;
  const alt = el.querySelector('img')?.getAttribute('alt')?.trim();
  if (alt) return alt;
  return `[${el.getAttribute('role') || el.tagName.toLowerCase()}]`;
}

function buildRegistry() {
  const elements = Array.from(document.querySelectorAll(INTERACTIVE_SELECTORS));
  const seen = new Set();

  return elements
    .filter((el) => {
      if (seen.has(el)) return false;
      seen.add(el);
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        el.offsetParent !== null
      );
    })
    .map((el, index) => {
      const rect = el.getBoundingClientRect();
      return {
        index,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        text: el.innerText?.trim().slice(0, 200) || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        placeholder: el.getAttribute('placeholder') || '',
        label: deriveLabel(el),
        boundingRect: {
          top: Math.round(rect.top + window.scrollY),
          left: Math.round(rect.left + window.scrollX),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };
    });
}

function extractPageText() {
  const source =
    document.querySelector('article, main, [role="main"]') || document.body;
  return source.innerText?.trim().slice(0, 8000) || '';
}

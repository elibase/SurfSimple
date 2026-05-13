import { summarise, ask } from './lib/gemmaProxy.js';
import { textToSpeech } from './lib/elevenlabs.js';

// In-memory state — cleared on service worker restart
let elementRegistry = [];
let pageText = '';
let currentUrl = '';

const RESTRICTED_PREFIXES = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];

function isRestrictedUrl(url) {
  if (!url) return false;
  return RESTRICTED_PREFIXES.some((p) => url.startsWith(p));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Notify side panel when user switches to a restricted tab
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isRestrictedUrl(tab.url)) {
      chrome.runtime.sendMessage({ type: 'RESTRICTED_PAGE' }).catch(() => {});
    }
  } catch { /* tab may have closed */ }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && isRestrictedUrl(tab.url)) {
    chrome.runtime.sendMessage({ type: 'RESTRICTED_PAGE' }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'REGISTRY_UPDATE':
      elementRegistry = message.registry || [];
      pageText = message.pageText || pageText;
      if (message.url && message.url !== currentUrl) {
        currentUrl = message.url;
        notifyPageChanged();
        checkAutoSummarise();
        checkHighlightOnNav();
      }
      sendResponse({ ok: true });
      break;

    case 'PAGE_TEXT':
      pageText = message.text;
      sendResponse({ ok: true });
      break;

    case 'SUMMARISE':
      sendResponse({ ok: true });
      handleSummarise();
      break;

    case 'USER_PROMPT':
      sendResponse({ ok: true });
      handleUserPrompt(message.prompt);
      break;

    case 'HIGHLIGHT':
      dispatchHighlight(message.label);
      sendResponse({ ok: true });
      break;

    case 'CLEAR_HIGHLIGHT':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_HIGHLIGHT' }).catch(() => {});
      });
      sendResponse({ ok: true });
      break;

    case 'GET_SETTINGS':
      chrome.storage.local.get(
        ['elevenLabsKey', 'voiceId', 'voiceSpeed', 'autoSummarise', 'highlightOnNav', 'fontSize', 'proxyUrlOverride'],
        (settings) => sendResponse(settings)
      );
      return true;

    case 'SET_SETTINGS':
      chrome.storage.local.set(message.settings, () => sendResponse({ ok: true }));
      return true;
  }
});

async function handleSummarise() {
  const summary = await summarise(pageText);
  chrome.runtime.sendMessage({ type: 'SUMMARY_RESULT', summary }).catch(() => {});
  callTTS(summary);
}

async function handleUserPrompt(prompt) {
  const result = await ask(prompt, pageText, elementRegistry);
  if (result.highlightLabel) dispatchHighlight(result.highlightLabel);
  chrome.runtime.sendMessage({ type: 'PROMPT_RESULT', answer: result.answer }).catch(() => {});
  callTTS(result.answer);
}

async function callTTS(text) {
  const { elevenLabsKey, voiceId, voiceSpeed } = await chrome.storage.local.get(['elevenLabsKey', 'voiceId', 'voiceSpeed']);
  if (elevenLabsKey) {
    const audioBase64 = await textToSpeech(text, elevenLabsKey, voiceId, voiceSpeed || 1.0);
    if (audioBase64) {
      chrome.runtime.sendMessage({ type: 'PLAY_AUDIO', audioBase64 }).catch(() => {});
      return;
    }
  }
  // ElevenLabs unavailable — fall back to browser speech synthesis in the side panel
  chrome.runtime.sendMessage({ type: 'SPEAK_TEXT', text }).catch(() => {});
}

async function checkAutoSummarise() {
  const { autoSummarise } = await chrome.storage.local.get('autoSummarise');
  if (autoSummarise) handleSummarise();
}

async function checkHighlightOnNav() {
  const { highlightOnNav } = await chrome.storage.local.get('highlightOnNav');
  if (!highlightOnNav || elementRegistry.length === 0) return;

  // Pick up to 3 elements with meaningful labels (skip generic [button] / [a] placeholders)
  const targets = elementRegistry
    .filter((el) => el.label && !el.label.startsWith('[') && el.label.trim().length > 2)
    .slice(0, 3);

  if (targets.length === 0) return;

  // Short delay to let the page settle, then highlight each element in sequence
  setTimeout(() => {
    targets.forEach((el, i) => setTimeout(() => dispatchHighlight(el.label), i * 3500));
  }, 800);
}

function dispatchHighlight(label) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT', label });
  });
}

function notifyPageChanged() {
  chrome.runtime.sendMessage({ type: 'PAGE_CHANGED', registry: elementRegistry, pageText }).catch(() => {});
}

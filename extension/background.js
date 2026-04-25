import { summarise, ask } from './lib/gemmaProxy.js';

// In-memory state — cleared on service worker restart
let elementRegistry = [];
let pageText = '';
let currentUrl = '';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
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

    case 'GET_SETTINGS':
      chrome.storage.local.get(
        ['elevenLabsKey', 'voiceSpeed', 'autoSummarise', 'highlightOnNav', 'fontSize', 'proxyUrlOverride'],
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
}

async function handleUserPrompt(prompt) {
  const result = await ask(prompt, pageText, elementRegistry);
  if (result.highlightLabel) dispatchHighlight(result.highlightLabel);
  chrome.runtime.sendMessage({ type: 'PROMPT_RESULT', answer: result.answer }).catch(() => {});
}

async function checkAutoSummarise() {
  const { autoSummarise } = await chrome.storage.local.get('autoSummarise');
  if (autoSummarise) handleSummarise();
}

function dispatchHighlight(label) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT', label });
  });
}

function notifyPageChanged() {
  chrome.runtime.sendMessage({ type: 'PAGE_CHANGED', registry: elementRegistry, pageText }).catch(() => {});
}

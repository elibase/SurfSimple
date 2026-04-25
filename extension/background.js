// In-memory state — cleared on service worker restart
let elementRegistry = [];
let pageText = '';
let currentUrl = '';

chrome.runtime.onInstalled.addListener(() => {
  // Open side panel when user clicks the toolbar button
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
      }
      sendResponse({ ok: true });
      break;

    case 'PAGE_TEXT':
      pageText = message.text;
      sendResponse({ ok: true });
      break;

    case 'USER_PROMPT':
      // Stub — real Gemma call added in Milestone 2
      sendResponse({
        answer: `[Stub] You asked: "${message.prompt}"\n\nGemma AI integration coming in Milestone 2.`,
        highlightLabel: null,
      });
      break;

    case 'SUMMARISE':
      // Stub — real Gemma call added in Milestone 2
      notifySummaryResult('[Stub] Page summary will appear here once the proxy server is connected (Milestone 2).');
      sendResponse({ ok: true });
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
      return true; // async response

    case 'SET_SETTINGS':
      chrome.storage.local.set(message.settings, () => sendResponse({ ok: true }));
      return true; // async response
  }
});

function dispatchHighlight(label) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'HIGHLIGHT', label });
    }
  });
}

function notifySummaryResult(summary) {
  chrome.runtime.sendMessage({ type: 'SUMMARY_RESULT', summary }).catch(() => {});
}

function notifyPageChanged() {
  chrome.runtime.sendMessage({
    type: 'PAGE_CHANGED',
    registry: elementRegistry,
    pageText,
  }).catch(() => {});
}

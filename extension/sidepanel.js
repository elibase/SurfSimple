// sidepanel.js — side panel UI controller
// Voice session (ElevenLabs WebSocket) will be added here in Milestone 3.

// ── DOM refs ──
const summaryText   = document.getElementById('summaryText');
const responseArea  = document.getElementById('responseArea');
const spinner       = document.getElementById('spinner');
const promptInput   = document.getElementById('promptInput');
const askBtn        = document.getElementById('askBtn');
const summariseBtn  = document.getElementById('summariseBtn');
const micBtn        = document.getElementById('micBtn');
const settingsBtn   = document.getElementById('settingsBtn');
const errorBanner   = document.getElementById('errorBanner');

// ── Settings ──
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Summarise ──
summariseBtn.addEventListener('click', () => {
  setLoading(true);
  chrome.runtime.sendMessage({ type: 'SUMMARISE' });
  // Result arrives via onMessage SUMMARY_RESULT
});

// ── Ask ──
askBtn.addEventListener('click', sendPrompt);
promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) sendPrompt();
});

function sendPrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  promptInput.value = '';
  hideError();
  setLoading(true);
  responseArea.textContent = '';

  chrome.runtime.sendMessage({ type: 'USER_PROMPT', prompt }, (response) => {
    setLoading(false);
    if (chrome.runtime.lastError) {
      showError('Could not reach the assistant. Please try again.');
      return;
    }
    if (response?.answer) {
      responseArea.textContent = response.answer;
    }
  });
}

// ── Mic (stub for Milestone 1) ──
micBtn.addEventListener('click', () => {
  responseArea.textContent = 'Voice input will be available soon. For now, type your question below.';
});

// ── Background messages ──
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SUMMARY_RESULT':
      setLoading(false);
      summaryText.textContent = message.summary;
      break;

    case 'PAGE_CHANGED':
      // Fresh page — reset displayed content
      summaryText.textContent = 'Press "Summarise this page" to get an overview.';
      responseArea.textContent = 'Ask a question below to get help navigating this page.';
      hideError();
      break;

    case 'HIGHLIGHT_NOT_FOUND':
      responseArea.textContent += `\n\nCouldn't find "${message.label}" on this page.`;
      break;
  }
});

// ── Helpers ──
function setLoading(on) {
  spinner.classList.toggle('hidden', !on);
  askBtn.disabled = on;
  summariseBtn.disabled = on;
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.add('visible');
}

function hideError() {
  errorBanner.classList.remove('visible');
}

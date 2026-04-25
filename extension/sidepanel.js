// sidepanel.js — side panel UI controller
// Voice session (ElevenLabs WebSocket) will be added here in Milestone 3.

// ── DOM refs ──
const summaryText  = document.getElementById('summaryText');
const responseArea = document.getElementById('responseArea');
const spinner      = document.getElementById('spinner');
const promptInput  = document.getElementById('promptInput');
const askBtn       = document.getElementById('askBtn');
const summariseBtn = document.getElementById('summariseBtn');
const micBtn       = document.getElementById('micBtn');
const settingsBtn  = document.getElementById('settingsBtn');
const errorBanner  = document.getElementById('errorBanner');

// ── Apply font size preference ──
chrome.storage.local.get('fontSize', ({ fontSize }) => {
  const sizes = { medium: '18px', large: '22px', xlarge: '26px' };
  document.documentElement.style.setProperty('--font-base', sizes[fontSize] || '18px');
});

// ── Settings ──
settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

// ── Summarise ──
summariseBtn.addEventListener('click', () => {
  setLoading(true);
  hideError();
  chrome.runtime.sendMessage({ type: 'SUMMARISE' });
  // Result arrives via SUMMARY_RESULT message
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
    if (chrome.runtime.lastError || !response?.ok) {
      setLoading(false);
      showError('Could not reach the assistant. Please try again.');
    }
    // Answer arrives via PROMPT_RESULT message
  });
}

// ── Mic (stub — Milestone 3) ──
micBtn.addEventListener('click', () => {
  responseArea.textContent = 'Voice input will be available soon. Type your question below for now.';
});

// ── Background messages ──
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'SUMMARY_RESULT':
      setLoading(false);
      summaryText.textContent = message.summary;
      break;

    case 'PROMPT_RESULT':
      setLoading(false);
      responseArea.textContent = message.answer;
      break;

    case 'PAGE_CHANGED':
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

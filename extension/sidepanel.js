import { getSignedUrl } from './lib/elevenlabs.js';

// ── Page context (updated on PAGE_CHANGED) ──
let currentRegistry = [];
let currentPageText = '';

// ── Offline state ──
let isOffline = !navigator.onLine;

window.addEventListener('offline', () => {
  isOffline = true;
  showError('No internet connection — AI features are unavailable.');
  askBtn.disabled = true;
  summariseBtn.disabled = true;
});

window.addEventListener('online', () => {
  isOffline = false;
  hideError();
  askBtn.disabled = false;
  summariseBtn.disabled = false;
});

// ── Escape key — clear active highlight ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    chrome.runtime.sendMessage({ type: 'CLEAR_HIGHLIGHT' }).catch(() => {});
  }
});

// ── Voice session state ──
let ws = null;
let micStream = null;
let audioCtx = null;
let processor = null;
let nextPlayTime = 0;
let sessionActive = false;
let reconnectTimer = null;

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
const ttsAudio     = document.getElementById('ttsAudio');

// ── Apply font size preference ──
chrome.storage.local.get('fontSize', ({ fontSize }) => {
  const sizes = { medium: '18px', large: '22px', xlarge: '26px' };
  document.documentElement.style.setProperty('--font-base', sizes[fontSize] || '18px');
});

// ── Check if current tab is a restricted page on load ──
const RESTRICTED_PREFIXES = ['chrome://', 'chrome-extension://', 'about:', 'edge://'];

function _isRestrictedUrl(url) {
  if (!url) return false;
  return RESTRICTED_PREFIXES.some((p) => url.startsWith(p));
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && _isRestrictedUrl(tabs[0].url)) {
    summaryText.textContent = 'SurfSimple cannot run on this page.';
    responseArea.textContent = 'Navigate to a regular website to use SurfSimple.';
    summariseBtn.disabled = true;
    askBtn.disabled = true;
  }
});

// ── ElevenLabs key tip ──
chrome.storage.local.get('elevenLabsKey', ({ elevenLabsKey }) => {
  if (!elevenLabsKey) {
    responseArea.textContent = 'Tip: Add an ElevenLabs API key in Settings for AI voice responses.';
  }
});

// ── Settings ──
settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

// ── Summarise ──
summariseBtn.addEventListener('click', () => {
  setLoading(true);
  hideError();
  chrome.runtime.sendMessage({ type: 'SUMMARISE' });
});

// ── Text ask ──
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
  });
}

// ── Mic button — toggle voice session ──
micBtn.addEventListener('click', () => {
  if (sessionActive) {
    stopVoiceSession();
  } else {
    startVoiceSession();
  }
});

// ── Voice session — tries ElevenLabs first, falls back to Web Speech API ──
async function startVoiceSession() {
  const { elevenLabsKey } = await chrome.storage.local.get('elevenLabsKey');

  if (elevenLabsKey) {
    try {
      await _startElevenLabsSession(elevenLabsKey);
      return;
    } catch (err) {
      // Clean up any partial state
      if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
      if (ws) { ws.close(); ws = null; }
      sessionActive = false;

      if (err.message === 'mic_denied') {
        responseArea.textContent =
          'Microphone is blocked for this extension. To fix: go to chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F' +
          chrome.runtime.id +
          ' and set Microphone to "Allow", then reload the extension.';
        setMicState('idle');
        return;
      }
      // Any other ElevenLabs error (402, network) — fall through to Web Speech
    }
  }

  _startWebSpeechSession();
}

async function _startElevenLabsSession(apiKey) {
  // Will throw if ElevenLabs returns 402 or any error
  const signedUrl = await getSignedUrl(apiKey);

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error('mic_denied');
  }

  ws = new WebSocket(signedUrl);
  sessionActive = true;
  setMicState('connecting');

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'conversation_initiation_client_data',
      conversation_config_override: {
        agent: { prompt: { prompt: _buildSystemPrompt() } },
      },
    }));
    _startAudioCapture();
    setMicState('listening');
  };

  ws.onmessage = (event) => {
    try { _handleVoiceMessage(JSON.parse(event.data)); } catch { /* ignore malformed */ }
  };

  ws.onerror = () => {
    showError('Voice connection error. Please try again.');
    stopVoiceSession();
  };

  ws.onclose = () => {
    if (sessionActive) stopVoiceSession();
  };
}

// Web Speech API fallback — capture voice, send transcript to Gemma, speak reply
async function _startWebSpeechSession() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    responseArea.textContent = 'Voice input is not supported in this browser. Please type your question below.';
    return;
  }

  // Check current permission state before requesting
  let permState = 'prompt';
  try {
    const perm = await navigator.permissions.query({ name: 'microphone' });
    permState = perm.state;
  } catch { /* Permissions API unavailable — proceed anyway */ }

  if (permState === 'denied') {
    responseArea.textContent =
      'Microphone is blocked for this extension. To fix: go to chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F' +
      chrome.runtime.id +
      ' and set Microphone to "Allow", then reload the extension.';
    return;
  }

  // getUserMedia triggers the browser permission prompt in extension pages.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    responseArea.textContent =
      'Microphone access denied. Open chrome://settings/content/microphone and make sure this extension is not in the blocked list.';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;

  setMicState('listening');

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((r) => r[0].transcript).join('');
    const isFinal = event.results[event.results.length - 1].isFinal;
    responseArea.textContent = `You: ${transcript}`;

    if (isFinal) {
      setMicState('idle');
      setLoading(true);
      chrome.runtime.sendMessage({ type: 'USER_PROMPT', prompt: transcript }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          setLoading(false);
          showError('Could not reach the assistant. Please try again.');
        }
      });
    }
  };

  recognition.onerror = (event) => {
    setMicState('idle');
    if (event.error === 'not-allowed') {
      responseArea.textContent = 'Microphone access denied. Enable it in your browser settings and try again.';
    } else if (event.error !== 'no-speech') {
      showError('Voice recognition error. Please try again.');
    }
  };

  recognition.onend = () => setMicState('idle');
  recognition.start();
}

function stopVoiceSession() {
  sessionActive = false;
  clearTimeout(reconnectTimer);
  if (processor) { processor.disconnect(); processor = null; }
  if (audioCtx)  { audioCtx.close().catch(() => {}); audioCtx = null; }
  if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
  if (ws)        { ws.close(); ws = null; }
  nextPlayTime = 0;
  window.speechSynthesis?.cancel();
  setMicState('idle');
}

// ── ElevenLabs audio capture (PCM 16kHz → WebSocket) ──
function _startAudioCapture() {
  audioCtx = new AudioContext({ sampleRate: 16000 });
  const source = audioCtx.createMediaStreamSource(micStream);
  processor = audioCtx.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (e) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const float32 = e.inputBuffer.getChannelData(0);
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32768)));
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    ws.send(JSON.stringify({ user_audio_chunk: btoa(binary) }));
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);
}

// ── ElevenLabs WebSocket message handler ──
function _handleVoiceMessage(msg) {
  switch (msg.type) {
    case 'audio':
      _playPCMChunk(msg.audio_event.audio_base_64);
      break;

    case 'agent_response': {
      const text = msg.agent_response_event.agent_response;
      responseArea.textContent = text;
      const match = text.match(/\[HIGHLIGHT:\s*"([^"]+)"\]/);
      if (match) chrome.runtime.sendMessage({ type: 'HIGHLIGHT', label: match[1] });
      break;
    }

    case 'user_transcript':
      responseArea.textContent = `You: ${msg.user_transcription_event.user_transcript}`;
      break;

    case 'interruption':
      if (audioCtx) nextPlayTime = audioCtx.currentTime;
      break;
  }
}

function _playPCMChunk(base64PCM) {
  if (!audioCtx) return;
  const binary = atob(base64PCM);
  const int16 = new Int16Array(binary.length / 2);
  for (let i = 0; i < int16.length; i++) {
    int16[i] = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
  }
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

  const buf = audioCtx.createBuffer(1, float32.length, 16000);
  buf.copyToChannel(float32, 0);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  const startAt = Math.max(audioCtx.currentTime, nextPlayTime);
  src.start(startAt);
  nextPlayTime = startAt + buf.duration;
}

function _buildSystemPrompt() {
  const registry = JSON.stringify(currentRegistry.slice(0, 30));
  const snippet = currentPageText.slice(0, 500);
  return (
    'You are SurfSimple, a helpful web navigation assistant for seniors. ' +
    'Keep answers short, clear, and jargon-free. ' +
    `Page content: ${snippet}. ` +
    `Interactive elements: ${registry}. ` +
    'If the user needs to click something, end your response with [HIGHLIGHT: "exact element label"].'
  );
}

// ── Mic button states ──
function setMicState(state) {
  micBtn.classList.toggle('listening', state === 'listening' || state === 'connecting');
  switch (state) {
    case 'idle':
      micBtn.setAttribute('aria-label', 'Start voice input');
      micBtn.innerHTML = '&#127908;';
      break;
    case 'connecting':
      micBtn.setAttribute('aria-label', 'Connecting…');
      micBtn.innerHTML = '&#8987;';
      break;
    case 'listening':
      micBtn.setAttribute('aria-label', 'Stop voice session');
      micBtn.innerHTML = '&#9209;';
      break;
  }
}

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

    case 'PLAY_AUDIO':
      if (!sessionActive) playAudioBase64(message.audioBase64);
      break;

    case 'SPEAK_TEXT':
      if (!sessionActive) speakText(message.text);
      break;

    case 'RESTRICTED_PAGE':
      summaryText.textContent = 'SurfSimple cannot run on this page.';
      responseArea.textContent = 'Navigate to a regular website to use SurfSimple.';
      summariseBtn.disabled = true;
      askBtn.disabled = true;
      break;

    case 'PAGE_CHANGED':
      currentRegistry = message.registry || [];
      currentPageText = message.pageText || '';
      summaryText.textContent = 'Press "Summarise this page" to get an overview.';
      hideError();
      if (!isOffline) {
        summariseBtn.disabled = false;
        askBtn.disabled = false;
      }
      if (sessionActive) {
        responseArea.textContent = 'Reconnecting voice session…';
        stopVoiceSession();
        reconnectTimer = setTimeout(startVoiceSession, 1500);
      } else {
        responseArea.textContent = 'Ask a question below to get help navigating this page.';
      }
      break;

    case 'HIGHLIGHT_NOT_FOUND':
      responseArea.textContent += `\n\nCouldn't find "${message.label}" on this page.`;
      break;
  }
});

// ── TTS: ElevenLabs MP3 audio ──
function playAudioBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'audio/mpeg' });
  ttsAudio.src = URL.createObjectURL(blob);
  ttsAudio.play().catch(() => {});
}

// ── TTS: Web Speech API fallback ──
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  chrome.storage.local.get('voiceSpeed', ({ voiceSpeed }) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(2, Math.max(0.5, voiceSpeed || 1.0));
    window.speechSynthesis.speak(utterance);
  });
}

// ── Helpers ──
function setLoading(on) {
  spinner.classList.toggle('hidden', !on);
  if (!isOffline) {
    askBtn.disabled = on;
    summariseBtn.disabled = on;
  }
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.add('visible');
}

function hideError() {
  errorBanner.classList.remove('visible');
}

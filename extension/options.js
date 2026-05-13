const KEYS = ['elevenLabsKey', 'voiceId', 'voiceSpeed', 'autoSummarise', 'highlightOnNav', 'fontSize', 'proxyUrlOverride'];

const els = {
  elevenLabsKey:     document.getElementById('elevenLabsKey'),
  voiceId:           document.getElementById('voiceId'),
  voiceSpeed:        document.getElementById('voiceSpeed'),
  voiceSpeedDisplay: document.getElementById('voiceSpeedDisplay'),
  autoSummarise:     document.getElementById('autoSummarise'),
  highlightOnNav:    document.getElementById('highlightOnNav'),
  fontSize:          document.getElementById('fontSize'),
  proxyUrlOverride:  document.getElementById('proxyUrlOverride'),
};

// Load saved settings
chrome.storage.local.get(KEYS, (saved) => {
  if (saved.elevenLabsKey)     els.elevenLabsKey.value        = saved.elevenLabsKey;
  if (saved.voiceId)           els.voiceId.value              = saved.voiceId;
  if (saved.voiceSpeed != null) {
    els.voiceSpeed.value       = saved.voiceSpeed;
    els.voiceSpeedDisplay.textContent = `${parseFloat(saved.voiceSpeed).toFixed(1)}×`;
  }
  els.autoSummarise.checked  = !!saved.autoSummarise;
  els.highlightOnNav.checked = !!saved.highlightOnNav;
  if (saved.fontSize)          els.fontSize.value             = saved.fontSize;
  if (saved.proxyUrlOverride)  els.proxyUrlOverride.value     = saved.proxyUrlOverride;
});

// Live voice speed display
els.voiceSpeed.addEventListener('input', () => {
  els.voiceSpeedDisplay.textContent = `${parseFloat(els.voiceSpeed.value).toFixed(1)}×`;
});

// Save
document.getElementById('saveBtn').addEventListener('click', () => {
  const settings = {
    elevenLabsKey:    els.elevenLabsKey.value.trim(),
    voiceId:          els.voiceId.value,
    voiceSpeed:       parseFloat(els.voiceSpeed.value),
    autoSummarise:    els.autoSummarise.checked,
    highlightOnNav:   els.highlightOnNav.checked,
    fontSize:         els.fontSize.value,
    proxyUrlOverride: els.proxyUrlOverride.value.trim(),
  };
  chrome.storage.local.set(settings, () => {
    const toast = document.getElementById('toast');
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  });
});

// Voice preview
document.getElementById('previewBtn').addEventListener('click', async () => {
  const { elevenLabsKey } = await chrome.storage.local.get('elevenLabsKey');
  if (!elevenLabsKey) {
    alert('Save your ElevenLabs API key first, then try the preview.');
    return;
  }
  const voiceId = els.voiceId.value;
  const btn = document.getElementById('previewBtn');
  btn.textContent = 'Loading…';
  btn.disabled = true;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenLabsKey },
      body: JSON.stringify({
        text: 'Hello! I am SurfSimple, your web companion. How can I help you today?',
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) throw new Error('API error');
    const blob = await res.blob();
    new Audio(URL.createObjectURL(blob)).play();
  } catch {
    alert('Voice preview failed. Check your API key and try again.');
  } finally {
    btn.textContent = 'Preview';
    btn.disabled = false;
  }
});

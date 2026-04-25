const KEYS = ['elevenLabsKey', 'voiceSpeed', 'autoSummarise', 'highlightOnNav', 'fontSize', 'proxyUrlOverride'];

const els = {
  elevenLabsKey:    document.getElementById('elevenLabsKey'),
  voiceSpeed:       document.getElementById('voiceSpeed'),
  voiceSpeedDisplay:document.getElementById('voiceSpeedDisplay'),
  autoSummarise:    document.getElementById('autoSummarise'),
  highlightOnNav:   document.getElementById('highlightOnNav'),
  fontSize:         document.getElementById('fontSize'),
  proxyUrlOverride: document.getElementById('proxyUrlOverride'),
};

// Load saved settings
chrome.storage.local.get(KEYS, (saved) => {
  if (saved.elevenLabsKey)     els.elevenLabsKey.value       = saved.elevenLabsKey;
  if (saved.voiceSpeed != null) {
    els.voiceSpeed.value        = saved.voiceSpeed;
    els.voiceSpeedDisplay.textContent = `${parseFloat(saved.voiceSpeed).toFixed(1)}×`;
  }
  els.autoSummarise.checked  = !!saved.autoSummarise;
  els.highlightOnNav.checked = !!saved.highlightOnNav;
  if (saved.fontSize)          els.fontSize.value            = saved.fontSize;
  if (saved.proxyUrlOverride)  els.proxyUrlOverride.value    = saved.proxyUrlOverride;
});

// Live voice speed display
els.voiceSpeed.addEventListener('input', () => {
  els.voiceSpeedDisplay.textContent = `${parseFloat(els.voiceSpeed.value).toFixed(1)}×`;
});

// Save
document.getElementById('saveBtn').addEventListener('click', () => {
  const settings = {
    elevenLabsKey:    els.elevenLabsKey.value.trim(),
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

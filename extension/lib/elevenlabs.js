export const AGENT_ID = 'agent_1101kq1mwapvfapvfbkh4w2hz8s5';
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel — calm, clear English

const API_BASE = 'https://api.elevenlabs.io/v1';

// Curated voice list for the options dropdown
export const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm, Female)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (Warm, Female)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Friendly, Male)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Clear, Male)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Soft, Female)' },
];

// Returns base64-encoded MP3 audio, or null on failure.
// Background service workers cannot create blob URLs, so base64 is used.
export async function textToSpeech(text, apiKey, voiceId = DEFAULT_VOICE_ID, speed = 1.0) {
  if (!apiKey || !text) return null;
  try {
    const res = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
      }),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

// Returns a signed WebSocket URL for the Conversational AI agent.
export async function getSignedUrl(apiKey) {
  const res = await fetch(
    `${API_BASE}/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
    { headers: { 'xi-api-key': apiKey } }
  );
  if (!res.ok) throw new Error(`Signed URL request failed: ${res.status}`);
  const { signed_url } = await res.json();
  return signed_url;
}

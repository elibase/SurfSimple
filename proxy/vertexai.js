const { VertexAI } = require('@google-cloud/vertexai');

// Local dev: point Google Auth Library at the key file.
// On Cloud Run the service account is attached to the service — no key file needed.
if (process.env.GCP_SERVICE_ACCOUNT_KEY_PATH) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GCP_SERVICE_ACCOUNT_KEY_PATH;
}

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT,
  location: process.env.GCP_LOCATION || 'us-central1',
});

// Gemma 3 27B via Vertex AI Model Garden.
// If your project uses a different model ID, update this constant.
const MODEL_ID = 'google/gemma-3-27b-it';

const SUMMARISE_SYSTEM =
  'You are a helpful assistant for seniors. Always respond in clear, simple language. ' +
  'Avoid jargon and technical terms. Keep your response to 3–5 sentences.';

function askSystemPrompt(registryJson) {
  return (
    'You are a helpful web navigation assistant for seniors. ' +
    `The current page has these interactive elements: ${registryJson}. ` +
    'Answer the user\'s question in plain, simple language. ' +
    'If the answer involves clicking or interacting with a specific element, end your response ' +
    'with the token [HIGHLIGHT: "exact element label"] where the label exactly matches one of the elements listed above.'
  );
}

function getModel() {
  return vertexAI.getGenerativeModel({ model: MODEL_ID });
}

async function summarise(pageText) {
  const model = getModel();
  const chunk = pageText.slice(0, 4000);

  const result = await model.generateContent({
    systemInstruction: { parts: [{ text: SUMMARISE_SYSTEM }] },
    contents: [{
      role: 'user',
      parts: [{ text: `Summarise this webpage in 3–5 sentences a senior would find easy to understand:\n\n${chunk}` }],
    }],
  });

  return result.response.candidates[0].content.parts[0].text.trim();
}

async function ask(question, pageText, elementRegistry) {
  const model = getModel();

  // Limit registry to 50 elements to stay within context budget
  const registryJson = JSON.stringify(elementRegistry.slice(0, 50));
  const pageChunk = pageText.slice(0, 3000);

  const result = await model.generateContent({
    systemInstruction: { parts: [{ text: askSystemPrompt(registryJson) }] },
    contents: [{
      role: 'user',
      parts: [{ text: `Page content:\n${pageChunk}\n\nUser question: ${question}` }],
    }],
  });

  const raw = result.response.candidates[0].content.parts[0].text.trim();

  // Extract and strip the [HIGHLIGHT: "label"] token
  const match = raw.match(/\[HIGHLIGHT:\s*"([^"]+)"\]/);
  const answer = raw.replace(/\[HIGHLIGHT:\s*"[^"]+"\]/, '').trim();

  return {
    answer,
    highlightLabel: match ? match[1] : null,
  };
}

module.exports = { summarise, ask };

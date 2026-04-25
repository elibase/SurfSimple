require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('./auth');
const { summarise, ask } = require('./vertexai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '1mb' }));

// Health check — no auth, used by Cloud Run health probes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// All routes below require a valid Bearer token
app.use(auth);

// Secondary rate limit per IP (auth is the primary defence)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again in a moment.' },
}));

app.post('/summarise', async (req, res) => {
  const { pageText } = req.body;
  if (!pageText) return res.status(400).json({ error: 'pageText is required' });

  try {
    const summary = await summarise(pageText);
    res.json({ summary });
  } catch (err) {
    console.error('POST /summarise error:', err);
    const { status, message } = mapVertexError(err);
    res.status(status).json({ error: message });
  }
});

app.post('/ask', async (req, res) => {
  const { question, pageText, elementRegistry } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  try {
    const result = await ask(question, pageText || '', elementRegistry || []);
    res.json(result);
  } catch (err) {
    console.error('POST /ask error:', err);
    const { status, message } = mapVertexError(err);
    res.status(status).json({ error: message });
  }
});

function mapVertexError(err) {
  const code = err.status || err.code;
  if (code === 429) return { status: 429, message: 'AI quota exceeded — please try again in a moment.' };
  if (code === 401 || code === 403) return { status: 502, message: 'AI service authentication failed — contact support.' };
  return { status: 500, message: 'AI service temporarily unavailable — please try again.' };
}

app.listen(PORT, () => {
  console.log(`SurfSimple proxy listening on port ${PORT}`);
});

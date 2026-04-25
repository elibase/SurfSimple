// Operator-defined constants — set DEFAULT_PROXY_URL to your Cloud Run URL after deployment.
// SHARED_SECRET must match the SHARED_SECRET env var on the proxy server.
const DEFAULT_PROXY_URL = '';
const SHARED_SECRET = '09aa52823053edd4dacf905bd3237be2e2dc8f5365336e1bd151d1f9b69747f4';

function _authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SHARED_SECRET}`,
  };
}

async function _baseUrl() {
  const { proxyUrlOverride } = await chrome.storage.local.get('proxyUrlOverride');
  const url = (proxyUrlOverride || DEFAULT_PROXY_URL).replace(/\/$/, '');
  if (!url) throw new Error('Proxy URL not configured. Set it in Settings > Advanced.');
  return url;
}

function _mapError(status, body) {
  if (status === 401) return 'Service misconfigured — contact support.';
  if (status === 429) return body?.error || 'AI quota exceeded — please try again in a moment.';
  return body?.error || 'Assistant temporarily unavailable — please try again.';
}

export async function summarise(pageText) {
  let baseUrl;
  try {
    baseUrl = await _baseUrl();
  } catch (err) {
    return err.message;
  }

  let res;
  try {
    res = await fetch(`${baseUrl}/summarise`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ pageText }),
    });
  } catch {
    return 'Assistant unavailable — check your connection.';
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) return _mapError(res.status, body);
  return body.summary || '';
}

export async function ask(question, pageText, elementRegistry) {
  const noResult = (msg) => ({ answer: msg, highlightLabel: null });

  let baseUrl;
  try {
    baseUrl = await _baseUrl();
  } catch (err) {
    return noResult(err.message);
  }

  let res;
  try {
    res = await fetch(`${baseUrl}/ask`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ question, pageText, elementRegistry }),
    });
  } catch {
    return noResult('Assistant unavailable — check your connection.');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) return noResult(_mapError(res.status, body));
  return { answer: body.answer || '', highlightLabel: body.highlightLabel || null };
}

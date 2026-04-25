# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SurfSimple is an accessibility-first web companion for seniors. It has two sub-projects:

- **`extension/`** — Chrome extension (Manifest V3, vanilla HTML/JS) that runs on any website
- **`landing/`** — Next.js 15 marketing and onboarding site

## Commands

### Chrome Extension

The extension has no build step for MVP — load it directly into Chrome:

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder

After editing any extension file, click the refresh icon on the extension card in `chrome://extensions`. Content script changes also require reloading the target tab.

### Landing Page

```bash
cd landing
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

## Architecture

### Chrome Extension — message-passing model

All AI calls and state live in the **background service worker** (`background.js`). The content script and side panel never call external APIs directly; they communicate with the background worker via `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`.

```
sidepanel.js  ──sendMessage──►  background.js  ──fetch──►  Gemma 4 API
                                      │          ──fetch──►  ElevenLabs API
                                      │
                               sendMessage (to tab)
                                      │
                                      ▼
                                 content.js  (DOM highlight only)
```

**content.js** has two jobs: (1) build and post the element registry to the background worker whenever the DOM changes, and (2) inject highlight overlays on command. It never reads API keys or talks to external services.

**background.js** owns all session state: the current element registry, page text, and conversation history. State is in-memory (service worker lifetime); nothing is persisted to `chrome.storage` except user settings and API keys.

### AI response protocol — `[HIGHLIGHT]` token

When either AI backend returns an answer that points to a clickable element, it appends the token:

```
[HIGHLIGHT: "exact element label"]
```

`background.js` parses this token out of every Gemma or ElevenLabs response before forwarding the text to the side panel. If the token is present, it sends a separate highlight message to the content script, which fuzzy-matches the label against the element registry and draws the overlay.

### Element registry schema

`elementScanner.js` produces an array of objects posted to `background.js`:

```js
{ index, tag, role, text, ariaLabel, placeholder, boundingRect }
```

This array is serialised as JSON and injected verbatim into the Gemma system prompt on every request so the model knows exactly what is clickable on the current page.

### ElevenLabs — two separate integration points

- **TTS only**: `elevenlabs.js` calls the REST `/v1/text-to-speech/{voice_id}` endpoint and returns an audio blob played in the side panel.
- **Conversational voice agent**: The ElevenLabs Conversational AI SDK opens a WebSocket session. Page context (element registry + page text summary) is injected into the agent system prompt at session start. The agent handles STT + reasoning + TTS in a single round trip.

Both paths converge on the same side panel display and highlight logic in `background.js`.

### Gemma 4 prompt patterns

Summarisation:
```
System: You are a helpful assistant for seniors. Always respond in clear, simple language. Avoid jargon.
User: Summarise this webpage in 3-5 sentences a senior would find easy to understand.
[page text]
```

Navigation Q&A:
```
System: You are a helpful web navigation assistant for seniors. The current page has these interactive elements: [element registry JSON]. Answer the user's question. If the answer requires them to click or interact with a specific element, end your response with the token [HIGHLIGHT: "exact element label"].
User: [question]
```

### Landing page

Standard Next.js 15 App Router layout under `landing/app/`. No auth; the landing page is fully static-exportable. Settings are managed inside the extension, not here.

## Key constraints

- **API keys never leave the browser.** Keys are stored in `chrome.storage.local` and read only by `background.js`. Content scripts and the landing page have no access to them.
- **Content script isolated world.** `content.js` cannot read page JavaScript variables — DOM access only.
- **MV3 service worker lifetime.** `background.js` can be terminated by Chrome at any time. Do not rely on in-memory state surviving across unrelated events; re-fetch or re-derive state from `chrome.storage` or the active tab when the worker restarts.
- **Side panel, not popup.** The UI entry point is `sidepanel.html`, registered in the manifest under `side_panel`. This keeps the assistant open while the user browses.

## Accessibility requirements

All extension UI must meet WCAG AA and be tuned for seniors:
- Minimum 18px base font in the side panel
- High-contrast colour palette throughout
- Highlight overlay auto-dismisses after 8 seconds or on user click
- Tooltip displayed above highlighted element with plain-language instruction

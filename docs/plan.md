# SurfSimple — Product Plan

## Overview

SurfSimple is an accessibility-first web companion for seniors. It combines a Chrome extension (the runtime layer that operates on any website) with a Next.js landing page (marketing, onboarding, and account management). The extension uses voice and text prompting to help users navigate unfamiliar pages, highlights interactive elements, summarises page content, and answers contextual questions by drawing on two AI backends: ElevenLabs for voice generation and a conversational voice agent, and Google Gemma 4 (via Vertex AI) for summarisation and reasoning.

**Build order decision:** The extension is built to completion first (Milestones 1–5). The Next.js landing page is built afterwards once the extension is stable and screenshots are available.

**Architectural decisions recorded:**
- **Proxy**: Operator-run shared server. The proxy URL and shared secret Bearer token are baked into the extension as constants (not user-configurable); seniors never touch server settings.
- **Voice session**: Owned by `sidepanel.js`, not `background.js`. MV3 service workers are terminated by Chrome after inactivity and cannot hold WebSocket connections reliably.
- **Proxy auth**: Extension sends a static `Authorization: Bearer <token>` header on every request. Token stored as a constant in the extension; proxy rejects requests missing it.
- **Voice highlight sync**: ElevenLabs session is restarted on each page navigation, re-injecting the fresh element registry and page context into the agent system prompt.

---

## Goals

| # | Goal |
|---|------|
| 1 | Reduce friction for seniors encountering unfamiliar website layouts |
| 2 | Provide a voice-first interaction model with text as a fallback |
| 3 | Answer natural-language navigation questions with precise on-screen guidance |
| 4 | Summarise dense page content into plain language |
| 5 | Keep the UI large, high-contrast, and cognitively simple |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Chrome Extension                  │
│                                                      │
│  ┌──────────────┐   ┌────────────────────────────┐  │
│  │ Content      │   │ Side Panel / Popup UI       │  │
│  │ Script       │◄──►  (HTML + Vanilla JS)        │  │
│  │              │   │                             │  │
│  │ • DOM scan   │   │ • Text prompt input         │  │
│  │ • Highlight  │   │ • Voice prompt button       │  │
│  │ • Overlay    │   │ • Summary display           │  │
│  └──────┬───────┘   └──────────┬──────────────────┘  │
│         │                      │                     │
│         └──────────┬───────────┘                     │
│                    │                                 │
│           ┌────────▼────────┐                        │
│           │ Background      │                        │
│           │ Service Worker  │                        │
│           │                 │                        │
│           │ • API routing   │                        │
│           │ • State/session │                        │
│           └────────┬────────┘                        │
└────────────────────┼────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
   ┌──────▼──────┐    ┌─────────▼──────────────┐
   │  ElevenLabs │    │  Gemma Proxy Server     │
   │  Voice API  │    │  (Node.js / Express)    │
   │  + Agent    │    │                         │
   │  (WebSocket │    │  • Holds GCP service    │
   │  owned by   │    │    account credentials  │
   │  sidepanel) │    │  • Shared secret auth   │
   └─────────────┘    │  • Operator-hosted      │
                      │  • Forwards to Gemma 4  │
                      └──────────┬─────────────┘
                                 │
                      ┌──────────▼─────────────┐
                      │  Google Vertex AI       │
                      │  Gemma 4                │
                      │  (Summarisation + QA)   │
                      └────────────────────────┘

┌─────────────────────────────────────────────────────┐
│   Next.js Landing Page  (built after extension)     │
│  • Marketing / feature overview                     │
│  • Install CTA → Chrome Web Store                   │
│  • Onboarding walkthrough                           │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Chrome Extension

#### 1.1 Manifest (Manifest V3)

- Permissions: `activeTab`, `scripting`, `storage`, `sidePanel`, `tts`
- Host permissions: `<all_urls>` (required for content script injection on any site)
- Side panel HTML entry point for the main assistant UI

#### 1.2 Content Script (`content.js`)

Responsibilities:
- **DOM Scanning** — On load and on mutation, scan the page for interactive elements: `<button>`, `<a>`, `<input>`, `<select>`, `<textarea>`, `[role="button"]`, `[role="link"]`, `[tabindex]`.
- **Element Registry** — Build a serialised map `{ id, tag, role, text, ariaLabel, boundingRect }` and post it to the background service worker.
- **Highlight Overlay** — On command from the background worker, inject a pulsing highlight ring (CSS outline + box-shadow animation) around a target element identified by index or CSS selector. Remove the overlay after a configurable timeout or on user dismissal.
- **Page Text Extraction** — Extract `document.body.innerText` (cleaned) and structured headings for summarisation.
- **Mutation Observer** — Re-scan and update element registry when the DOM changes significantly (SPA navigation, modal open/close).

#### 1.3 Background Service Worker (`background.js`)

Responsibilities:
- Maintain session state: current page URL, element registry, conversation history.
- Route text prompts and summarisation requests to the Gemma proxy via `gemmaProxy.js`.
- Call the ElevenLabs TTS REST API to convert text responses to audio blobs.
- Forward highlight commands to the active tab's content script via `chrome.tabs.sendMessage`.
- Manage the ElevenLabs API key via `chrome.storage.local` (never exposed to content scripts).
- **Does not** own the ElevenLabs voice session — that lives in `sidepanel.js`.

#### 1.4 Side Panel UI (`sidepanel.html` / `sidepanel.js`)

Responsibilities:
- Large-text, high-contrast interface styled for senior accessibility (min 18px base font, WCAG AA contrast).
- **Text prompt**: Single input field + "Ask" button.
- **Voice session ownership**: `sidepanel.js` directly opens, manages, and closes the ElevenLabs Conversational AI WebSocket session. The side panel is a persistent page (not a service worker) so it can reliably hold the connection and play audio via the Web Audio API.
- Restarts the voice session on each page navigation, re-injecting the fresh element registry and page context.
- **Summary panel**: Displays the current page summary on demand or automatically on new page load.
- **Response area**: Shows the assistant's last answer in large readable text.
- **Settings link**: Opens the extension options page.

#### 1.5 Options Page (`options.html`)

- ElevenLabs API key input (stored in `chrome.storage.local`).
- Voice speed and volume controls.
- Toggle: auto-summarise on page load.
- Toggle: highlight elements automatically when navigating.
- Font size preference.
- Advanced section: proxy URL override (defaults to the operator's hosted URL baked into `gemmaProxy.js` as a constant; overridable for developers running the proxy locally).

#### 1.6 Gemma Proxy Server (`proxy/`)

A lightweight Node.js / Express server operated by the SurfSimple developer. The proxy URL and a shared secret Bearer token are baked into the extension as constants — seniors never configure server settings.

Responsibilities:
- Validate `Authorization: Bearer <shared-secret>` header on every request; reject without it.
- Authenticate to Vertex AI using a GCP service account key (environment variable, never committed).
- Accept `POST /summarise` and `POST /ask` from the extension background worker.
- Forward the request payload (page text, element registry, question) to Vertex AI Gemma 4.
- Return the model response to the extension.
- Rate-limit per IP as a secondary defence layer.
- Expose `GET /health` for uptime monitoring.

---

### 2. AI Integrations

#### 2.1 ElevenLabs

| Feature | Implementation |
|---------|---------------|
| Text-to-Speech | REST API (`/v1/text-to-speech/{voice_id}`) — converts assistant text responses to audio played in the side panel |
| Voice Agent (Conversational AI) | ElevenLabs Conversational AI SDK — manages a real-time voice session; user speaks, agent responds in voice and text |
| Voice selection | Default to a calm, clear English voice; user can choose from a curated shortlist in options |

Flow for voice prompt:
1. User presses microphone button → `sidepanel.js` opens an ElevenLabs Conversational AI WebSocket session directly (not via background worker), injecting the current element registry and page text into the system prompt.
2. User speaks their question.
3. Agent transcribes, reasons, and streams back text + audio simultaneously.
4. `sidepanel.js` parses the text transcript for a `[HIGHLIGHT: "label"]` token and sends a `HIGHLIGHT` message to `background.js` if found.
5. `background.js` forwards the highlight command to the content script.
6. Audio plays in the side panel via the Web Audio API; text answer is displayed.
7. On page navigation, `sidepanel.js` closes the session and reopens it with the new page's element registry (~1–2 s reconnect latency).

#### 2.2 Google Gemma 4 via Vertex AI

Gemma 4 is accessed through a self-hosted proxy server (`proxy/`) that authenticates to Google Cloud Vertex AI using a GCP service account. The extension background worker never holds GCP credentials — it only knows the proxy URL, stored in `chrome.storage.local`.

| Feature | Implementation |
|---------|---------------|
| Page summarisation | `background.js` POSTs to `proxy/summarise` with cleaned page text + headings; proxy forwards to Vertex AI Gemma 4 |
| Question answering | `background.js` POSTs to `proxy/ask` with question + element registry + page text; proxy forwards to Vertex AI Gemma 4 |
| Context window | Proxy chunks long page text by heading sections before sending; stays within Gemma 4 context limit |

Prompt strategy (summarisation):
```
System: You are a helpful assistant for seniors. Always respond in clear, simple language. Avoid jargon.
User: Summarise this webpage in 3-5 sentences a senior would find easy to understand.
[page text]
```

Prompt strategy (navigation question):
```
System: You are a helpful web navigation assistant for seniors. The current page has these interactive elements: [element registry JSON]. Answer the user's question. If the answer requires them to click or interact with a specific element, end your response with the token [HIGHLIGHT: "exact element label"].
User: [question]
```

---

### 3. Next.js Landing Page

> **Built after the extension is complete.** Screenshots and final copy depend on a working extension, so the landing page is deferred until all extension milestones are done.

**Route structure:**

```
/                   → Hero + feature highlights + install CTA
/how-it-works       → Step-by-step walkthrough with screenshots
/pricing            → Free tier vs. Pro (ElevenLabs usage-based)
/setup              → Post-install guide: load extension → options → enter keys → test
/privacy            → Data handling policy (discloses all third-party API calls)
```

**Tech stack:**
- Next.js 15 (App Router)
- Tailwind CSS — large typography scale, accessible colour palette
- Framer Motion — subtle animations for feature demos
- No auth required; settings are managed inside the extension

---

## Feature Specifications

### F1 — Element Identification

- Triggered automatically on page load and DOM mutation.
- Elements are labelled by their visible text, `aria-label`, `placeholder`, or inferred role.
- Registry is stored in session state in the background worker.
- Accessible to both AI backends as structured context.

### F2 — Voice & Text Prompting

- Text path: user types → background worker → Gemma 4 → text response + optional highlight.
- Voice path: user speaks → ElevenLabs Voice Agent → transcription + reasoning → text + audio response + optional highlight.
- Both paths converge on the same response rendering and highlight logic.

### F3 — Page Summarisation

- Triggered manually ("Summarise this page" button) or automatically on page load (if enabled in options).
- Gemma 4 generates a plain-language summary.
- Summary is displayed in the side panel and optionally read aloud via ElevenLabs TTS.

### F4 — Contextual Highlight ("Where do I click?")

- User asks a navigation question (voice or text).
- AI response includes a `[HIGHLIGHT: "label"]` token.
- Background worker sends a highlight command to the content script.
- Content script finds the best-matching element in the registry by label similarity and renders a pulsing coloured ring around it.
- A tooltip above the element displays a short instruction (e.g., "Click here to continue").
- Highlight auto-dismisses after 8 seconds or on user click.

---

## Data Flow Diagram

```
User speaks / types
        │
        ▼
  Side Panel UI
        │
        ▼ (chrome runtime message)
  Background Service Worker
        │
        ├──[summarise]──► proxy/summarise ──► Vertex AI Gemma 4 ──► plain-text summary
        │                                                                    │
        │                                                                    ▼
        │                                                         Side Panel (text + TTS)
        │
        ├──[question]───► proxy/ask ──► Vertex AI Gemma 4 ──► answer + [HIGHLIGHT token]
        │                                                               │
        │                                                               ▼
        │                                                    Content Script → DOM highlight
        │
        └──[voice]──► sidepanel.js opens ElevenLabs WebSocket directly
                              │  (sidepanel is a persistent page, not a service worker)
                              │  STT + reasoning + TTS in one session
                              ▼
                      answer text + audio ──► Side Panel display + playback
                              │
                              │ (if [HIGHLIGHT] token found in transcript)
                              ▼
                      background.js ──► Content Script → DOM highlight
                              │
                       On page navigation:
                       sidepanel.js closes session → reopens with new page context
```

---

## File Structure

```
SurfSimple/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── sidepanel.html
│   ├── sidepanel.js
│   ├── sidepanel.css
│   ├── options.html
│   ├── options.js
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── lib/
│       ├── elevenlabs.js      # ElevenLabs Conversational AI + TTS helpers
│       ├── gemmaProxy.js      # HTTP client for the Gemma proxy server
│       ├── elementScanner.js  # DOM scanning and registry logic
│       └── highlighter.js     # Overlay injection and teardown
│
├── proxy/                     # Gemma proxy server (Node.js / Express)
│   ├── index.js               # Express app — /summarise and /ask routes
│   ├── vertexai.js            # Vertex AI client wrapper
│   ├── .env.example           # GCP_PROJECT, GCP_LOCATION, SERVICE_ACCOUNT_KEY_PATH
│   └── package.json
│
├── landing/                   # Next.js app (built after extension is complete)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── how-it-works/
│   │   ├── pricing/
│   │   ├── setup/
│   │   └── privacy/
│   ├── components/
│   ├── public/
│   ├── tailwind.config.ts
│   └── package.json
│
└── docs/
    ├── plan.md
    └── tasks.md
```

---

## Development Phases

### Phase 1 — Foundation (Weeks 1–2)  ← **Starting here**

- [ ] Scaffold Chrome extension (MV3 manifest, side panel, background worker, content script)
- [ ] Implement DOM scanner and element registry (`elementScanner.js`)
- [ ] Implement basic highlight overlay (`highlighter.js`)
- [ ] Wire up side panel UI with text prompt input and static response display

### Phase 2 — Proxy Server + Gemma AI Integration (Weeks 3–4)

- [ ] Scaffold Gemma proxy server (`proxy/`) with Express
- [ ] Integrate Vertex AI Gemma 4 in the proxy (`/summarise` and `/ask` routes)
- [ ] Integrate proxy client in `background.js` for summarisation and Q&A
- [ ] Parse `[HIGHLIGHT]` token from Gemma responses and trigger highlights
- [ ] Integrate ElevenLabs TTS for reading responses aloud
- [ ] Add auto-summarise on page load (options-gated)

### Phase 3 — Voice Agent (Weeks 5–6)

- [ ] Integrate ElevenLabs Conversational AI SDK for real-time voice sessions
- [ ] Inject page context (element registry + page text summary) into agent system prompt per session
- [ ] Connect voice agent responses to the same highlight and display pipeline
- [ ] Test latency and audio quality; tune voice selection

### Phase 4 — Polish & Accessibility (Weeks 7–8)

- [ ] Senior-focused UI audit: font sizes, contrast ratios, touch targets
- [ ] Keyboard navigation throughout side panel
- [ ] Error states: API failures, no microphone permission, unsupported pages
- [ ] Options page: ElevenLabs API key + proxy URL, voice speed, auto-summarise toggle

### Phase 5 — Extension Testing & Store Submission (Weeks 9–10)

- [ ] End-to-end testing on a diverse set of real websites
- [ ] Usability testing with senior participants
- [ ] Chrome Web Store submission (privacy policy, store listing, screenshots)

### Phase 6 — Landing Page (Weeks 11–12)

- [ ] Scaffold Next.js 15 app in `landing/`
- [ ] Build all routes with final copy and screenshots from the working extension
- [ ] Deploy to Vercel with custom domain

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Extension UI model | Side Panel (not popup) | Stays open while user browses; better for ongoing conversation |
| Manifest version | MV3 | Required by Chrome Web Store; service worker model suits this architecture |
| STT for voice input | ElevenLabs Conversational AI (handles STT + TTS in one session) | Single integration point; lower latency than separate STT + TTS |
| Voice session host | `sidepanel.js` (not `background.js`) | MV3 service workers terminate after ~30 s inactivity; side panel is a persistent page that can hold a WebSocket and play audio |
| Voice highlight sync | Restart session on each page navigation | Re-injects fresh element registry; ~1–2 s reconnect is acceptable vs. stale context |
| Gemma 4 access | Vertex AI via operator-hosted proxy server | GCP service account credentials must not live in the browser; proxy keeps them server-side |
| Proxy deployment | Operator-run (one shared server) | Seniors can't deploy servers; proxy URL + shared secret baked into extension as constants |
| Proxy auth | Shared secret Bearer token | Extension sends `Authorization: Bearer <token>`; proxy rejects missing/invalid tokens; token is a baked-in constant, not user-configurable |
| Proxy stack | Node.js / Express | Lightweight, minimal dependencies; easy to deploy on Cloud Run or a small VM |
| Credential storage | Environment variables in proxy | Never committed; injected at deploy time |
| Extension credential storage | `chrome.storage.local` (ElevenLabs key only; proxy URL overridable in advanced options) | Seniors see no server configuration; developers can override proxy URL for local testing |
| Page text chunking | Heading-section split (in proxy) | Preserves semantic structure; chunking logic sits server-side close to the model call |
| Build order | Extension first, landing page after | Landing page copy and screenshots depend on a working extension |

---

## Security & Privacy

- GCP service account credentials stored only in proxy server environment variables; never in the browser or committed to git.
- Shared secret Bearer token baked into the extension; proxy rejects any request missing it — prevents unauthorised use of the operator's Vertex AI quota.
- ElevenLabs API key stored only in `chrome.storage.local`; never exposed to content scripts.
- Proxy URL is a baked-in constant (overridable in advanced options for developers only); seniors never see or configure it.
- Page text sent to the proxy (and onward to Vertex AI) and to ElevenLabs only on explicit user action (or auto-summarise if opted in).
- No page data is logged or persisted beyond the current browser session; proxy is stateless.
- Content script operates in isolated world; cannot access page JavaScript variables.
- Privacy policy on landing page discloses all third-party API calls (Vertex AI, ElevenLabs).

---

## Dependencies

| Package / Service | Used In | Purpose |
|-------------------|---------|---------|
| ElevenLabs JS SDK | Extension | Conversational AI voice agent + TTS |
| Express | Proxy server | HTTP routing for `/summarise` and `/ask` |
| `@google-cloud/vertexai` | Proxy server | Vertex AI Gemma 4 client |
| `express-rate-limit` | Proxy server | Per-IP rate limiting |
| Next.js 15 | Landing page | SSG/SSR framework |
| Tailwind CSS | Landing page | Styling |
| Framer Motion | Landing page | Animations |

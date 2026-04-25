# SurfSimple — Task Tracker

Progress key: `[ ]` Not started · `[~]` In progress · `[x]` Done · `[!]` Blocked

**Decisions recorded:**
- Gemma 4 accessed via **Vertex AI** through an operator-hosted proxy server — GCP credentials never enter the browser
- **Proxy is operator-run** — one shared server; proxy URL + shared secret token baked into the extension as constants; seniors configure nothing server-related
- **Proxy auth**: extension sends `Authorization: Bearer <shared-secret>` on every request; proxy rejects missing/invalid tokens
- Voice session owned by **`sidepanel.js`**, not `background.js` — MV3 service workers terminate after ~30 s inactivity and cannot hold WebSocket connections reliably
- **Voice session restarts on page navigation** — closes and reopens with fresh element registry (~1–2 s reconnect latency) to keep the agent's page context current
- **Milestone 1 first** — extension foundation complete before moving to AI integration
- **Landing page deferred** — built after the extension is complete (Milestone 6)

---

## Milestone 1 — Foundation ✓ Complete
**Target: Weeks 1–2 | Goal: Loadable extension skeleton with working DOM scan and highlights**

### 1.1 Project Setup
- [x] Initialise `.gitignore` (node_modules, .env, build artefacts, service account key files)
- [x] Create `extension/`, `proxy/`, and `docs/` top-level directories
- [x] Add `README.md` with dev setup instructions for both extension and proxy

### 1.2 Chrome Extension Scaffold
- [x] Write `extension/manifest.json` (MV3, declare `activeTab`, `scripting`, `storage`, `sidePanel`, `tts`, `<all_urls>`)
- [x] Create `extension/background.js` with `chrome.runtime.onInstalled` listener + `setPanelBehavior`
- [x] Create `extension/sidepanel.html` with full HTML shell (linked to `sidepanel.js` and `sidepanel.css`)
- [x] Create `extension/sidepanel.js` — `chrome.runtime.sendMessage` wiring for all message types
- [x] Create `extension/sidepanel.css` — 18px min font, high-contrast palette, full layout
- [x] Create `extension/options.html` and `extension/options.js` — all settings fields wired to `chrome.storage.local`
- [ ] Add logo icons to `extension/icons/` — directory created; user to add `icon16.png`, `icon48.png`, `icon128.png`
- [ ] Verify extension loads unpacked in Chrome without errors

### 1.3 DOM Scanner
- [x] Create `extension/lib/elementScanner.js`
  - [x] Query all interactive selectors: `button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, `[role="link"]`, `[tabindex]`
  - [x] Build registry array: `{ index, tag, role, text, ariaLabel, placeholder, boundingRect }`
  - [x] Derive human-readable label from `innerText → ariaLabel → placeholder → tag+role`
  - [x] Post registry to background worker via `chrome.runtime.sendMessage`
- [x] Create `extension/content.js`
  - [x] Load `elementScanner.js` via content_scripts array (no bundler needed)
  - [x] Run initial scan on `DOMContentLoaded`
  - [x] Attach `MutationObserver` — re-scan on significant DOM changes (debounced 300 ms)
  - [x] Listen for `chrome.runtime.onMessage` for highlight commands
  - [x] SPA navigation detection via `history.pushState` intercept + `popstate`

### 1.4 Highlight Overlay
- [x] Create `extension/lib/highlighter.js`
  - [x] `showHighlight(element, label)` — inject pulsing CSS ring (outline + box-shadow keyframe animation)
  - [x] Inject tooltip above element displaying `label`
  - [x] `clearHighlight()` — remove overlay and tooltip
  - [x] Auto-dismiss after 8 seconds; also dismiss on element click

### 1.5 Background Worker — Messaging Skeleton
- [x] Handle `REGISTRY_UPDATE` message from content script — store in memory
- [x] Handle `PAGE_TEXT` message from content script — store in memory
- [x] Handle `USER_PROMPT` message from side panel — stub response echo
- [x] Handle `HIGHLIGHT` command dispatch to active tab via `chrome.tabs.sendMessage`
- [x] Handle `GET_SETTINGS` / `SET_SETTINGS` using `chrome.storage.local`

### 1.6 Side Panel UI — Static Shell
- [x] Layout: header logo, summary section, response area, prompt input row, mic button
- [x] "Ask" button sends `USER_PROMPT` message to background worker
- [x] Response area displays echoed stub response
- [x] "Summarise this page" button sends `SUMMARISE` message (stub)
- [x] Settings gear icon opens `options.html`

---

## Milestone 2 — Proxy Server + Gemma AI Integration (Text Path)
**Target: Weeks 3–4 | Goal: Gemma 4 summarisation and Q&A working end-to-end via text**

### 2.1 Gemma Proxy Server
- [ ] Initialise `proxy/` as a Node.js project (`npm init`, add `.gitignore`)
- [ ] Install dependencies: `express`, `@google-cloud/vertexai`, `express-rate-limit`, `dotenv`
- [ ] Create `proxy/.env.example` documenting required vars: `GCP_PROJECT`, `GCP_LOCATION`, `GCP_SERVICE_ACCOUNT_KEY_PATH`, `PORT`, `SHARED_SECRET`
- [ ] Create `proxy/auth.js` — middleware that reads `Authorization: Bearer <token>` header and rejects (401) if it doesn't match `process.env.SHARED_SECRET`
- [ ] Create `proxy/vertexai.js`
  - [ ] Initialise Vertex AI client using service account credentials from env
  - [ ] `summarise(pageText)` — call Gemma 4 with summarisation prompt; return plain-text summary
  - [ ] `ask(question, pageText, elementRegistry)` — call Gemma 4 with navigation Q&A prompt; return raw model text
  - [ ] Chunk long `pageText` by heading sections before sending; stay within Gemma 4 context limit
- [ ] Create `proxy/index.js`
  - [ ] Apply `auth.js` middleware globally before all routes
  - [ ] `POST /summarise` — accept `{ pageText }`; call `vertexai.summarise`; return `{ summary }`
  - [ ] `POST /ask` — accept `{ question, pageText, elementRegistry }`; call `vertexai.ask`; parse `[HIGHLIGHT: "..."]` token; return `{ answer, highlightLabel }`
  - [ ] `GET /health` — return `{ status: "ok" }` (no auth required)
  - [ ] Apply `express-rate-limit` per IP as secondary defence
  - [ ] Return user-friendly error JSON on Vertex AI failures (quota, auth, timeout)
- [ ] Verify proxy runs locally: auth rejection with wrong token, valid response with correct token

### 2.2 Options Page — Settings Management
- [ ] ElevenLabs API key input — save/load from `chrome.storage.local`
- [ ] Voice speed slider (0.5×–2×) — save/load from `chrome.storage.local`
- [ ] Toggle: auto-summarise on page load
- [ ] Toggle: highlight elements automatically on navigation
- [ ] Font size preference (Medium / Large / Extra Large)
- [ ] "Save" confirmation toast
- [ ] Advanced section (collapsed by default): proxy URL override field — pre-filled with operator constant from `gemmaProxy.js`; lets developers point at a local proxy instance

### 2.3 Extension Proxy Client
- [ ] Create `extension/lib/gemmaProxy.js`
  - [ ] Define `DEFAULT_PROXY_URL` and `SHARED_SECRET` as baked-in constants
  - [ ] `summarise(pageText, proxyUrlOverride)` — POST to proxy `/summarise` with `Authorization: Bearer <SHARED_SECRET>`; return summary string
  - [ ] `ask(question, pageText, elementRegistry, proxyUrlOverride)` — POST to proxy `/ask` with auth header; return `{ answer, highlightLabel }`
  - [ ] Resolve effective URL: use `proxyUrlOverride` from storage if set, else `DEFAULT_PROXY_URL`
  - [ ] Handle network errors, 401 (invalid token), and non-200 responses; return user-friendly error string

### 2.4 Background Worker — Gemma Routes
- [ ] On `SUMMARISE` message: read proxy URL from storage → call `gemmaProxy.summarise` → send `SUMMARY_RESULT` to side panel
- [ ] On `USER_PROMPT` message (text): call `gemmaProxy.ask` → send `PROMPT_RESULT` to side panel; if `highlightLabel` present dispatch highlight command to content script
- [ ] Auto-summarise flow: on `REGISTRY_UPDATE` (new URL detected) check `autoSummarise` setting; if enabled trigger summarisation automatically

### 2.5 Side Panel UI — Live AI Responses
- [ ] Display `SUMMARY_RESULT` in summary section
- [ ] Display `PROMPT_RESULT` answer in response area
- [ ] Loading spinner while awaiting AI response
- [ ] Error state banner for failed API calls (proxy unreachable, quota exceeded)
- [ ] Apply font size preference from options to response text

### 2.6 Highlight Integration (Text Path)
- [ ] Content script receives highlight command with label string
- [ ] Fuzzy-match label against registry `text` and `ariaLabel` fields (case-insensitive substring match, fallback to best partial match)
- [ ] Call `highlighter.showHighlight(element, label)` on best match
- [ ] If no match found, log warning and send `HIGHLIGHT_NOT_FOUND` back to side panel to show "couldn't find that element" message

---

## Milestone 3 — ElevenLabs TTS & Voice Agent
**Target: Weeks 5–6 | Goal: Voice-first interaction end-to-end**

### 3.1 ElevenLabs TTS
- [ ] Create `extension/lib/elevenlabs.js`
  - [ ] `textToSpeech(text, voiceId, apiKey, speed)` — POST to `/v1/text-to-speech/{voiceId}`; return audio blob URL
  - [ ] Default voice ID constant (calm, clear English voice)
  - [ ] Handle API errors; return `null` so UI falls back to text-only

### 3.2 Background Worker — TTS Route
- [ ] After sending `PROMPT_RESULT` or `SUMMARY_RESULT` to side panel, call `elevenlabs.textToSpeech`
- [ ] Send `PLAY_AUDIO` message with blob URL to side panel
- [ ] Respect voice speed from user settings

### 3.3 Side Panel UI — Audio Playback
- [ ] Create hidden `<audio>` element; play blob URL on `PLAY_AUDIO` message
- [ ] Volume control in side panel header
- [ ] "Stop audio" button visible while audio is playing
- [ ] Graceful fallback if audio unavailable (text response still shown)

### 3.4 ElevenLabs Conversational Voice Agent (owned by sidepanel.js)
- [ ] Install ElevenLabs Conversational AI SDK — bundle for MV3 (no dynamic `require`; use importmap or bundled script)
- [ ] Implement voice session logic directly in `sidepanel.js` (not via background worker):
  - [ ] `startVoiceSession(elementRegistry, pageText)` — compose system prompt with fresh page context; open WebSocket session
  - [ ] `stopVoiceSession()` — close session, release microphone
  - [ ] On text transcript received: parse for `[HIGHLIGHT: "label"]` token; if found send `HIGHLIGHT` message to `background.js` which forwards to content script
  - [ ] On page navigation message from `background.js`: call `stopVoiceSession()` then `startVoiceSession(newRegistry, newPageText)` — accept ~1–2 s reconnect gap
- [ ] Side panel listens for `PAGE_CHANGED` from `background.js` to trigger session restart

### 3.5 Side Panel UI — Voice Interaction
- [ ] Microphone button: idle / listening / processing states with distinct visual feedback
- [ ] Request `microphone` permission on first use; show re-grant instructions if denied
- [ ] Display live transcript as user speaks
- [ ] On agent response: show text answer; agent handles TTS natively in the WebSocket session (no separate TTS call needed)
- [ ] Show brief "Reconnecting…" indicator during the ~1–2 s session restart on page navigation
- [ ] "Stop" button visible while voice session is active

### 3.6 Options Page — Voice Settings
- [ ] Voice selection dropdown (curated shortlist from ElevenLabs voice library)
- [ ] "Preview" button plays a sample phrase in the selected voice

---

## Milestone 4 — Polish & Accessibility
**Target: Weeks 7–8 | Goal: Senior-ready UX and complete error handling**

### 4.1 Accessibility Audit — Extension
- [ ] Verify all side panel interactive elements have visible focus indicators
- [ ] Confirm WCAG AA contrast ratio on all text and UI controls
- [ ] Keyboard navigation: Tab order through side panel is logical; Esc dismisses highlights
- [ ] Highlight overlay ring is 3px minimum and uses a colour distinct from common page palettes
- [ ] Tooltip font size ≥ 16px; tooltip does not obscure the highlighted element

### 4.2 Error States & Edge Cases
- [ ] ElevenLabs API key not set: show inline prompt in side panel linking to options page
- [ ] Proxy returns 401: show "Service misconfigured — contact support" (user cannot fix this; it means the baked-in token is wrong)
- [ ] Proxy unreachable: show "Assistant unavailable — check your connection" banner
- [ ] Microphone permission denied: show step-by-step re-grant instructions
- [ ] Extension injected on `chrome://` or extension pages: detect and show "not available on this page" message
- [ ] Network offline: show offline banner; disable AI buttons
- [ ] Vertex AI quota exceeded: proxy returns 429; side panel shows retry suggestion
- [ ] ElevenLabs quota exceeded: fall back to silent text-only mode

### 4.3 SPA Navigation Handling
- [ ] Detect client-side URL changes via `history.pushState` / `popstate` interception in content script
- [ ] Clear previous element registry and page text on navigation
- [ ] Re-run scanner after SPA route settles (200 ms idle after last mutation)

### 4.4 Proxy Server — Production Hardening
- [ ] Add HTTPS support (or document reverse-proxy setup via nginx/Cloud Run)
- [ ] Add request logging (structured JSON, no page content logged)
- [ ] Add health check endpoint `GET /health`
- [ ] Write `Dockerfile` for containerised deployment
- [ ] Document deployment to Cloud Run in `proxy/README.md`

---

## Milestone 5 — Extension Testing & Store Submission
**Target: Weeks 9–10 | Goal: Published on Chrome Web Store**

### 5.1 Extension Testing
- [ ] Manual test matrix: run all four features (element scan, text Q&A, voice agent, summarise) on 10 representative sites (news, e-commerce, banking, government, social)
- [ ] Test MV3 service worker restart scenarios — verify state recovers correctly after worker termination
- [ ] Test SPA sites: Gmail, YouTube, Amazon — confirm re-scan fires after navigation
- [ ] Test on Chrome on Windows and macOS
- [ ] Test with proxy URL not set (error path)
- [ ] Test with proxy running but Vertex AI credentials invalid (error path)
- [ ] Test ElevenLabs key missing and key invalid (error paths)

### 5.2 Usability Testing
- [ ] Recruit 3–5 seniors for usability sessions
- [ ] Test tasks: find a link, summarise an article, ask "where do I sign in?"
- [ ] Document friction points and iterate on UI copy and layout
- [ ] Verify TTS audio is clear and paced appropriately at default speed

### 5.3 Chrome Web Store Submission
- [ ] Write store listing: title, short description (132 chars), full description
- [ ] Produce five 1280×800 screenshots showing key features
- [ ] Create 440×280 promo tile
- [ ] Write privacy policy (can be a standalone HTML file until landing page is live)
- [ ] Submit for review
- [ ] Address any policy feedback from Chrome review team

### 5.4 Post-Submission
- [ ] Set up error monitoring (e.g., Sentry) in the extension background worker
- [ ] Create GitHub issue template for bug reports
- [ ] Tag `v1.0.0` release in git

---

## Milestone 6 — Landing Page
**Target: Weeks 11–12 | Goal: Live Next.js site with real screenshots and store link**

> Started only after the extension is published and final screenshots are available.

### 6.1 Next.js Scaffold
- [ ] Initialise Next.js 15 app in `landing/` (`npx create-next-app@latest`)
- [ ] Install and configure Tailwind CSS with large typography scale
- [ ] Install Framer Motion
- [ ] Create route stubs: `/`, `/how-it-works`, `/pricing`, `/setup`, `/privacy`
- [ ] Add shared `layout.tsx` with nav and footer
- [ ] Deploy preview to Vercel

### 6.2 Page Content
- [ ] `/` — hero headline, three feature cards (Summarise / Ask / Highlight), "Add to Chrome" CTA
- [ ] `/how-it-works` — numbered steps with real screenshots from the published extension
- [ ] `/pricing` — free tier (text only) vs. Pro tier (voice, unlimited summarisation)
- [ ] `/setup` — post-install guide: load extension → options → enter ElevenLabs key + proxy URL → test
- [ ] `/privacy` — disclose all third-party API calls (Vertex AI, ElevenLabs); confirm no server-side data retention

### 6.3 Quality & Launch
- [ ] Responsive layout verified on mobile and desktop
- [ ] Lighthouse accessibility score ≥ 90 on all routes
- [ ] Point custom domain to Vercel deployment
- [ ] Replace stub privacy policy URL in Chrome Web Store listing with live `/privacy` route
- [ ] Add privacy-safe analytics (no PII)

---

## Backlog (Post-v1)

- [ ] Multi-language support — non-English page summarisation and TTS voices
- [ ] Highlight history — remember which elements were highlighted in a session
- [ ] Browser history–aware context — use recent page visits to give richer answers
- [ ] Firefox port — WebExtension manifest adaptation
- [ ] User account + cloud sync for settings across devices

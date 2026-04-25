# SurfSimple

An accessibility-first web companion for seniors. Voice prompting, page summaries, and element highlighting — all from a Chrome side panel.

## Repository layout

```
extension/   Chrome extension (Manifest V3, vanilla HTML/JS)
proxy/       Node.js/Express proxy for Gemma 4 via Vertex AI
landing/     Next.js 15 marketing site (built last)
docs/        Planning documents
```

## Chrome Extension — local development

No build step required for the extension.

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` folder.
4. After editing any file, click the **refresh icon** on the extension card.  
   Content script changes also require reloading the target tab.

## Proxy Server — local development

```bash
cd proxy
cp .env.example .env          # fill in your GCP and secret values
npm install
node index.js                 # starts on PORT from .env (default 3001)
```

The extension's **Advanced** settings panel has a proxy URL override field — point it at `http://localhost:3001` while developing locally.

## Landing Page — local development

```bash
cd landing
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

## Documentation

- Full architecture and feature plan: [`docs/plan.md`](docs/plan.md)
- Milestone task tracker: [`docs/tasks.md`](docs/tasks.md)

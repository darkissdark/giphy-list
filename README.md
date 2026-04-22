# GIF Search (Angular + Giphy)

Web app for searching GIFs using the **Giphy API**. The API key **never reaches the browser**: requests go through a local Express proxy (`/api/gifs/*`) that calls `api.giphy.com`.

## Requirements

- Node.js (LTS)
- [Giphy API](https://developers.giphy.com/) key

## Quick start

1) Install dependencies:

```bash
npm install
```

2) Create `.env` in the project root (next to `package.json`):

```bash
cp .env.example .env
```

Set `GIPHY_API_KEY`.

3) Start the dev server:

```bash
npm start
```

Open `http://localhost:4200/`.

### API check (optional)

After startup, you can open in a browser:

`http://localhost:4200/api/gifs/search?q=test`

## Production build + SSR

```bash
npm run build
npm run serve:ssr:giphy-list
```

By default, the SSR server listens on port `4000` (or `PORT` from env).

## Implemented features

- Trending GIFs are shown on the home page when query is empty
- Search with **debounce** + **distinctUntilChanged**
- Empty state / errors / **rate limit**
- Details page **`/gif/:id`** (copy, download)
- **More GIFs by author** block (via `/api/gifs/by-user`)
- **Copy link** (`@angular/cdk/clipboard`) with short UX feedback
- **GIF download** through server endpoint
- **TransferState** only for first result page (to avoid bloating HTML)

## Tests

```bash
npm test
```

### Playwright

```bash
# full local run (UI + API)
npm run test:pw

# API tests only
npm run test:api

# interactive UI mode
npm run test:ui

# remote smoke (skips local webServer when TARGET_URL is set)
TARGET_URL=https://your-app.vercel.app npm run test:pw -- --grep-invert @api --project=chromium-desktop
```

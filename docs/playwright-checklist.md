# Playwright QA Checklist

## Pre-run
- Ensure Node dependencies are installed with `npm install`.
- Install Chromium for Playwright with `npm run test:pw:install`.
- Add `GIPHY_API_KEY` to `.env` for API happy-path tests.
- Confirm test base URL is free (`http://127.0.0.1:4300` by default).

## UI E2E checklist
- Search input accepts keyword and switches UI from trending to search results.
- Search results grid renders cards with valid links.
- `Load more` appends results and disables/hides control at list end.
- Responsive smoke: search input and results remain visible on desktop and mobile projects.

## API checklist
- `/api/gifs/search` happy path returns `items` and `totalCount`.
- `/api/gifs/search` without `q` returns `400` and structured error payload.
- `/api/gifs/trending` returns list payload shape.
- `/api/gifs/:id` negative check returns `404` + error payload for missing id.

## Run commands
- Full suite: `npm run test:pw`
- UI-only subset: `npm run test:pw -- --grep-invert @api`
- API only: `npm run test:api`
- Interactive debugging: `npm run test:ui`

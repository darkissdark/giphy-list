# Playwright Test Cases

## UI E2E

### TC-UI-001 Search flow (state transition)
- Preconditions: home page is opened.
- Steps: enter `cats` in search input.
- Expected:
  - trending state -> search state transition occurs;
  - search grid is shown;
  - search result cards are rendered.
- Techniques: State Transition + Equivalence Partitioning (valid non-empty keyword).

### TC-UI-002 Load more for search results (boundary)
- Preconditions: search result list has more than one page.
- Steps: search `banana`, click `Load more`.
- Expected:
  - card count increases after click;
  - at final boundary (`loaded == totalCount`), `Load more` is hidden/disabled.
- Techniques: Boundary Value Analysis (page size edge and end-of-list boundary).

### TC-UI-003 Responsive smoke
- Preconditions: run in desktop and mobile projects.
- Steps: open home page.
- Expected:
  - search control visible;
  - results container visible;
  - cards are still accessible.
- Techniques: Equivalence Partitioning (desktop viewport vs mobile viewport classes).

## API automation

### TC-API-001 Search endpoint happy path
- Request: `GET /api/gifs/search?q=cat&limit=3&offset=0`.
- Expected:
  - HTTP 200;
  - JSON body includes `items[]` and numeric `totalCount`;
  - first item contains mapped fields (`id`, `title`, `previewUrl`).
- Techniques: Equivalence Partitioning (valid query payload).

### TC-API-002 Search endpoint validation error
- Request: `GET /api/gifs/search` (without `q`).
- Expected:
  - HTTP 400;
  - error object includes `code=BAD_REQUEST`, message, and status.
- Techniques: Boundary/negative (required parameter omitted).

### TC-API-003 Trending endpoint contract
- Request: `GET /api/gifs/trending?limit=5&offset=0`.
- Expected:
  - HTTP 200;
  - payload shape matches `{ items, totalCount }`.
- Techniques: Contract validation + basic pagination parameter check.

### TC-API-004 GIF by id missing entity
- Request: `GET /api/gifs/not-existing-id-123456789`.
- Expected:
  - HTTP 404;
  - error contract includes status and code.
- Techniques: Error handling (negative upstream response).

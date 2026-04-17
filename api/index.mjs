import handlerModule from '../dist/giphy-list/server/server.mjs';

const reqHandler =
  typeof handlerModule?.reqHandler === 'function'
    ? handlerModule.reqHandler
    : typeof handlerModule?.default === 'function'
      ? handlerModule.default
      : null;

if (!reqHandler) {
  throw new Error('SSR request handler not found in dist/giphy-list/server/server.mjs');
}

// #region agent log
const instrumentedHandler = async (req, res) => {
  fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '981d77',
    },
    body: JSON.stringify({
      sessionId: '981d77',
      runId: 'vercel-deploy-check',
      hypothesisId: 'H4-H5',
      location: 'api/index.mjs:instrumentedHandler',
      message: 'Vercel function entry reached',
      data: { url: req?.url ?? '', method: req?.method ?? '' },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  return reqHandler(req, res);
};
// #endregion

export default instrumentedHandler;

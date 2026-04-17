let cachedHandler = null;

function logDebug(hypothesisId, message, data) {
  // #region agent log
  fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '981d77',
    },
    body: JSON.stringify({
      sessionId: '981d77',
      runId: 'vercel-deploy-check',
      hypothesisId,
      location: 'api/index.mjs:handler',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function resolveHandler() {
  if (cachedHandler) return cachedHandler;

  const mod = await import('../dist/giphy-list/server/server.mjs');
  const reqHandler =
    typeof mod?.reqHandler === 'function'
      ? mod.reqHandler
      : typeof mod?.default === 'function'
        ? mod.default
        : null;

  if (!reqHandler) {
    throw new Error('SSR request handler not found in dist/giphy-list/server/server.mjs');
  }

  cachedHandler = reqHandler;
  return reqHandler;
}

export default async function instrumentedHandler(req, res) {
  logDebug('H1-H5', 'Vercel function entry reached', {
    url: req?.url ?? '',
    method: req?.method ?? '',
  });

  try {
    const handler = await resolveHandler();
    return handler(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logDebug('H1-H5', 'Vercel function handler failure', {
      url: req?.url ?? '',
      method: req?.method ?? '',
      error: message,
    });

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Debug-Stage', 'api-index-handler');
    res.end(
      JSON.stringify({
        error: {
          code: '500',
          message: 'A server error has occurred',
          debug: 'api-index-handler',
          detail: message,
        },
      }),
    );
  }
}

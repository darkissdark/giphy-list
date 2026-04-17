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
      runId: 'vercel-crash-investigation',
      hypothesisId,
      location: 'api/index.mjs',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function resolveHandler() {
  if (cachedHandler) return cachedHandler;

  logDebug('H1-H5', 'Resolving SSR module', {
    path: '../dist/giphy-list/server/server.mjs',
  });
  const mod = await import('../dist/giphy-list/server/server.mjs');
  logDebug('H1-H5', 'SSR module imported', { exports: Object.keys(mod ?? {}) });
  const reqHandler =
    typeof mod?.reqHandler === 'function'
      ? mod.reqHandler
      : typeof mod?.default === 'function'
        ? mod.default
        : null;

  if (!reqHandler) {
    const available = Object.keys(mod ?? {});
    throw new Error(
      `SSR request handler not found in dist/giphy-list/server/server.mjs (exports: ${available.join(', ')})`,
    );
  }

  cachedHandler = reqHandler;
  return reqHandler;
}

export default async function vercelSsrHandler(req, res) {
  logDebug('H1-H5', 'Vercel handler entry', {
    url: req?.url ?? '',
    method: req?.method ?? '',
  });
  try {
    const handler = await resolveHandler();
    return handler(req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logDebug('H1-H5', 'Vercel handler failure', {
      url: req?.url ?? '',
      method: req?.method ?? '',
      detail,
    });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: {
          code: 'FUNCTION_INVOCATION_FAILED',
          message: 'Vercel SSR handler failed.',
          detail,
        },
      }),
    );
  }
}

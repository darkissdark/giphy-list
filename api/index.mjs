let cachedHandler = null;

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
    const available = Object.keys(mod ?? {});
    throw new Error(
      `SSR request handler not found in dist/giphy-list/server/server.mjs (exports: ${available.join(', ')})`,
    );
  }

  cachedHandler = reqHandler;
  return reqHandler;
}

export default async function vercelSsrHandler(req, res) {
  try {
    const handler = await resolveHandler();
    return handler(req, res);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
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

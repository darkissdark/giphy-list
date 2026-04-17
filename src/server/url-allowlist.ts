export function assertAllowedGifUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    // #region agent log
    fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '981d77',
      },
      body: JSON.stringify({
        sessionId: '981d77',
        runId: 'detail-refresh-allowlist',
        hypothesisId: 'H1-H4',
        location: 'src/server/url-allowlist.ts:assertAllowedGifUrl',
        message: 'Allowlist host check',
        data: {
          inputUrl: url,
          host,
          isAllowed: host.endsWith('giphy.com') || host.endsWith('giphy.media'),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (host.endsWith('giphy.com') || host.endsWith('giphy.media')) {
      return u;
    }
  } catch {}
  return null;
}

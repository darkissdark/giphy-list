export function assertAllowedGifUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.endsWith('giphy.com') || host.endsWith('giphy.media')) {
      return u;
    }
  } catch {}
  return null;
}

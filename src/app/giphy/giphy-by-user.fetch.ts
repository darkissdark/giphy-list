import type { GiphySearchResponse } from './giphy-api.types';
import { GiphyAppError } from './giphy.errors';
import { gifMatchesAuthor, mapGiphyGifToItem } from './giphy.mapper';
import type { GifItem } from './giphy.types';

const GIPHY_SEARCH = 'https://api.giphy.com/v1/gifs/search';

export interface FetchGifsByAuthorParams {
  apiKey: string;
  username: string;
  excludeId: string;
  limit: number;
  initialOffset: number;
}

export async function fetchGifsByAuthorFromGiphy(
  p: FetchGifsByAuthorParams,
): Promise<{ items: GifItem[]; totalCount: number }> {
  const username = p.username.trim();
  if (!username || username.toLowerCase() === 'unknown') {
    throw new GiphyAppError('Parameter username is required.', 'BAD_REQUEST', 400);
  }

  const collected: GifItem[] = [];
  let apiOffset = Math.max(0, p.initialOffset);
  let rounds = 0;
  const limit = Math.min(30, Math.max(1, p.limit));
  const excludeId = p.excludeId.trim();

  while (collected.length < limit && rounds < 5) {
    const url = new URL(GIPHY_SEARCH);
    url.searchParams.set('api_key', p.apiKey);
    url.searchParams.set('q', username);
    url.searchParams.set('limit', '50');
    url.searchParams.set('offset', String(apiOffset));

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(url.toString(), { signal: controller.signal });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw new GiphyAppError('Giphy request timeout.', 'NETWORK', 0);
      }
      throw new GiphyAppError('Network error.', 'NETWORK', 0);
    } finally {
      clearTimeout(t);
    }

    if (!res.ok) {
      let message = res.statusText;
      try {
        const j = (await res.json()) as { message?: string };
        if (j.message) message = j.message;
      } catch {}
      const code = res.status === 429 ? 'RATE_LIMIT' : 'UPSTREAM';
      throw new GiphyAppError(
        res.status === 429 ? 'Giphy rate limit exceeded. Please try again later.' : message,
        code,
        res.status,
      );
    }

    const data = (await res.json()) as GiphySearchResponse;
    const batch = data.data ?? [];
    if (batch.length === 0) break;

    for (const gif of batch) {
      if (!gifMatchesAuthor(gif, username)) continue;
      if (excludeId && gif.id === excludeId) continue;
      collected.push(mapGiphyGifToItem(gif));
      if (collected.length >= limit) break;
    }

    apiOffset += batch.length;
    rounds += 1;
  }

  return { items: collected, totalCount: collected.length };
}

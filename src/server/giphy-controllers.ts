import type express from 'express';

import { fetchGifsByAuthorFromGiphy } from '../app/giphy/giphy-by-user.fetch';
import { GiphyAppError } from '../app/giphy/giphy.errors';
import { mapGiphyGifToDetails, mapGiphyGifToItem } from '../app/giphy/giphy.mapper';
import type { GifItem } from '../app/giphy/giphy.types';
import {
  TRENDING_LIST_CACHE_TTL_MS,
  createMemoryCache,
  trendingListCacheKey,
} from '../shared/memory-cache';
import { GiphyClient } from './giphy-client';
import { mapAxiosError, requireApiKey, sendError } from './http-errors';
import { fetchBinaryFromUrl } from './media-fetch';
import { getPagination } from './request-pagination';
import { assertAllowedGifUrl } from './url-allowlist';

const trendingResponseCache = createMemoryCache<{
  items: GifItem[];
  totalCount: number;
}>(TRENDING_LIST_CACHE_TTL_MS);

export function createGiphyControllers(giphy: GiphyClient) {
  return {
    search: async (req: express.Request, res: express.Response) => {
      const apiKey = requireApiKey(res);
      if (!apiKey) return;

      const q = String(req.query['q'] ?? '').trim();
      if (!q) {
        sendError(res, 400, 'Parameter q is required.', 'BAD_REQUEST');
        return;
      }

      const { limit, offset } = getPagination(req);

      try {
        const data = await giphy.search({ apiKey, q, limit, offset });
        const items = (data.data ?? []).map(mapGiphyGifToItem);
        const totalCount = data.pagination?.total_count ?? items.length;
        res.json({ items, totalCount });
      } catch (e) {
        mapAxiosError(e, res);
      }
    },

    trending: async (req: express.Request, res: express.Response) => {
      const apiKey = requireApiKey(res);
      if (!apiKey) return;

      const { limit, offset } = getPagination(req);

      const key = trendingListCacheKey(limit, offset);
      const cached = trendingResponseCache.get(key);
      if (cached) {
        res.json(cached);
        return;
      }

      try {
        const data = await giphy.trending({ apiKey, limit, offset });
        const items = (data.data ?? []).map(mapGiphyGifToItem);
        const totalCount = data.pagination?.total_count ?? items.length;
        const body = { items, totalCount };
        trendingResponseCache.set(key, body);
        res.json(body);
      } catch (e) {
        mapAxiosError(e, res);
      }
    },

    download: async (req: express.Request, res: express.Response) => {
      const rawUrl = String(req.query['url'] ?? '');
      const filename =
        String(req.query['filename'] ?? 'giphy.gif').replace(/[^\w.-]+/g, '_') || 'giphy.gif';

      const parsed = assertAllowedGifUrl(rawUrl);
      if (!parsed) {
        sendError(res, 400, 'Invalid or disallowed GIF URL.', 'BAD_REQUEST');
        return;
      }

      try {
        const { data, contentType } = await fetchBinaryFromUrl(parsed.toString());
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(Buffer.from(data));
      } catch (e) {
        mapAxiosError(e, res);
      }
    },

    byUser: async (req: express.Request, res: express.Response) => {
      const apiKey = requireApiKey(res);
      if (!apiKey) return;

      const username = String(req.query['username'] ?? '').trim();
      if (!username || username.toLowerCase() === 'unknown') {
        sendError(res, 400, 'Parameter username is required.', 'BAD_REQUEST');
        return;
      }

      const excludeId = String(req.query['excludeId'] ?? '').trim();
      const { limit, offset: initialOffset } = getPagination(req, {
        maxLimit: 30,
      });

      try {
        const result = await fetchGifsByAuthorFromGiphy({
          apiKey,
          username,
          excludeId,
          limit,
          initialOffset,
        });
        res.json(result);
      } catch (e) {
        if (e instanceof GiphyAppError) {
          sendError(res, e.status ?? 500, e.message, e.code);
          return;
        }
        mapAxiosError(e, res);
      }
    },

    getById: async (req: express.Request, res: express.Response) => {
      const apiKey = requireApiKey(res);
      if (!apiKey) return;

      const id = String(req.params['id'] ?? '').trim();
      if (!id) {
        sendError(res, 400, 'GIF id is required.', 'BAD_REQUEST');
        return;
      }

      try {
        const data = await giphy.getById(apiKey, id);
        if (!data.data) {
          sendError(res, 404, 'GIF not found.', 'UPSTREAM');
          return;
        }
        res.json({ data: mapGiphyGifToDetails(data.data) });
      } catch (e) {
        mapAxiosError(e, res);
      }
    },
  };
}

export type GiphyControllers = ReturnType<typeof createGiphyControllers>;

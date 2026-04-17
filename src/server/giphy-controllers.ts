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
      // #region agent log
      fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '981d77',
        },
        body: JSON.stringify({
          sessionId: '981d77',
          runId: 'trending-cache-path',
          hypothesisId: 'H1-H5',
          location: 'src/server/giphy-controllers.ts:trending',
          message: 'Trending API request start',
          data: { offset, limit, host: String(req.headers['host'] ?? '') },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const key = trendingListCacheKey(limit, offset);
      const cached = trendingResponseCache.get(key);
      if (cached) {
        // #region agent log
        fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '981d77',
          },
          body: JSON.stringify({
            sessionId: '981d77',
            runId: 'trending-cache-path',
            hypothesisId: 'H1-H5',
            location: 'src/server/giphy-controllers.ts:trending',
            message: 'Trending API memory-cache hit',
            data: { offset, limit },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        res.json(cached);
        return;
      }

      try {
        const data = await giphy.trending({ apiKey, limit, offset });
        const items = (data.data ?? []).map(mapGiphyGifToItem);
        const totalCount = data.pagination?.total_count ?? items.length;
        const body = { items, totalCount };
        trendingResponseCache.set(key, body);
        // #region agent log
        fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '981d77',
          },
          body: JSON.stringify({
            sessionId: '981d77',
            runId: 'trending-cache-path',
            hypothesisId: 'H1-H5',
            location: 'src/server/giphy-controllers.ts:trending',
            message: 'Trending API upstream fetch and cache set',
            data: { offset, limit, items: body.items.length },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        res.json(body);
      } catch (e) {
        mapAxiosError(e, res);
      }
    },

    download: async (req: express.Request, res: express.Response) => {
      const rawUrl = String(req.query['url'] ?? '');
      const filename =
        String(req.query['filename'] ?? 'giphy.gif').replace(/[^\w.-]+/g, '_') || 'giphy.gif';
      // #region agent log
      fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '981d77',
        },
        body: JSON.stringify({
          sessionId: '981d77',
          runId: 'detail-refresh-download',
          hypothesisId: 'H1-H5',
          location: 'src/server/giphy-controllers.ts:download',
          message: 'Download endpoint called',
          data: {
            rawUrl,
            filename,
            referer: String(req.headers['referer'] ?? ''),
            host: String(req.headers['host'] ?? ''),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const parsed = assertAllowedGifUrl(rawUrl);
      if (!parsed) {
        let rawHost = '';
        try {
          rawHost = new URL(rawUrl).hostname.toLowerCase();
        } catch {}
        // #region agent log
        fetch('http://127.0.0.1:7367/ingest/892d3f42-fe50-4aa8-b486-4b0c3b939b4a', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '981d77',
          },
          body: JSON.stringify({
            sessionId: '981d77',
            runId: 'detail-refresh-download',
            hypothesisId: 'H1-H5',
            location: 'src/server/giphy-controllers.ts:download',
            message: 'Download URL rejected by allowlist',
            data: {
              rawUrl,
              rawHost,
              referer: String(req.headers['referer'] ?? ''),
              host: String(req.headers['host'] ?? ''),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        res.setHeader('X-Debug-Rejected-Host', rawHost || 'invalid-url');
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid or disallowed GIF URL.',
            debug: {
              rejectedHost: rawHost || 'invalid-url',
              rawUrl,
            },
          },
        });
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

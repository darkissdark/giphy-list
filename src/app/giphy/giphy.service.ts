import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Injectable,
  PLATFORM_ID,
  REQUEST,
  TransferState,
  inject,
  makeStateKey,
} from '@angular/core';
import { Observable, catchError, from, map, of, throwError } from 'rxjs';
import {
  TRENDING_LIST_CACHE_TTL_MS,
  createMemoryCache,
  trendingListCacheKey,
} from '../../shared/memory-cache';
import { fetchGifsByAuthorFromGiphy } from './giphy-by-user.fetch';
import { ApiErrorBody, GiphyAppError } from './giphy.errors';
import type { GifDetails, GifItem } from './giphy.types';

export const GIPHY_PAGE_SIZE = 16;

export type TrendingListPayload = { items: GifItem[]; totalCount: number };

export function giphyTrendingTransferKey(limit: number) {
  return makeStateKey<string>(`giphy:trending:0:${limit}`);
}

@Injectable({ providedIn: 'root' })
export class GiphyService {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);

  private readonly trendingListCache =
    createMemoryCache<TrendingListPayload>(TRENDING_LIST_CACHE_TTL_MS);

  search(
    query: string,
    offset: number,
    limit = GIPHY_PAGE_SIZE,
  ): Observable<{ items: GifItem[]; totalCount: number }> {
    const q = query.trim();
    const url = `${this.apiBase()}/api/gifs/search`;
    return this.http
      .get<{ items: GifItem[]; totalCount: number }>(url, {
        params: { q, offset: String(offset), limit: String(limit) },
      })
      .pipe(catchError((err) => throwError(() => this.mapHttpError(err))));
  }

  trending(
    offset: number,
    limit = GIPHY_PAGE_SIZE,
  ): Observable<{ items: GifItem[]; totalCount: number }> {
    const transferKey = giphyTrendingTransferKey(limit);
    const cacheKey = trendingListCacheKey(limit, offset);

    if (isPlatformBrowser(this.platformId)) {
      const cached = this.trendingListCache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    if (
      offset === 0 &&
      !isPlatformServer(this.platformId) &&
      this.transferState.hasKey(transferKey)
    ) {
      const raw = this.transferState.get(transferKey, '');
      this.transferState.remove(transferKey);
      if (raw) {
        try {
          const body = JSON.parse(raw) as TrendingListPayload;
          this.trendingListCache.set(cacheKey, body);
          return of(body);
        } catch {}
      }
    }

    const url = `${this.apiBase()}/api/gifs/trending`;
    return this.http
      .get<{ items: GifItem[]; totalCount: number }>(url, {
        params: { offset: String(offset), limit: String(limit) },
      })
      .pipe(
        map((body) => {
          if (offset === 0 && isPlatformServer(this.platformId)) {
            this.transferState.set(transferKey, JSON.stringify(body));
          }
          if (isPlatformBrowser(this.platformId)) {
            this.trendingListCache.set(cacheKey, body);
          }
          return body;
        }),
        catchError((err) => throwError(() => this.mapHttpError(err))),
      );
  }

  getGifById(id: string): Observable<GifDetails> {
    const url = `${this.apiBase()}/api/gifs/${encodeURIComponent(id)}`;
    return this.http
      .get<{ data: GifDetails }>(url)
      .pipe(
        map((r) => r.data),
        catchError((err) => throwError(() => this.mapHttpError(err))),
      );
  }

  getByAuthor(
    username: string,
    excludeGifId: string,
    offset: number,
    limit: number,
  ): Observable<{ items: GifItem[]; totalCount: number }> {
    const u = username.trim();
    const shouldTransfer = isPlatformServer(this.platformId) && offset === 0;

    const key = makeStateKey<string>(
      `giphy:byuser:${u.toLowerCase()}:${excludeGifId}:${limit}`,
    );

    if (!isPlatformServer(this.platformId) && this.transferState.hasKey(key)) {
      const raw = this.transferState.get(key, '');
      this.transferState.remove(key);
      if (raw) {
        try {
          return of(
            JSON.parse(raw) as { items: GifItem[]; totalCount: number },
          );
        } catch {}
      }
    }

    if (isPlatformServer(this.platformId)) {
      const apiKey =
        typeof process !== 'undefined' && process.env
          ? process.env['GIPHY_API_KEY']?.trim()
          : undefined;
      if (!apiKey) {
        return throwError(
          () =>
            new GiphyAppError(
              'GIPHY_API_KEY is not set.',
              'BAD_REQUEST',
              500,
            ),
        );
      }
      return from(
        fetchGifsByAuthorFromGiphy({
          apiKey,
          username: u,
          excludeId: excludeGifId,
          limit,
          initialOffset: offset,
        }),
      ).pipe(
        map((body) => {
          if (shouldTransfer) {
            this.transferState.set(key, JSON.stringify(body));
          }
          return body;
        }),
        catchError((err) =>
          throwError(() =>
            err instanceof GiphyAppError
              ? err
              : new GiphyAppError(
                  'Failed to load author GIFs.',
                  'UNKNOWN',
                ),
          ),
        ),
      );
    }

    const url = `${this.apiBase()}/api/gifs/by-user`;
    return this.http
      .get<{ items: GifItem[]; totalCount: number }>(url, {
        params: {
          username: u,
          excludeId: excludeGifId,
          offset: String(offset),
          limit: String(limit),
        },
      })
      .pipe(catchError((err) => throwError(() => this.mapHttpError(err))));
  }

  downloadUrl(originalUrl: string, filename: string): string {
    const params = new URLSearchParams({
      url: originalUrl,
      filename: filename || 'giphy.gif',
    });
    return `${this.apiBase()}/api/gifs/download?${params.toString()}`;
  }

  private apiBase(): string {
    if (isPlatformServer(this.platformId)) {
      const req = this.request;
      if (!req) return '';
      const headers = req.headers;
      const xfp =
        typeof (headers as Headers).get === 'function'
          ? (headers as Headers).get('x-forwarded-proto')
          : (headers as unknown as Record<string, string | string[] | undefined>)[
              'x-forwarded-proto'
            ];
      const host =
        typeof (headers as Headers).get === 'function'
          ? (headers as Headers).get('host')
          : (headers as unknown as Record<string, string | string[] | undefined>)[
              'host'
            ];
      const proto =
        (Array.isArray(xfp) ? xfp[0] : xfp)?.split(',')[0]?.trim() || 'http';
      const hostName = (Array.isArray(host) ? host[0] : host) || 'localhost';
      return `${proto}://${hostName}`;
    }
    if (isPlatformBrowser(this.platformId)) {
      const loc = globalThis.location;
      return `${loc.protocol}//${loc.host}`;
    }
    return '';
  }

  private mapHttpError(err: unknown): GiphyAppError {
    if (err instanceof GiphyAppError) return err;
    if (err instanceof HttpErrorResponse) {
      const body = err.error as Partial<ApiErrorBody> | string | null;
      if (
        body &&
        typeof body === 'object' &&
        'error' in body &&
        body.error &&
        typeof body.error.message === 'string'
      ) {
        return new GiphyAppError(
          body.error.message,
          body.error.code ?? 'UNKNOWN',
          body.error.status ?? err.status,
        );
      }
      if (err.status === 429) {
        return new GiphyAppError(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT',
          429,
        );
      }
      if (err.status === 0) {
        return new GiphyAppError(
          'No connection to server.',
          'NETWORK',
          0,
        );
      }
      return new GiphyAppError(
        err.message || 'An error occurred.',
        'UPSTREAM',
        err.status,
      );
    }
    return new GiphyAppError('Unknown error.', 'UNKNOWN');
  }
}

import { computed, signal } from '@angular/core';
import { TimeoutError, catchError, finalize, of, timeout } from 'rxjs';
import { GiphyAppError } from '../giphy/giphy.errors';
import type { GifItem } from '../giphy/giphy.types';

export const GIF_LIST_REQUEST_TIMEOUT_MS = 20_000;

export type GifListPagePayload = { items: GifItem[]; totalCount: number };

export type GifListPageLoader = (
  offset: number,
  limit: number,
) => import('rxjs').Observable<GifListPagePayload>;

export interface GifListErrorMessages {
  initial: string;
  loadMore: string;
}

export interface PagedGifListStoreOptions {
  pageSize: number;
  messages: GifListErrorMessages;
  skipReplaceIfSameHead?: boolean;
}

export class PagedGifListStore {
  private loader: GifListPageLoader | null = null;
  private requestSeq = 0;

  readonly items = signal<GifItem[]>([]);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadedOnce = signal(false);

  readonly offset = computed(() => this.items().length);
  readonly hasMore = computed(() => {
    const len = this.items().length;
    return len > 0 && len < this.totalCount();
  });

  constructor(private readonly options: PagedGifListStoreOptions) {}

  setLoader(next: GifListPageLoader | null): void {
    this.loader = next;
  }

  reset(): void {
    this.requestSeq++;
    this.items.set([]);
    this.totalCount.set(0);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.error.set(null);
    this.loadedOnce.set(false);
  }

  loadFirstPage(): void {
    this.loadPage(0, 'replace');
  }

  loadMorePage(): void {
    if (this.loading() || this.loadingMore()) return;
    if (this.items().length >= this.totalCount()) return;
    this.loadPage(this.offset(), 'append');
  }

  retry(): void {
    this.reset();
    this.loadFirstPage();
  }

  private loadPage(offset: number, mode: 'replace' | 'append'): void {
    const loader = this.loader;
    if (!loader) return;

    const isAppend = mode === 'append';
    this.error.set(null);

    if (isAppend) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(this.items().length === 0);
    }

    const reqId = ++this.requestSeq;
    loader(offset, this.options.pageSize)
      .pipe(
        timeout(GIF_LIST_REQUEST_TIMEOUT_MS),
        catchError((e: unknown) => {
          if (reqId !== this.requestSeq) return of(null);
          this.error.set(this.mapError(e, isAppend));
          return of(null);
        }),
        finalize(() => {
          if (reqId !== this.requestSeq) return;
          this.loading.set(false);
          this.loadingMore.set(false);
        }),
      )
      .subscribe((res) => {
        if (reqId !== this.requestSeq) return;
        if (!res) return;
        this.applyResult(res, isAppend);
      });
  }

  private applyResult(res: GifListPagePayload, append: boolean): void {
    if (
      !append &&
      this.options.skipReplaceIfSameHead &&
      res.items.length > 0 &&
      this.items().length === res.items.length &&
      this.items()[0]?.id === res.items[0]?.id
    ) {
      return;
    }

    if (append) {
      const ids = new Set(this.items().map((i) => i.id));
      const next = res.items.filter((i) => !ids.has(i.id));
      this.items.set([...this.items(), ...next]);
    } else {
      this.items.set(res.items);
    }
    this.totalCount.set(res.totalCount);
    this.loadedOnce.set(true);
  }

  private mapError(e: unknown, isLoadMore: boolean): string {
    if (e instanceof TimeoutError) {
      return 'The server is not responding. Please try again.';
    }
    if (e instanceof GiphyAppError) return e.message;
    return isLoadMore ? this.options.messages.loadMore : this.options.messages.initial;
  }
}


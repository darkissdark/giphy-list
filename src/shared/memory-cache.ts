export const TRENDING_LIST_CACHE_TTL_MS = 1 * 60 * 1000;

export function trendingListCacheKey(limit: number, offset: number): string {
  return `${limit}:${offset}`;
}

export interface MemoryCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export function createMemoryCache<T>(ttlMs: number) {
  const store = new Map<string, MemoryCacheEntry<T>>();

  function pruneExpired(): void {
    const now = Date.now();
    for (const [key, row] of store) {
      if (now >= row.expiresAt) store.delete(key);
    }
  }

  return {
    get(key: string): T | undefined {
      pruneExpired();
      const row = store.get(key);
      if (!row) return undefined;
      if (Date.now() >= row.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return row.value;
    },

    set(key: string, value: T): void {
      pruneExpired();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}

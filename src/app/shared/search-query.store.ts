import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchQueryStore {
  private readonly queryRaw = signal('');

  readonly query = computed(() => this.queryRaw().trim());

  setQuery(next: string): void {
    this.queryRaw.set(next);
  }
}

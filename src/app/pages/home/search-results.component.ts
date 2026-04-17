import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  debounce,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  timer,
} from 'rxjs';
import { GifListComponent } from '../../components/gif-list/gif-list.component';
import { GIPHY_PAGE_SIZE, GiphyService } from '../../giphy/giphy.service';
import { PagedGifListStore } from '../../shared/paged-gif-list.store';

@Component({
  standalone: true,
  selector: 'app-search-results',
  imports: [NgIf, GifListComponent],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent {
  readonly query = input.required<string>();

  private readonly giphy = inject(GiphyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly store = new PagedGifListStore({
    pageSize: GIPHY_PAGE_SIZE,
    messages: {
      initial: 'Search failed.',
      loadMore: 'Failed to load more results.',
    },
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        map((q) => q.trim()),
        distinctUntilChanged(),
        debounce((q) => (q ? timer(300) : of(null))),
        switchMap((q) => {
          if (!q) {
            this.store.setLoader(null);
            this.store.reset();
            return of(null);
          }
          this.store.setLoader((offset, limit) =>
            this.giphy.search(q, offset, limit),
          );
          this.store.reset();
          this.store.loadFirstPage();
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onLoadMore(): void {
    this.store.loadMorePage();
  }

  retry(): void {
    const q = this.query().trim();
    if (!q) return;
    this.store.setLoader((offset, limit) => this.giphy.search(q, offset, limit));
    this.store.retry();
  }

  get hasMore(): boolean {
    return this.store.hasMore();
  }

  get showEmpty(): boolean {
    return (
      this.store.loadedOnce() &&
      !this.store.loading() &&
      !this.store.error() &&
      this.store.items().length === 0 &&
      this.query().trim().length > 0
    );
  }
}

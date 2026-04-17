import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { GifListComponent } from '../../components/gif-list/gif-list.component';
import { GIPHY_PAGE_SIZE, GiphyService } from '../../giphy/giphy.service';
import { PagedGifListStore } from '../../shared/paged-gif-list.store';

@Component({
  standalone: true,
  selector: 'app-trending-list',
  imports: [NgIf, GifListComponent],
  templateUrl: './trending-list.component.html',
  styleUrl: './trending-list.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendingListComponent implements OnInit {
  private readonly giphy = inject(GiphyService);

  readonly store = new PagedGifListStore({
    pageSize: GIPHY_PAGE_SIZE,
    skipReplaceIfSameHead: true,
    messages: {
      initial: 'Failed to load trending GIFs.',
      loadMore: 'Failed to load more results.',
    },
  });

  ngOnInit(): void {
    this.store.setLoader((offset, limit) => this.giphy.trending(offset, limit));
    this.store.loadFirstPage();
  }

  onLoadMore(): void {
    this.store.loadMorePage();
  }

  retry(): void {
    this.store.retry();
  }

  get hasMore(): boolean {
    return this.store.hasMore();
  }
}

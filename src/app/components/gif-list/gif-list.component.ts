import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import type { GifItem } from '../../giphy/giphy.types';
import { GifCardComponent } from '../gif-card/gif-card.component';

@Component({
  standalone: true,
  selector: 'app-gif-list',
  imports: [GifCardComponent],
  templateUrl: './gif-list.component.html',
  styleUrl: './gif-list.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifListComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = input.required<GifItem[]>();
  readonly gridAriaLabel = input('');
  readonly hasMore = input(false);
  readonly loadingMore = input(false);
  readonly loadMoreClick = output<void>();

  columns: GifItem[][] = [];

  private columnsCount = 4;
  private renderedIds: string[] = [];

  constructor() {
    effect(() => {
      this.items();
      this.syncColumns();
    });
  }

  onViewportResize(): void {
    const next = this.resolveColumnsCount();
    if (next === this.columnsCount) return;
    this.columnsCount = next;
    this.reflowAll(this.items());
  }

  itemIndex(id: string): number {
    return this.items().findIndex((item) => item.id === id);
  }

  private syncColumns(): void {
    const nextColumnsCount = this.resolveColumnsCount();
    const source = this.items();

    if (nextColumnsCount !== this.columnsCount) {
      this.columnsCount = nextColumnsCount;
      this.reflowAll(source);
      return;
    }

    if (!this.isRenderedPrefix(source)) {
      this.reflowAll(source);
      return;
    }

    if (source.length > this.renderedIds.length) {
      this.appendTail(source.slice(this.renderedIds.length), this.renderedIds.length);
      this.renderedIds = source.map((item) => item.id);
    }
  }

  private reflowAll(source: GifItem[]): void {
    this.columns = Array.from({ length: this.columnsCount }, () => [] as GifItem[]);
    this.appendTail(source, 0);
    this.renderedIds = source.map((item) => item.id);
  }

  private appendTail(tail: GifItem[], startIndex: number): void {
    if (this.columns.length !== this.columnsCount) {
      this.columns = Array.from({ length: this.columnsCount }, () => [] as GifItem[]);
    }
    tail.forEach((item, index) => {
      const globalIndex = startIndex + index;
      this.columns[globalIndex % this.columnsCount]!.push(item);
    });
  }

  private isRenderedPrefix(source: GifItem[]): boolean {
    if (source.length < this.renderedIds.length) return false;
    for (let i = 0; i < this.renderedIds.length; i++) {
      if (source[i]?.id !== this.renderedIds[i]) return false;
    }
    return true;
  }

  private resolveColumnsCount(): number {
    if (!isPlatformBrowser(this.platformId)) return 4;
    const width = globalThis.innerWidth;
    if (width >= 720) return 4;
    if (width >= 520) return 3;
    return 2;
  }
}

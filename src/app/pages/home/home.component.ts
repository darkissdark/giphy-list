import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SearchResultsComponent } from './search-results.component';
import { TrendingListComponent } from './trending-list.component';
import { SearchQueryStore } from '../../shared/search-query.store';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [TrendingListComponent, SearchResultsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly searchStore = inject(SearchQueryStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly searchTrimmed = this.searchStore.query;

  ngOnInit(): void {
    const title = 'GIF Search';
    const description = 'Search and discover trending GIFs.';
    const image = '/favicon.png';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }
}

import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EMPTY,
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  of,
  switchMap,
  tap,
  timeout,
} from 'rxjs';
import { GifListComponent } from '../../components/gif-list/gif-list.component';
import { GiphyAppError } from '../../giphy/giphy.errors';
import { GiphyService } from '../../giphy/giphy.service';
import type { GifDetails, GifItem } from '../../giphy/giphy.types';
import { createCopyFeedback } from '../../shared/copy-feedback';

@Component({
  standalone: true,
  selector: 'app-gif-detail-page',
  imports: [NgIf, RouterLink, ClipboardModule, GifListComponent],
  templateUrl: './gif-detail-page.component.html',
  styleUrl: './gif-detail-page.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly giphy = inject(GiphyService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  authorLoading = false;
  authorFetchDone = false;
  error: string | null = null;
  details: GifDetails | null = null;
  authorItems: GifItem[] = [];

  imgSrc = '';
  imgWebpSrc = '';
  private imgTriedFallback = false;

  private readonly copy = createCopyFeedback(this.destroyRef, {
    idleLabel: 'Copy link',
    copiedLabel: 'Copied!',
    ms: 1200,
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('id')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        tap(() => {
          this.authorLoading = false;
          this.authorFetchDone = false;
          this.error = null;
          this.details = null;
          this.authorItems = [];
          this.imgSrc = '';
          this.imgWebpSrc = '';
          this.imgTriedFallback = false;
          this.copy.reset();
          this.cdr.markForCheck();
        }),
        switchMap((id) =>
          this.giphy.getGifById(id).pipe(
            catchError((e: unknown) => {
              this.error =
                e instanceof GiphyAppError
                  ? e.message
                  : 'Failed to load GIF.';
              this.applyDefaultSeo();
              return of(null);
            }),
            switchMap((details) => {
              if (!details) {
                this.cdr.markForCheck();
                return EMPTY;
              }

              this.details = details;
              this.imgWebpSrc = details.webpUrl || '';
              this.imgSrc = details.previewUrl || details.originalUrl || details.webpUrl;
              this.applySeo(details);
              this.cdr.markForCheck();

              const handle = details.authorUsername?.trim();
              if (!handle) {
                this.authorFetchDone = true;
                this.cdr.markForCheck();
                return EMPTY;
              }

              this.authorLoading = true;
              this.cdr.markForCheck();

              return this.giphy.getByAuthor(handle, id, 0, 24).pipe(
                timeout(25_000),
                tap((res) => {
                  this.authorItems = res.items;
                }),
                catchError(() => {
                  this.authorItems = [];
                  return of(null);
                }),
                finalize(() => {
                  this.authorLoading = false;
                  this.authorFetchDone = true;
                  this.cdr.markForCheck();
                }),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onImgError(): void {
    if (this.imgTriedFallback) return;
    this.imgTriedFallback = true;
    this.imgSrc = 'https://placehold.co/480x270?text=Image%20not%20found';
    this.cdr.markForCheck();
  }

  onCopied(): void {
    this.copy.onCopied();
    this.cdr.markForCheck();
  }

  get copyLabel(): string {
    return this.copy.label();
  }

  get copyDisabled(): boolean {
    return this.copy.disabled();
  }

  downloadHref(): string {
    if (!this.details) return '#';
    const safeName = `${this.details.title || 'giphy'}`.replace(
      /[^\w.\-]+/g,
      '_',
    );
    return this.giphy.downloadUrl(this.details.originalUrl, `${safeName}.gif`);
  }

  private applySeo(details: GifDetails): void {
    const pageTitle = details.title?.trim() || 'GIF details';
    const description = `View and share "${pageTitle}" GIF details.`;
    const image = details.originalUrl || details.previewUrl;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  private applyDefaultSeo(): void {
    const pageTitle = 'GIF details';
    const description = 'View GIF metadata and share links.';
    const image = '/favicon.png';
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }
}

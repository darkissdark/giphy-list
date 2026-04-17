import { ClipboardModule } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { GifItem } from '../../giphy/giphy.types';
import { createCopyFeedback } from '../../shared/copy-feedback';

@Component({
  selector: 'app-gif-card',
  standalone: true,
  imports: [RouterLink, ClipboardModule],
  templateUrl: './gif-card.component.html',
  styleUrl: './gif-card.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifCardComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) gif!: GifItem;

  readonly highFetchPriority = input(false);

  displaySrc = '';
  displayWebpSrc = '';
  isLoaded = false;
  private triedFallback = false;

  private readonly copy = createCopyFeedback(this.destroyRef, {
    idleLabel: 'Share',
    copiedLabel: 'Copied!',
    ms: 1200,
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gif']) {
      this.displayWebpSrc = this.gif?.webpUrl || '';
      this.displaySrc = this.gif?.previewUrl || '';
      this.isLoaded = false;
      this.triedFallback = false;
      this.copy.reset();
      this.cdr.markForCheck();
    }
  }

  onLoad(): void {
    this.isLoaded = true;
    this.cdr.markForCheck();
  }

  onImgError(): void {
    if (this.triedFallback) return;
    this.triedFallback = true;
    this.displaySrc = 'https://placehold.co/480x270?text=Image%20not%20found';
    this.isLoaded = true;
    this.cdr.markForCheck();
  }

  onShareCopied(): void {
    this.copy.onCopied();
    this.cdr.markForCheck();
  }

  get shareLabel(): string {
    return this.copy.label();
  }

  get copyDisabled(): boolean {
    return this.copy.disabled();
  }

  get thumbAspectRatio(): string {
    const w = this.gif?.width ?? 0;
    const h = this.gif?.height ?? 0;
    if (w > 0 && h > 0) return `${w} / ${h}`;
    return '1 / 1';
  }
}

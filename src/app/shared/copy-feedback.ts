import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

export interface CopyFeedbackOptions {
  idleLabel: string;
  copiedLabel: string;
  ms?: number;
}

export function createCopyFeedback(
  destroyRef: DestroyRef,
  options: CopyFeedbackOptions,
) {
  const ms = options.ms ?? 1200;
  const label = signal(options.idleLabel);
  const disabled = signal(false);

  const reset$ = new Subject<void>();
  reset$.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
    label.set(options.idleLabel);
    disabled.set(false);
  });

  let timer: ReturnType<typeof setTimeout> | null = null;

  function reset(): void {
    if (timer) clearTimeout(timer);
    timer = null;
    label.set(options.idleLabel);
    disabled.set(false);
  }

  function onCopied(): void {
    if (disabled()) return;
    label.set(options.copiedLabel);
    disabled.set(true);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      reset$.next();
    }, ms);
  }

  destroyRef.onDestroy(() => {
    if (timer) clearTimeout(timer);
    timer = null;
    reset$.complete();
  });

  return { label, disabled, onCopied, reset };
}


import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { Icon } from './icon';

/** Copies `text` to the clipboard and confirms in place ("Copied"). */
@Component({
  selector: 'site-copy',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-sm px-2 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors hover:bg-raised hover:text-ink"
      (click)="copy()"
      [attr.aria-label]="ariaLabel() || null"
    >
      <site-icon [name]="state() === 'copied' ? 'check' : 'copy'" [size]="14" />
      @switch (state()) {
        @case ('copied') {<span>Copied</span>}
        @case ('failed') {<span>Copy failed</span>}
        @default {<span [class.sr-only]="iconOnly()">{{ label() }}</span>}
      }
    </button>
    <span class="sr-only" aria-live="polite">{{ state() === 'copied' ? 'Copied to clipboard' : '' }}</span>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class CopyButton {
  readonly text = input.required<string>();
  readonly label = input('Copy');
  readonly ariaLabel = input('');
  /** Show only the icon until copied. */
  readonly iconOnly = input(false);

  protected readonly state = signal<'idle' | 'copied' | 'failed'>('idle');
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.state.set('copied');
    } catch {
      this.state.set('failed');
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), 1600);
  }
}

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** Copies `text` to the clipboard and confirms in place ("Copied"). */
@Component({
  selector: 'site-copy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="copy" (click)="copy()" [attr.aria-label]="ariaLabel() || null">
      @switch (state()) {
        @case ('copied') {<span>Copied</span>}
        @case ('failed') {<span>Copy failed</span>}
        @default {<span>{{ label() }}</span>}
      }
    </button>
    <span class="visually-hidden" aria-live="polite">{{ state() === 'copied' ? 'Copied to clipboard' : '' }}</span>
  `,
  styles: `
    .copy {
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--sunken);
      color: var(--ink);
      font: 500 12.5px/1 var(--font-body);
      cursor: pointer;
      white-space: nowrap;
    }
    .copy:hover {
      border-color: var(--line-strong);
    }
  `,
})
export class CopyButton {
  readonly text = input.required<string>();
  readonly label = input('Copy');
  readonly ariaLabel = input('');

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

import { ChangeDetectionStrategy, Component, afterNextRender, computed, input, signal } from '@angular/core';

import { Icon } from './icon';

type Theme = 'system' | 'light' | 'dark';

const KEY = 'ng-email-theme';
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const;

/** Cycles the color theme: system, light, dark. Stored per browser. */
@Component({
  selector: 'site-theme-toggle',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="flex cursor-pointer items-center justify-center gap-1 rounded-md text-ink-2 transition-colors hover:bg-raised hover:text-ink"
      [class.flex-col]="stacked()"
      [class.size-16]="stacked()"
      [class.size-9]="!stacked()"
      [attr.aria-label]="'Theme: ' + label() + '. Switch to ' + nextLabel()"
      [title]="'Theme: ' + label()"
      (click)="cycle()"
    >
      <site-icon [name]="icon()" [size]="20" />
      @if (stacked()) {<span class="text-xs">{{ label() }}</span>}
    </button>
  `,
  host: { class: 'inline-flex' },
})
export class ThemeToggle {
  /** Icon above its label, for the side rail. */
  readonly stacked = input(false);

  protected readonly theme = signal<Theme>('system');
  protected readonly label = computed(() => LABEL[this.theme()]);
  protected readonly nextLabel = computed(() => LABEL[NEXT[this.theme()]].toLowerCase());
  protected readonly icon = computed(() => ICON[this.theme()]);

  constructor() {
    // Prerendered pages don't know the choice; read it once in the browser.
    afterNextRender(() => {
      const saved = document.documentElement.getAttribute('data-theme');
      if (saved === 'light' || saved === 'dark') this.theme.set(saved);
    });
  }

  protected cycle(): void {
    const theme = NEXT[this.theme()];
    this.theme.set(theme);
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      if (theme === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // Storage blocked: the choice lasts until the page is closed.
    }
  }
}

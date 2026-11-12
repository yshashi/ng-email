import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The header card at the top of each page, after angular.dev's: a gradient
 * banner for the index pages, a quiet card for everything else.
 * Project the description (and any actions) as content.
 */
@Component({
  selector: 'site-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="overflow-hidden rounded-lg px-6 py-8 sm:px-10 sm:py-10"
      [class.bg-banner]="banner()"
      [class.text-white]="banner()"
      [class.border]="!banner()"
      [class.border-line]="!banner()"
      [class.bg-raised]="!banner()"
    >
      @if (crumbs().length) {
        <p class="mb-3 flex flex-wrap items-center gap-2 text-sm" [class]="banner() ? 'text-white/80' : 'text-muted'">
          @for (crumb of crumbs(); track crumb; let last = $last) {
            <span>{{ crumb }}</span>
            @if (!last) {<span aria-hidden="true">›</span>}
          }
        </p>
      }
      <h1 class="text-3xl tracking-[-0.02em] sm:text-4xl">{{ title() }}</h1>
      <div class="mt-3 max-w-2xl text-base sm:text-lg" [class]="banner() ? 'text-white/90' : 'text-ink-2'">
        <ng-content />
      </div>
      <ng-content select="[actions]" />
    </header>
  `,
  host: { class: 'block' },
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly crumbs = input<string[]>([]);
  /** The gradient banner, for index pages. */
  readonly banner = input(false);
}

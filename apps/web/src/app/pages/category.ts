import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { blockCategories } from '../registry';
import type { Category, SiteItem } from '../registry.types';
import { BlockViewer } from '../shared/block-viewer';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'site-category',
  imports: [RouterLink, RouterLinkActive, BlockViewer, Icon, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto grid max-w-page grid-cols-1 gap-x-10 px-4 pt-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10 lg:pt-10">
      <nav class="lg:sticky lg:top-10 lg:max-h-[calc(100vh-80px)] lg:self-start lg:overflow-auto" aria-label="Component categories">
        <a routerLink="/components" class="inline-flex h-8 items-center gap-2 font-display text-md font-medium transition-colors hover:text-accent">
          <site-icon name="chevron-left" />
          Components
        </a>
        <!-- Desktop: a list on a rail line. Phones: a row that scrolls sideways. -->
        <ul class="-mx-4 mt-3 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:mt-4 lg:flex-col lg:gap-0 lg:border-l lg:border-line lg:px-0">
          @for (c of categories; track c.slug) {
            <li class="shrink-0">
              <a
                [routerLink]="['/components', c.slug]"
                routerLinkActive="is-active"
                ariaCurrentWhenActive="page"
                class="side-link max-lg:ml-0 max-lg:rounded-md max-lg:border max-lg:border-line max-lg:px-3 max-lg:whitespace-nowrap"
              >
                {{ c.name }}<span class="text-sm font-normal text-muted tabular-nums">{{ c.items.length }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="min-w-0">
        <site-page-header class="mt-6 lg:mt-0" [title]="data().category.name" [crumbs]="['Components', data().category.name]">
          {{ data().items.length }} {{ data().items.length === 1 ? 'block' : 'blocks' }}. Each is one standalone component.
          Place it inside your email's <code class="code-inline">table ngeContainer</code>.
        </site-page-header>
        <div class="mt-12 grid gap-16">
          @for (item of data().items; track item.name) {
            <site-block-viewer [item]="item" />
          }
        </div>
      </div>
    </div>
  `,
})
export class CategoryPage {
  /** Resolved by the route (categoryResolver). */
  readonly data = input.required<{ category: Category; items: SiteItem[] }>();
  protected readonly categories = blockCategories();
}

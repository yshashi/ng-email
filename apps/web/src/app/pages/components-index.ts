import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { blockCategories, catalog, countOf } from '../registry';
import type { CatalogEntry } from '../registry.types';
import { Icon } from '../shared/icon';
import { PageHeader } from '../shared/page-header';

@Component({
  selector: 'site-components-index',
  imports: [RouterLink, Icon, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-page px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <site-page-header title="Components" [banner]="true">
        {{ count }} email blocks built from ng-email's table-safe primitives. Preview each one, copy the Angular code, or
        add it to your project with one command.
      </site-page-header>

      <ul class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (category of categories; track category.slug) {
          <li class="flex flex-col rounded-lg border border-line bg-card transition-colors hover:border-line-strong">
            <a [routerLink]="['/components', category.slug]" class="group flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <h2 class="text-xl group-hover:text-accent">{{ category.name }}</h2>
              <span class="text-sm text-muted tabular-nums">
                {{ category.items.length }} {{ category.items.length === 1 ? 'block' : 'blocks' }}
              </span>
            </a>
            <ul class="px-2 pb-3">
              @for (item of entries(category.items); track item.name) {
                <li>
                  <a
                    [routerLink]="['/components', category.slug]"
                    [fragment]="item.name"
                    class="flex h-9 items-center justify-between gap-2 rounded-md px-3 text-md text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                  >
                    {{ item.title }}
                    <site-icon name="chevron-right" [size]="14" class="text-muted" />
                  </a>
                </li>
              }
            </ul>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ComponentsIndexPage {
  protected readonly count = countOf('block');
  protected readonly categories = blockCategories();

  protected entries(names: string[]): CatalogEntry[] {
    return names.map((name) => catalog.find((e) => e.name === name)!);
  }
}

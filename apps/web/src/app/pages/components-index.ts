import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { blockCategories, catalog, countOf } from '../registry';
import type { CatalogEntry } from '../registry.types';

@Component({
  selector: 'site-components-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <h1>Components</h1>
      <p>
        {{ count }} email blocks, built from ng-email's table-safe primitives. Preview each one with X-ray, copy the
        Angular code, or add it to your project with <code>npx ng-email add &lt;name&gt;</code>.
      </p>
    </header>

    <ul class="cats">
      @for (category of categories; track category.slug) {
        <li class="cat">
          <a class="cat__link" [routerLink]="['/components', category.slug]">
            <h2>{{ category.name }}</h2>
            <span class="cat__count">{{ category.items.length }} {{ category.items.length === 1 ? 'block' : 'blocks' }}</span>
          </a>
          <ul class="cat__items">
            @for (item of entries(category.items); track item.name) {
              <li>
                <a [routerLink]="['/components', category.slug]" [fragment]="item.name">{{ item.title }}</a>
              </li>
            }
          </ul>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      width: var(--page);
      margin: 0 auto;
    }
    .page-head {
      padding: 56px 0 32px;
      max-width: 48em;
    }
    .page-head h1 {
      font-size: clamp(36px, 5vw, 56px);
      font-variation-settings: 'wdth' 88;
    }
    .page-head p {
      margin-top: 12px;
      font-size: 17px;
      color: var(--muted);
    }
    .page-head code {
      font-size: 0.86em;
      background: var(--sunken);
      padding: 1px 6px;
      border-radius: 4px;
      color: var(--ink);
    }
    .cats {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    .cat {
      border: 1px solid var(--line);
      border-radius: var(--radius-l);
      background: var(--surface);
      overflow: hidden;
    }
    .cat:hover {
      border-color: var(--line-strong);
    }
    .cat__link {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 18px 18px 12px;
      text-decoration: none;
    }
    .cat__link h2 {
      font-size: 21px;
    }
    .cat__link:hover h2 {
      text-decoration: underline;
      text-decoration-color: var(--xray);
      text-underline-offset: 4px;
    }
    .cat__count {
      font: 12px/1 var(--font-mono);
      color: var(--muted);
      white-space: nowrap;
    }
    .cat__items {
      list-style: none;
      margin: 0;
      padding: 0 18px 16px;
      display: grid;
      gap: 4px;
      font-size: 14.5px;
    }
    .cat__items a {
      color: var(--muted);
      text-decoration: none;
    }
    .cat__items a:hover {
      color: var(--ink);
    }
  `,
})
export class ComponentsIndexPage {
  protected readonly count = countOf('block');
  protected readonly categories = blockCategories();

  protected entries(names: string[]): CatalogEntry[] {
    return names.map((name) => catalog.find((e) => e.name === name)!);
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { blockCategories } from '../registry';
import type { Category, SiteItem } from '../registry.types';
import { BlockViewer } from '../shared/block-viewer';

@Component({
  selector: 'site-category',
  imports: [RouterLink, RouterLinkActive, BlockViewer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <nav class="side" aria-label="Component categories">
        <a routerLink="/components" class="side__all">All components</a>
        <ul>
          @for (c of categories; track c.slug) {
            <li>
              <a [routerLink]="['/components', c.slug]" routerLinkActive="is-active" [attr.aria-current]="c.slug === data().category.slug ? 'page' : null">
                {{ c.name }}<span>{{ c.items.length }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="content">
        <header class="page-head">
          <h1>{{ data().category.name }}</h1>
          <p>{{ data().items.length }} {{ data().items.length === 1 ? 'block' : 'blocks' }}. Each is one self-contained
            standalone component; drop it inside your email's <code>table ngeContainer</code>.</p>
        </header>
        <div class="list">
          @for (item of data().items; track item.name) {
            <site-block-viewer [item]="item" />
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: var(--page);
      margin: 0 auto;
    }
    .layout {
      display: grid;
      grid-template-columns: 200px minmax(0, 1fr);
      gap: 40px;
      padding-top: 40px;
    }
    .side {
      position: sticky;
      top: 84px;
      align-self: start;
      max-height: calc(100vh - 100px);
      overflow: auto;
      font-size: 14.5px;
    }
    .side__all {
      display: block;
      margin-bottom: 10px;
      color: var(--muted);
      text-decoration: none;
      font-size: 13px;
    }
    .side__all::before {
      content: '← ';
    }
    .side ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 2px;
    }
    .side li a {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      border-radius: var(--radius-s);
      text-decoration: none;
      color: var(--muted);
    }
    .side li a:hover {
      color: var(--ink);
    }
    .side li a.is-active {
      background: var(--surface);
      color: var(--ink);
      font-weight: 600;
      box-shadow: inset 2px 0 0 var(--xray);
    }
    .side li span {
      font: 11.5px/1.8 var(--font-mono);
      color: var(--muted);
    }
    .page-head {
      padding: 16px 0 28px;
    }
    .page-head h1 {
      font-size: clamp(34px, 4.6vw, 52px);
      font-variation-settings: 'wdth' 88;
    }
    .page-head p {
      margin-top: 10px;
      color: var(--muted);
      max-width: 44em;
    }
    .page-head code {
      font-size: 0.86em;
      background: var(--sunken);
      padding: 1px 6px;
      border-radius: 4px;
      color: var(--ink);
    }
    /* min-width: 0 lets the column shrink below its widest child (code, toolbars). */
    .content {
      min-width: 0;
    }
    .list {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }
    @media (max-width: 860px) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
        padding-top: 20px;
      }
      .side {
        position: static;
        max-height: none;
      }
      .side ul {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 6px;
      }
      .side li a {
        white-space: nowrap;
        gap: 8px;
        border: 1px solid var(--line);
      }
      .side li a.is-active {
        box-shadow: none;
        border-color: var(--xray);
      }
    }
  `,
})
export class CategoryPage {
  /** Resolved by the route (categoryResolver). */
  readonly data = input.required<{ category: Category; items: SiteItem[] }>();
  protected readonly categories = blockCategories();
}

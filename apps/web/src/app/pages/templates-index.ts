import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { SiteItem } from '../registry.types';
import { EmailFrame } from '../shared/email-frame';

@Component({
  selector: 'site-templates-index',
  imports: [RouterLink, EmailFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <h1>Templates</h1>
      <p>
        Complete emails for the moments every product needs. Each is one Angular component with typed inputs: copy it, or run
        <code>npx ng-email add &lt;name&gt;</code>, then change the copy and colors to match your brand.
      </p>
    </header>

    <ul class="grid">
      @for (t of templates(); track t.name) {
        <li>
          <a class="card" [routerLink]="['/templates', t.name]">
            <div class="card__thumb" aria-hidden="true">
              <div class="card__scale">
                <site-email-frame [html]="t.html" [title]="t.title + ' thumbnail'" [minHeight]="640" />
              </div>
            </div>
            <div class="card__body">
              <span class="card__cat">{{ t.category }}</span>
              <h2>{{ t.title }}</h2>
              <p>{{ t.description }}</p>
            </div>
          </a>
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
    .grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
    }
    .card {
      display: block;
      border: 1px solid var(--line);
      border-radius: var(--radius-l);
      background: var(--surface);
      overflow: hidden;
      text-decoration: none;
      transition: border-color 0.15s, transform 0.15s;
    }
    .card:hover {
      border-color: var(--ink);
      transform: translateY(-2px);
    }
    /* A live render, scaled down: the thumbnail is the real email, not a screenshot. */
    .card__thumb {
      height: 300px;
      overflow: hidden;
      /* The templates' own email background, so short emails don't show a band. */
      background: #f3f4f6;
      border-bottom: 1px solid var(--line);
      pointer-events: none;
    }
    .card__scale {
      width: 200%;
      transform: scale(0.5);
      transform-origin: top left;
    }
    .card__body {
      padding: 16px 18px 18px;
    }
    .card__cat {
      font: 500 11.5px/1 var(--font-mono);
      color: var(--xray);
      letter-spacing: 0.02em;
    }
    .card__body h2 {
      margin-top: 8px;
      font-size: 21px;
    }
    .card__body p {
      margin-top: 4px;
      color: var(--muted);
      font-size: 14.5px;
    }
  `,
})
export class TemplatesIndexPage {
  /** Resolved by the route (allTemplatesResolver). */
  readonly templates = input.required<SiteItem[]>();
}
